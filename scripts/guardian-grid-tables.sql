-- Guardian Grid Tables

-- Guardian users table
CREATE TABLE IF NOT EXISTS guardian_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'inactive', -- 'active', 'inactive'
  gps_tile VARCHAR(10),
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  is_guardian BOOLEAN DEFAULT false,
  guardian_since TIMESTAMP WITH TIME ZONE,
  settings JSONB DEFAULT '{}',
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Guardian events table (behavior detection logs)
CREATE TABLE IF NOT EXISTS guardian_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email VARCHAR(255) REFERENCES guardian_users(email),
  tile_code VARCHAR(10) NOT NULL,
  trigger_type VARCHAR(50) NOT NULL, -- 'motion', 'audio', 'keyword', 'loitering'
  severity_level VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
  description TEXT,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed BOOLEAN DEFAULT false,
  actions_taken JSONB DEFAULT '[]'
);

-- Guardian audio recordings table
CREATE TABLE IF NOT EXISTS guardian_audio (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email VARCHAR(255) REFERENCES guardian_users(email),
  audio_url TEXT,
  transcript TEXT,
  tile_code VARCHAR(10),
  threat_level VARCHAR(20) DEFAULT 'medium',
  keywords_detected JSONB DEFAULT '[]',
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed BOOLEAN DEFAULT false
);

-- Tile summaries table (AI-generated safety summaries)
CREATE TABLE IF NOT EXISTS tile_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tile_code VARCHAR(10) UNIQUE NOT NULL,
  safety_level VARCHAR(20) DEFAULT 'monitored', -- 'safe', 'monitored', 'caution', 'danger'
  incident_count INTEGER DEFAULT 0,
  guardian_count INTEGER DEFAULT 0,
  summary_text TEXT,
  last_incident TIMESTAMP WITH TIME ZONE,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  coordinates JSONB -- {lat, lng}
);

-- Guardian alerts table (community alerts)
CREATE TABLE IF NOT EXISTS guardian_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  tile_code VARCHAR(10) NOT NULL,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  description TEXT,
  triggered_by VARCHAR(255) REFERENCES guardian_users(email),
  guardians_alerted JSONB DEFAULT '[]',
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'resolved', 'false_alarm'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_guardian_users_tile ON guardian_users(gps_tile);
CREATE INDEX IF NOT EXISTS idx_guardian_users_location ON guardian_users USING GIST (ST_Point(location_lng, location_lat));
CREATE INDEX IF NOT EXISTS idx_guardian_users_active ON guardian_users(status, last_active);
CREATE INDEX IF NOT EXISTS idx_guardian_users_is_guardian ON guardian_users(is_guardian, status);

CREATE INDEX IF NOT EXISTS idx_guardian_events_tile ON guardian_events(tile_code);
CREATE INDEX IF NOT EXISTS idx_guardian_events_severity ON guardian_events(severity_level, triggered_at);
CREATE INDEX IF NOT EXISTS idx_guardian_events_location ON guardian_events USING GIST (ST_Point(location_lng, location_lat));
CREATE INDEX IF NOT EXISTS idx_guardian_events_time ON guardian_events(triggered_at);

CREATE INDEX IF NOT EXISTS idx_guardian_audio_tile ON guardian_audio(tile_code);
CREATE INDEX IF NOT EXISTS idx_guardian_audio_threat ON guardian_audio(threat_level, triggered_at);

CREATE INDEX IF NOT EXISTS idx_tile_summaries_code ON tile_summaries(tile_code);
CREATE INDEX IF NOT EXISTS idx_tile_summaries_safety ON tile_summaries(safety_level, last_updated);

CREATE INDEX IF NOT EXISTS idx_guardian_alerts_tile ON guardian_alerts(tile_code, status);
CREATE INDEX IF NOT EXISTS idx_guardian_alerts_location ON guardian_alerts USING GIST (ST_Point(location_lng, location_lat));
CREATE INDEX IF NOT EXISTS idx_guardian_alerts_time ON guardian_alerts(created_at, status);

-- Enable Row Level Security
ALTER TABLE guardian_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardian_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardian_audio ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardian_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for Guardian Grid
CREATE POLICY "Users can view own guardian data" ON guardian_users FOR SELECT USING (auth.uid()::text = email);
CREATE POLICY "Users can update own guardian data" ON guardian_users FOR UPDATE USING (auth.uid()::text = email);
CREATE POLICY "Users can insert own guardian data" ON guardian_users FOR INSERT WITH CHECK (auth.uid()::text = email);

CREATE POLICY "Users can view own guardian events" ON guardian_events FOR SELECT USING (auth.uid()::text = user_email);
CREATE POLICY "Users can create guardian events" ON guardian_events FOR INSERT WITH CHECK (auth.uid()::text = user_email);

CREATE POLICY "Users can view own audio recordings" ON guardian_audio FOR SELECT USING (auth.uid()::text = user_email);
CREATE POLICY "Users can create audio recordings" ON guardian_audio FOR INSERT WITH CHECK (auth.uid()::text = user_email);

-- Tile summaries and alerts are publicly readable for safety
CREATE POLICY "Tile summaries are publicly readable" ON tile_summaries FOR SELECT USING (true);
CREATE POLICY "Guardian alerts are publicly readable" ON guardian_alerts FOR SELECT USING (true);

-- Functions for tile management
CREATE OR REPLACE FUNCTION update_tile_summary(p_tile_code VARCHAR(10))
RETURNS void AS $$
BEGIN
  INSERT INTO tile_summaries (tile_code, incident_count, last_updated)
  VALUES (p_tile_code, 1, NOW())
  ON CONFLICT (tile_code) 
  DO UPDATE SET 
    incident_count = tile_summaries.incident_count + 1,
    last_updated = NOW(),
    last_incident = NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger to update tile summaries when events are created
CREATE OR REPLACE FUNCTION trigger_update_tile_summary()
RETURNS trigger AS $$
BEGIN
  PERFORM update_tile_summary(NEW.tile_code);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER guardian_events_tile_update
  AFTER INSERT ON guardian_events
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_tile_summary();
