-- Seed data for Guardian Grid

-- Insert sample guardian users
INSERT INTO guardian_users (email, status, gps_tile, location_lat, location_lng, is_guardian, guardian_since, settings) VALUES
('sarah.k@example.com', 'active', 'ABC123', 28.6315, 77.2167, true, NOW() - INTERVAL '30 days', '{"voiceDeterrent": true, "autoFlash": true, "anonymousMode": false}'),
('guardian.anon1@example.com', 'active', 'ABC124', 28.6320, 77.2170, true, NOW() - INTERVAL '15 days', '{"voiceDeterrent": true, "autoFlash": false, "anonymousMode": true}'),
('priya.m@example.com', 'inactive', 'ABC125', 28.6325, 77.2175, true, NOW() - INTERVAL '60 days', '{"voiceDeterrent": false, "autoFlash": true, "anonymousMode": false}'),
('guardian.anon2@example.com', 'active', 'ABC126', 28.6330, 77.2180, true, NOW() - INTERVAL '7 days', '{"voiceDeterrent": true, "autoFlash": true, "anonymousMode": true}'),
('demo@hersafety.app', 'active', 'ABC127', 28.6335, 77.2185, false, NULL, '{"voiceDeterrent": true, "autoFlash": true, "anonymousMode": false}');

-- Insert sample guardian events
INSERT INTO guardian_events (user_email, tile_code, trigger_type, severity_level, description, location_lat, location_lng, triggered_at) VALUES
('demo@hersafety.app', 'ABC123', 'audio', 'high', 'High audio level detected - possible distress', 28.6315, 77.2167, NOW() - INTERVAL '2 hours'),
('sarah.k@example.com', 'ABC124', 'motion', 'medium', 'Sudden movement detected', 28.6320, 77.2170, NOW() - INTERVAL '4 hours'),
('demo@hersafety.app', 'ABC125', 'keyword', 'critical', 'Distress keyword detected: help', 28.6325, 77.2175, NOW() - INTERVAL '1 day'),
('guardian.anon1@example.com', 'ABC126', 'loitering', 'low', 'Extended stay in same location detected', 28.6330, 77.2180, NOW() - INTERVAL '6 hours'),
('demo@hersafety.app', 'ABC127', 'audio', 'high', 'Suspicious audio pattern detected', 28.6335, 77.2185, NOW() - INTERVAL '30 minutes');

-- Insert sample tile summaries
INSERT INTO tile_summaries (tile_code, safety_level, incident_count, guardian_count, summary_text, last_incident, coordinates) VALUES
('ABC123', 'safe', 1, 3, 'Well-patrolled area with good lighting and regular foot traffic. Multiple guardians active. Recent minor incident resolved quickly.', NOW() - INTERVAL '2 hours', '{"lat": 28.6315, "lng": 77.2167}'),
('ABC124', 'monitored', 2, 2, 'Moderate activity area with some guardian presence. Occasional minor incidents but generally secure during daylight hours.', NOW() - INTERVAL '4 hours', '{"lat": 28.6320, "lng": 77.2170}'),
('ABC125', 'caution', 5, 1, 'Area with increased incident reports. Limited guardian coverage. Recent critical incident reported. Recommend avoiding after dark.', NOW() - INTERVAL '1 day', '{"lat": 28.6325, "lng": 77.2175}'),
('ABC126', 'monitored', 1, 2, 'Residential area with moderate guardian presence. Low incident rate but requires continued monitoring.', NOW() - INTERVAL '6 hours', '{"lat": 28.6330, "lng": 77.2180}'),
('ABC127', 'caution', 3, 1, 'Commercial area with mixed safety record. Recent audio anomalies detected. Increased vigilance recommended.', NOW() - INTERVAL '30 minutes', '{"lat": 28.6335, "lng": 77.2185}');

-- Insert sample guardian alerts
INSERT INTO guardian_alerts (alert_type, severity, tile_code, location_lat, location_lng, description, triggered_by, guardians_alerted, status) VALUES
('behavior_detection', 'critical', 'ABC125', 28.6325, 77.2175, 'Critical behavior alert: Distress keyword detected', 'demo@hersafety.app', '["sarah.k@example.com", "guardian.anon1@example.com"]', 'resolved'),
('audio_anomaly', 'high', 'ABC127', 28.6335, 77.2185, 'High audio level detected - possible distress situation', 'demo@hersafety.app', '["guardian.anon2@example.com"]', 'active'),
('motion_alert', 'medium', 'ABC124', 28.6320, 77.2170, 'Sudden violent movement detected', 'sarah.k@example.com', '["guardian.anon1@example.com"]', 'resolved');
