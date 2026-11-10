-- One row per game played.
CREATE TABLE IF NOT EXISTS matches (
  id             SERIAL PRIMARY KEY,
  max_points     INTEGER NOT NULL CHECK (max_points BETWEEN 25 AND 1000),
  status         TEXT NOT NULL DEFAULT 'in_progress'
                 CHECK (status IN ('in_progress', 'finished')),
  current_player INTEGER NOT NULL DEFAULT 0,   -- seat number whose turn it is
  winner_seat    INTEGER,                      -- filled in when the match ends
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at    TIMESTAMPTZ
);

-- One row per player in a match. Scores live here, on the server.
CREATE TABLE IF NOT EXISTS match_players (
  id             SERIAL PRIMARY KEY,
  match_id       INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  avatar         INTEGER NOT NULL,             -- which pig picture (0, 1, 2 ...)
  seat           INTEGER NOT NULL,             -- turn order (0, 1, 2 ...)
  running_points INTEGER NOT NULL DEFAULT 0,   -- points not yet banked this turn
  total_points   INTEGER NOT NULL DEFAULT 0,   -- banked points
  double_down_used BOOLEAN NOT NULL DEFAULT FALSE, -- Double Down power-up: one per player per game
  UNIQUE (match_id, seat)
);

-- Makes the history list (newest first) fast.
CREATE INDEX IF NOT EXISTS idx_matches_created_at ON matches (created_at DESC);

-- For databases created before the Double Down power-up existed (safe to run again).
ALTER TABLE match_players ADD COLUMN IF NOT EXISTS double_down_used BOOLEAN NOT NULL DEFAULT FALSE;
