-- Live tracking tables for real-time route monitoring

-- Live tracking table
CREATE TABLE IF NOT EXISTS live_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL,
  route_id VARCHAR(100) NOT NULL,
  current_lat DECIMAL(10, 8) NOT NULL,
  current_lng DECIMAL(11, 8) NOT NULL,
  status VARCHAR(50) DEFAULT 'in_progress', -- 'started', 'in_progress', 'completed', 'emergency'
  speed DECIMAL(5, 2), -- km/h
  heading DECIMAL(5, 2), -- degrees
  accuracy DECIMAL(8, 2), -- meters
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  battery_level INTEGER, -- percentage
  is_emergency BOOLEAN DEFAULT false
);

-- Shared routes table
CREATE TABLE IF NOT EXISTS shared_routes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  route_id VARCHAR(100) UNIQUE NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  origin_address TEXT NOT NULL,
  destination_address TEXT NOT NULL,
  origin_lat DECIMAL(10, 8) NOT NULL,
  origin_lng DECIMAL(11, 8) NOT NULL,
  destination_lat DECIMAL(10, 8) NOT NULL,
  destination_lng DECIMAL(11, 8) NOT NULL,
  shared_with JSONB DEFAULT '[]', -- Array of contact emails/phones
  estimated_duration INTEGER, -- minutes
  safety_score INTEGER DEFAULT 75,
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'cancelled'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Route waypoints table (for detailed route tracking)
CREATE TABLE IF NOT EXISTS route_waypoints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  route_id VARCHAR(100) NOT NULL,
  sequence_number INTEGER NOT NULL,
  waypoint_lat DECIMAL(10, 8) NOT NULL,
  waypoint_lng DECIMAL(11, 8) NOT NULL,
  instruction TEXT,
  distance_to_next INTEGER, -- meters
  estimated_time INTEGER, -- seconds
  is_checkpoint BOOLEAN DEFAULT false,
  passed_at TIMESTAMP WITH TIME ZONE
);

-- Safety alerts table (for route monitoring)
CREATE TABLE IF NOT EXISTS route_safety_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  route_id VARCHAR(100) NOT NULL,
  alert_type VARCHAR(50) NOT NULL, -- 'deviation', 'unsafe_area', 'no_movement', 'emergency'
  severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
  description TEXT NOT NULL,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'active' -- 'active', 'resolved', 'false_alarm'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_live_tracking_route ON live_tracking(route_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_live_tracking_user ON live_tracking(user_email, timestamp);
CREATE INDEX IF NOT EXISTS idx_live_tracking_location ON live_tracking USING GIST (ST_Point(current_lng, current_lat));
CREATE INDEX IF NOT EXISTS idx_live_tracking_status ON live_tracking(status, timestamp);

CREATE INDEX IF NOT EXISTS idx_shared_routes_id ON shared_routes(route_id);
CREATE INDEX IF NOT EXISTS idx_shared_routes_user ON shared_routes(user_email, status);
CREATE INDEX IF NOT EXISTS idx_shared_routes_created ON shared_routes(created_at);

CREATE INDEX IF NOT EXISTS idx_route_waypoints_route ON route_waypoints(route_id, sequence_number);
CREATE INDEX IF NOT EXISTS idx_route_waypoints_location ON route_waypoints USING GIST (ST_Point(waypoint_lng, waypoint_lat));

CREATE INDEX IF NOT EXISTS idx_route_alerts_route ON route_safety_alerts(route_id, status);
CREATE INDEX IF NOT EXISTS idx_route_alerts_severity ON route_safety_alerts(severity, triggered_at);

-- Enable Row Level Security
ALTER TABLE live_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_waypoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_safety_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own tracking data" ON live_tracking FOR SELECT USING (auth.uid()::text = user_email);
CREATE POLICY "Users can insert own tracking data" ON live_tracking FOR INSERT WITH CHECK (auth.uid()::text = user_email);

CREATE POLICY "Users can view own shared routes" ON shared_routes FOR SELECT USING (auth.uid()::text = user_email);
CREATE POLICY "Users can create shared routes" ON shared_routes FOR INSERT WITH CHECK (auth.uid()::text = user_email);
CREATE POLICY "Users can update own shared routes" ON shared_routes FOR UPDATE USING (auth.uid()::text = user_email);

-- Waypoints and alerts are viewable by route participants
CREATE POLICY "Route waypoints are viewable by participants" ON route_waypoints FOR SELECT USING (true);
CREATE POLICY "Route alerts are viewable by participants" ON route_safety_alerts FOR SELECT USING (true);

-- Function to check for route deviations
CREATE OR REPLACE FUNCTION check_route_deviation(
  p_route_id VARCHAR(100),
  p_current_lat DECIMAL(10, 8),
  p_current_lng DECIMAL(11, 8)
)
RETURNS BOOLEAN AS $$
DECLARE
  deviation_threshold DECIMAL := 0.5; -- 500 meters
  min_distance DECIMAL;
BEGIN
  -- Find minimum distance to any waypoint
  SELECT MIN(
    ST_Distance(
      ST_Point(waypoint_lng, waypoint_lat)::geography,
      ST_Point(p_current_lng, p_current_lat)::geography
    )
  ) / 1000 INTO min_distance -- Convert to km
  FROM route_waypoints 
  WHERE route_id = p_route_id;
  
  -- Return true if deviation exceeds threshold
  RETURN COALESCE(min_distance, 999) > deviation_threshold;
END;
$$ LANGUAGE plpgsql;

-- Function to update route status
CREATE OR REPLACE FUNCTION update_route_status()
RETURNS trigger AS $$
BEGIN
  -- Check if user has reached destination
  IF NEW.status = 'completed' THEN
    UPDATE shared_routes 
    SET status = 'completed', completed_at = NOW()
    WHERE route_id = NEW.route_id;
  END IF;
  
  -- Check for route deviation
  IF check_route_deviation(NEW.route_id, NEW.current_lat, NEW.current_lng) THEN
    INSERT INTO route_safety_alerts (route_id, alert_type, severity, description, location_lat, location_lng)
    VALUES (NEW.route_id, 'deviation', 'medium', 'User has deviated from planned route', NEW.current_lat, NEW.current_lng);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update route status
CREATE TRIGGER live_tracking_status_update
  AFTER INSERT OR UPDATE ON live_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_route_status();
