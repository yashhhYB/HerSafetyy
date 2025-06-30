-- Insert sample safe zones
INSERT INTO safe_zones (name, type, latitude, longitude, state, description) VALUES
('Connaught Place', 'safe', 28.6315, 77.2167, 'Delhi', 'Well-lit commercial area with good security'),
('India Gate', 'safe', 28.6129, 77.2295, 'Delhi', 'Popular tourist spot with police presence'),
('Karol Bagh Market', 'caution', 28.6519, 77.1909, 'Delhi', 'Crowded market area - stay alert'),
('Lajpat Nagar', 'avoid', 28.5653, 77.2434, 'Delhi', 'Reported incidents after dark'),
('Cyber City Gurgaon', 'safe', 28.4950, 77.0890, 'Haryana', 'Corporate area with good security'),
('Marine Drive', 'safe', 18.9441, 72.8262, 'Maharashtra', 'Well-patrolled waterfront area'),
('Bandra West', 'safe', 19.0596, 72.8295, 'Maharashtra', 'Upscale residential area'),
('Dadar Station', 'caution', 19.0176, 72.8562, 'Maharashtra', 'Busy railway station - stay alert');

-- Insert sample alerts
INSERT INTO alerts (title, summary, latitude, longitude, severity) VALUES
('Construction Work', 'Road construction causing poor lighting on MG Road', 28.6139, 77.2090, 'medium'),
('Increased Patrolling', 'Police have increased patrolling in Sector 18 area', 28.4950, 77.0890, 'low'),
('Safety Advisory', 'Avoid isolated areas near Yamuna Bank after 8 PM', 28.6562, 77.2410, 'high'),
('Community Alert', 'Suspicious activity reported in Laxmi Nagar area', 28.6345, 77.2767, 'medium');

-- Insert sample emergency contacts data structure
INSERT INTO users (id, email, emergency_contacts) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'demo@example.com', 
'[
  {"name": "Emergency Contact 1", "phone": "+919876543210", "relationship": "Family"},
  {"name": "Emergency Contact 2", "phone": "+918765432109", "relationship": "Friend"},
  {"name": "Emergency Contact 3", "phone": "+917654321098", "relationship": "Colleague"}
]'::jsonb);
