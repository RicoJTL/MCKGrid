-- Seed Production Database with Development Data
-- Run this in the Production database pane

-- Insert League
INSERT INTO leagues (id, name, description, season_start, season_end)
VALUES (1, 'MAN Can Kart', 'The main racing series for the year.', '2025-12-26 16:46:22.508', '2026-12-26 16:46:22.508')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  season_start = EXCLUDED.season_start,
  season_end = EXCLUDED.season_end;

-- Insert Competition
INSERT INTO competitions (id, league_id, name, type, rules)
VALUES (1, 1, 'Individual Championship', 'series', '{"pointsSystem": {"1": 25, "2": 18, "3": 15, "4": 12, "5": 10}}')
ON CONFLICT (id) DO UPDATE SET
  league_id = EXCLUDED.league_id,
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  rules = EXCLUDED.rules;

-- Insert Race
INSERT INTO races (id, competition_id, name, date, location, status)
VALUES (1, 1, 'Media Day', '2026-02-14 17:00:00', 'Lakeside', 'scheduled')
ON CONFLICT (id) DO UPDATE SET
  competition_id = EXCLUDED.competition_id,
  name = EXCLUDED.name,
  date = EXCLUDED.date,
  location = EXCLUDED.location,
  status = EXCLUDED.status;

-- Reset sequences to avoid ID conflicts for future inserts
SELECT setval('leagues_id_seq', (SELECT MAX(id) FROM leagues));
SELECT setval('competitions_id_seq', (SELECT MAX(id) FROM competitions));
SELECT setval('races_id_seq', (SELECT MAX(id) FROM races));
