-- Run this in Supabase SQL Editor to create all tables

CREATE TABLE IF NOT EXISTS participants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  avatar_color TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS matches (
  id INTEGER PRIMARY KEY,
  match_date DATE NOT NULL,
  start_time TEXT NOT NULL,
  day_of_week TEXT NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  venue TEXT NOT NULL,
  match_type TEXT NOT NULL DEFAULT 'league',
  is_power_match BOOLEAN DEFAULT FALSE,
  underdog_team TEXT,
  winner TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  result_updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS predictions (
  id SERIAL PRIMARY KEY,
  match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
  participant_id TEXT REFERENCES participants(id) ON DELETE CASCADE,
  predicted_team TEXT NOT NULL,
  prediction_time TIMESTAMPTZ,
  UNIQUE(match_id, participant_id)
);

CREATE TABLE IF NOT EXISTS jokers (
  participant_id TEXT PRIMARY KEY REFERENCES participants(id) ON DELETE CASCADE,
  match_id INTEGER REFERENCES matches(id) ON DELETE SET NULL,
  declared_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS trivia (
  id SERIAL PRIMARY KEY,
  trivia_date DATE NOT NULL,
  question TEXT NOT NULL,
  correct_answer TEXT
);

CREATE TABLE IF NOT EXISTS trivia_responses (
  id SERIAL PRIMARY KEY,
  trivia_id INTEGER REFERENCES trivia(id) ON DELETE CASCADE,
  participant_id TEXT REFERENCES participants(id) ON DELETE CASCADE,
  response TEXT,
  is_correct BOOLEAN DEFAULT FALSE,
  UNIQUE(trivia_id, participant_id)
);

-- Enable Row Level Security but allow public read
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE jokers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trivia ENABLE ROW LEVEL SECURITY;
ALTER TABLE trivia_responses ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public read participants" ON participants FOR SELECT USING (true);
CREATE POLICY "Public read matches" ON matches FOR SELECT USING (true);
CREATE POLICY "Public read predictions" ON predictions FOR SELECT USING (true);
CREATE POLICY "Public read jokers" ON jokers FOR SELECT USING (true);
CREATE POLICY "Public read trivia" ON trivia FOR SELECT USING (true);
CREATE POLICY "Public read trivia_responses" ON trivia_responses FOR SELECT USING (true);

-- Service role can do everything (admin operations via API routes)
CREATE POLICY "Service role full access participants" ON participants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access matches" ON matches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access predictions" ON predictions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access jokers" ON jokers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access trivia" ON trivia FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access trivia_responses" ON trivia_responses FOR ALL USING (true) WITH CHECK (true);

-- Seed participants
INSERT INTO participants (id, name, avatar_color) VALUES
  ('bk', 'BK', '#FF6B6B'),
  ('dharaneesh', 'Dharaneesh', '#4ECDC4'),
  ('dinesh', 'Dinesh', '#45B7D1'),
  ('gerard', 'Gerard', '#96CEB4'),
  ('haroon', 'Haroon', '#FFEAA7'),
  ('kerun', 'Kerun', '#DDA0DD'),
  ('kishore', 'Kishore', '#98D8C8'),
  ('krish', 'Krish', '#F7DC6F'),
  ('naina', 'Naina', '#BB8FCE'),
  ('ramnath', 'Ramnath', '#85C1E9'),
  ('safer', 'Safer', '#F0B27A'),
  ('shakthi', 'Shakthi', '#82E0AA'),
  ('vijay', 'Vijay', '#F1948A'),
  ('jaya', 'Jaya', '#85929E'),
  ('yal', 'Yal', '#73C6B6'),
  ('alphonse', 'Alphonse', '#E59866'),
  ('guhan', 'Guhan', '#A3E4D7'),
  ('jessinth', 'Jessinth', '#F5B7B1'),
  ('kesh', 'Kesh', '#AED6F1'),
  ('panicking', 'Panicking', '#D7BDE2'),
  ('ranjith', 'Ranjith', '#A9DFBF'),
  ('selva', 'Selva', '#FAD7A0'),
  ('vamsi', 'Vamsi', '#D5F5E3'),
  ('shahul', 'Shahul', '#FADBD8'),
  ('venkat', 'Venkat', '#D6EAF8'),
  ('satish', 'Satish', '#E8DAEF'),
  ('azhar', 'Azhar', '#FCF3CF'),
  ('siva', 'Siva', '#D4EFDF'),
  ('sriram', 'Sriram', '#F9E79F')
ON CONFLICT (id) DO NOTHING;

-- Seed 70 league matches
INSERT INTO matches (id, match_date, start_time, day_of_week, home_team, away_team, venue, match_type) VALUES
  (1,'2026-03-28','19:30','Sat','RCB','SRH','Bengaluru','league'),
  (2,'2026-03-29','19:30','Sun','MI','KKR','Mumbai','league'),
  (3,'2026-03-30','19:30','Mon','RR','CSK','Guwahati','league'),
  (4,'2026-03-31','19:30','Tue','PBKS','GT','New Chandigarh','league'),
  (5,'2026-04-01','19:30','Wed','LSG','DC','Lucknow','league'),
  (6,'2026-04-02','19:30','Thu','KKR','SRH','Kolkata','league'),
  (7,'2026-04-03','19:30','Fri','CSK','PBKS','Chennai','league'),
  (8,'2026-04-04','15:30','Sat','DC','MI','Delhi','league'),
  (9,'2026-04-04','19:30','Sat','GT','RR','Ahmedabad','league'),
  (10,'2026-04-05','15:30','Sun','SRH','LSG','Hyderabad','league'),
  (11,'2026-04-05','19:30','Sun','RCB','CSK','Bengaluru','league'),
  (12,'2026-04-06','19:30','Mon','KKR','PBKS','Kolkata','league'),
  (13,'2026-04-07','19:30','Tue','RR','MI','Guwahati','league'),
  (14,'2026-04-08','19:30','Wed','DC','GT','Delhi','league'),
  (15,'2026-04-09','19:30','Thu','KKR','LSG','Kolkata','league'),
  (16,'2026-04-10','19:30','Fri','RR','RCB','Guwahati','league'),
  (17,'2026-04-11','15:30','Sat','PBKS','SRH','New Chandigarh','league'),
  (18,'2026-04-11','19:30','Sat','CSK','DC','Chennai','league'),
  (19,'2026-04-12','15:30','Sun','LSG','GT','Lucknow','league'),
  (20,'2026-04-12','19:30','Sun','MI','RCB','Mumbai','league'),
  (21,'2026-04-13','19:30','Mon','SRH','RR','Hyderabad','league'),
  (22,'2026-04-14','19:30','Tue','CSK','KKR','Chennai','league'),
  (23,'2026-04-15','19:30','Wed','RCB','LSG','Bengaluru','league'),
  (24,'2026-04-16','19:30','Thu','MI','PBKS','Mumbai','league'),
  (25,'2026-04-17','19:30','Fri','GT','KKR','Ahmedabad','league'),
  (26,'2026-04-18','15:30','Sat','RCB','DC','Bengaluru','league'),
  (27,'2026-04-18','19:30','Sat','SRH','CSK','Hyderabad','league'),
  (28,'2026-04-19','15:30','Sun','KKR','RR','Kolkata','league'),
  (29,'2026-04-19','19:30','Sun','PBKS','LSG','New Chandigarh','league'),
  (30,'2026-04-20','19:30','Mon','GT','MI','Ahmedabad','league'),
  (31,'2026-04-21','19:30','Tue','SRH','DC','Hyderabad','league'),
  (32,'2026-04-22','19:30','Wed','LSG','RR','Lucknow','league'),
  (33,'2026-04-23','19:30','Thu','MI','CSK','Mumbai','league'),
  (34,'2026-04-24','19:30','Fri','RCB','GT','Bengaluru','league'),
  (35,'2026-04-25','15:30','Sat','DC','PBKS','Delhi','league'),
  (36,'2026-04-25','19:30','Sat','RR','SRH','Jaipur','league'),
  (37,'2026-04-26','15:30','Sun','GT','CSK','Ahmedabad','league'),
  (38,'2026-04-26','19:30','Sun','LSG','KKR','Lucknow','league'),
  (39,'2026-04-27','19:30','Mon','DC','RCB','Delhi','league'),
  (40,'2026-04-28','19:30','Tue','PBKS','RR','New Chandigarh','league'),
  (41,'2026-04-29','19:30','Wed','MI','SRH','Mumbai','league'),
  (42,'2026-04-30','19:30','Thu','GT','RCB','Ahmedabad','league'),
  (43,'2026-05-01','19:30','Fri','RR','DC','Jaipur','league'),
  (44,'2026-05-02','19:30','Sat','CSK','MI','Chennai','league'),
  (45,'2026-05-03','15:30','Sun','SRH','KKR','Hyderabad','league'),
  (46,'2026-05-03','19:30','Sun','GT','PBKS','Ahmedabad','league'),
  (47,'2026-05-04','19:30','Mon','MI','LSG','Mumbai','league'),
  (48,'2026-05-05','19:30','Tue','DC','CSK','Delhi','league'),
  (49,'2026-05-06','19:30','Wed','SRH','PBKS','Hyderabad','league'),
  (50,'2026-05-07','19:30','Thu','LSG','RCB','Lucknow','league'),
  (51,'2026-05-08','19:30','Fri','DC','KKR','Delhi','league'),
  (52,'2026-05-09','19:30','Sat','RR','GT','Jaipur','league'),
  (53,'2026-05-10','15:30','Sun','CSK','LSG','Chennai','league'),
  (54,'2026-05-10','19:30','Sun','RCB','MI','Raipur','league'),
  (55,'2026-05-11','19:30','Mon','PBKS','DC','Dharamshala','league'),
  (56,'2026-05-12','19:30','Tue','GT','SRH','Ahmedabad','league'),
  (57,'2026-05-13','19:30','Wed','RCB','KKR','Raipur','league'),
  (58,'2026-05-14','19:30','Thu','PBKS','MI','Dharamshala','league'),
  (59,'2026-05-15','19:30','Fri','LSG','CSK','Lucknow','league'),
  (60,'2026-05-16','19:30','Sat','KKR','GT','Kolkata','league'),
  (61,'2026-05-17','15:30','Sun','PBKS','RCB','Dharamshala','league'),
  (62,'2026-05-17','19:30','Sun','DC','RR','Delhi','league'),
  (63,'2026-05-18','19:30','Mon','CSK','SRH','Chennai','league'),
  (64,'2026-05-19','19:30','Tue','RR','LSG','Jaipur','league'),
  (65,'2026-05-20','19:30','Wed','KKR','MI','Kolkata','league'),
  (66,'2026-05-21','19:30','Thu','CSK','GT','Chennai','league'),
  (67,'2026-05-22','19:30','Fri','SRH','RCB','Hyderabad','league'),
  (68,'2026-05-23','19:30','Sat','LSG','PBKS','Lucknow','league'),
  (69,'2026-05-24','15:30','Sun','MI','RR','Mumbai','league'),
  (70,'2026-05-24','19:30','Sun','KKR','DC','Kolkata','league')
ON CONFLICT (id) DO NOTHING;
