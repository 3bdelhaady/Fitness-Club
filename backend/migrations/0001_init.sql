CREATE TABLE IF NOT EXISTS users (
  hub_user_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  university TEXT NOT NULL DEFAULT '',
  faculty TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(hub_user_id),
  goal TEXT NOT NULL DEFAULT 'bulk',
  level TEXT NOT NULL DEFAULT 'beginner',
  gym_id INT,
  schedule JSONB NOT NULL DEFAULT '["sat","mon","wed"]',
  streak INT NOT NULL DEFAULT 0,
  theme TEXT NOT NULL DEFAULT 'light',
  lang TEXT NOT NULL DEFAULT 'ar'
);
CREATE TABLE IF NOT EXISTS gyms (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  area TEXT NOT NULL DEFAULT '',
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  rating_pct INT NOT NULL DEFAULT 80,
  members INT NOT NULL DEFAULT 0,
  focus TEXT NOT NULL DEFAULT 'تضخيم وبناء عضلات'
);
CREATE TABLE IF NOT EXISTS gym_plans (
  id SERIAL PRIMARY KEY,
  gym_id INT NOT NULL REFERENCES gyms(id),
  title TEXT NOT NULL,
  price_egp INT NOT NULL,
  period TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(hub_user_id),
  gym_id INT NOT NULL REFERENCES gyms(id),
  plan_id INT NOT NULL REFERENCES gym_plans(id),
  status TEXT NOT NULL DEFAULT 'requested',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS exercises (
  id SERIAL PRIMARY KEY,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  muscle TEXT NOT NULL DEFAULT '',
  rest_min INT NOT NULL DEFAULT 3
);
CREATE TABLE IF NOT EXISTS routines (
  id SERIAL PRIMARY KEY,
  level TEXT NOT NULL UNIQUE,
  title_ar TEXT NOT NULL,
  pct INT NOT NULL DEFAULT 10
);
CREATE TABLE IF NOT EXISTS routine_exercises (
  routine_id INT NOT NULL REFERENCES routines(id),
  exercise_id INT NOT NULL REFERENCES exercises(id),
  sets INT NOT NULL DEFAULT 3,
  reps INT NOT NULL DEFAULT 12,
  position INT NOT NULL DEFAULT 0,
  PRIMARY KEY (routine_id, exercise_id)
);
CREATE TABLE IF NOT EXISTS workouts (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(hub_user_id),
  day DATE NOT NULL DEFAULT CURRENT_DATE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS workout_sets (
  id SERIAL PRIMARY KEY,
  workout_id INT NOT NULL REFERENCES workouts(id),
  exercise_id INT NOT NULL REFERENCES exercises(id),
  set_index INT NOT NULL,
  reps INT NOT NULL DEFAULT 12,
  weight NUMERIC NOT NULL DEFAULT 0,
  done BOOLEAN NOT NULL DEFAULT false
);
CREATE TABLE IF NOT EXISTS checkins (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(hub_user_id),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS foods (
  id SERIAL PRIMARY KEY,
  name_ar TEXT NOT NULL,
  kcal INT NOT NULL,
  protein NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT '100 جم'
);
CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(hub_user_id),
  role TEXT NOT NULL,
  body TEXT NOT NULL,
  at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(hub_user_id),
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  read BOOLEAN NOT NULL DEFAULT false,
  at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS workouts_user_day ON workouts (user_id, day);
