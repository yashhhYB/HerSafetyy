-- Emergency logs table to track SOS activations
CREATE TABLE IF NOT EXISTS emergency_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  address TEXT,
  contacts_notified INTEGER DEFAULT 0,
  message TEXT NOT NULL,
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'resolved', 'false_alarm'
  response_time INTEGER, -- minutes
  notes TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_emergency_logs_user ON emergency_logs(user_email, triggered_at);
CREATE INDEX IF NOT EXISTS idx_emergency_logs_location ON emergency_logs USING GIST (ST_Point(location_lng, location_lat));
CREATE INDEX IF NOT EXISTS idx_emergency_logs_status ON emergency_logs(status, triggered_at);

-- Enable Row Level Security
ALTER TABLE emergency_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own emergency logs" ON emergency_logs FOR SELECT USING (auth.uid()::text = user_email);
CREATE POLICY "Users can create emergency logs" ON emergency_logs FOR INSERT WITH CHECK (auth.uid()::text = user_email);
CREATE POLICY "Users can update own emergency logs" ON emergency_logs FOR UPDATE USING (auth.uid()::text = user_email);

-- Function to automatically resolve old emergency logs
CREATE OR REPLACE FUNCTION auto_resolve_old_emergencies()
RETURNS void AS $$
BEGIN
  UPDATE emergency_logs 
  SET status = 'auto_resolved', resolved_at = NOW()
  WHERE status = 'active' 
    AND triggered_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to auto-resolve old emergencies (if using pg_cron extension)
-- SELECT cron.schedule('auto-resolve-emergencies', '0 */6 * * *', 'SELECT auto_resolve_old_emergencies();');
