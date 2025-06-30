-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  preferences JSONB DEFAULT '{}',
  emergency_contacts JSONB DEFAULT '[]'
);

-- Create incident_reports table
CREATE TABLE IF NOT EXISTS incident_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  type VARCHAR(100) NOT NULL,
  location TEXT NOT NULL,
  description TEXT NOT NULL,
  anonymous BOOLEAN DEFAULT true,
  media_url TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create safe_zones table
CREATE TABLE IF NOT EXISTS safe_zones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL, -- 'safe', 'avoid', 'caution'
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  state VARCHAR(100),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  summary TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  severity VARCHAR(50) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create guardian_logs table
CREATE TABLE IF NOT EXISTS guardian_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  audio_transcript TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  trigger_type VARCHAR(50) -- 'voice', 'motion', 'manual'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_incident_reports_location ON incident_reports USING GIST (ST_Point(CAST(SPLIT_PART(location, ',', 2) AS FLOAT), CAST(SPLIT_PART(location, ',', 1) AS FLOAT)));
CREATE INDEX IF NOT EXISTS idx_safe_zones_location ON safe_zones USING GIST (ST_Point(longitude, latitude));
CREATE INDEX IF NOT EXISTS idx_alerts_location ON alerts USING GIST (ST_Point(longitude, latitude));
CREATE INDEX IF NOT EXISTS idx_incident_reports_created_at ON incident_reports(created_at);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON alerts(active);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardian_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can create reports" ON incident_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own reports" ON incident_reports FOR SELECT USING (auth.uid() = user_id OR anonymous = true);

CREATE POLICY "Users can create guardian logs" ON guardian_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own guardian logs" ON guardian_logs FOR SELECT USING (auth.uid() = user_id);

-- Safe zones and alerts are publicly readable
CREATE POLICY "Safe zones are publicly readable" ON safe_zones FOR SELECT USING (true);
CREATE POLICY "Alerts are publicly readable" ON alerts FOR SELECT USING (true);
