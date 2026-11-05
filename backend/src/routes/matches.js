import { Router } from "express";
import { pool } from "../db.js";
import { getMatchState } from "../matchState.js";

const router = Router();

// Rules the server enforces. The browser can never bypass these.
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 9;
const MIN_POINTS = 25;
const MAX_POINTS = 1000;
const MAX_NAME_LENGTH = 20;
const MAX_AVATAR = 28; // pig-0.png ... pig-28.png

// Checks the data sent to us. Returns { error } or { value } (the cleaned data).
function validateNewMatch(body) {
  if (!body || typeof body !== "object") {
    return { error: "Request body must be JSON" };
  }

  const { maxPoints, players } = body;

  if (!Number.isInteger(maxPoints) || maxPoints < MIN_POINTS || maxPoints > MAX_POINTS) {
    return { error: `maxPoints must be a whole number from ${MIN_POINTS} to ${MAX_POINTS}` };
  }

  if (!Array.isArray(players) || players.length < MIN_PLAYERS || players.length > MAX_PLAYERS) {
    return { error: `players must be a list of ${MIN_PLAYERS} to ${MAX_PLAYERS} players` };
  }

  const cleanPlayers = [];
  for (const p of players) {
    if (!p || typeof p !== "object") {
      return { error: "Each player must be an object with a name and an avatar" };
    }
    const name = typeof p.name === "string" ? p.name.trim() : "";
    if (name.length < 1 || name.length > MAX_NAME_LENGTH) {
      return { error: `Each player name must be 1 to ${MAX_NAME_LENGTH} characters` };
    }
    if (!Number.isInteger(p.avatar) || p.avatar < 0 || p.avatar > MAX_AVATAR) {
      return { error: `Each avatar must be a whole number from 0 to ${MAX_AVATAR}` };
    }
    cleanPlayers.push({ name, avatar: p.avatar });
  }

  return { value: { maxPoints, players: cleanPlayers } };
}

// POST /api/matches  -> start a new match
router.post("/", async (req, res, next) => {
  const { error, value } = validateNewMatch(req.body);
  if (error) return res.status(400).json({ error });

  const client = await pool.connect();
  try {
    // A transaction means: save the match AND all its players, or save nothing.
    await client.query("BEGIN");

    const created = await client.query(
      "INSERT INTO matches (max_points) VALUES ($1) RETURNING id",
      [value.maxPoints]
    );
    const matchId = created.rows[0].id;

    for (let seat = 0; seat < value.players.length; seat++) {
      const player = value.players[seat];
      await client.query(
        "INSERT INTO match_players (match_id, name, avatar, seat) VALUES ($1, $2, $3, $4)",
        [matchId, player.name, player.avatar, seat]
      );
    }

    await client.query("COMMIT");

    const match = await getMatchState(matchId);
    res.status(201).json(match);
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
});

// GET /api/matches/:id  -> one match with its players and scores
router.get("/:id", async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "Match id must be a positive whole number" });
  }

  try {
    const match = await getMatchState(id);
    if (!match) return res.status(404).json({ error: "Match not found" });
    res.json(match);
  } catch (err) {
    next(err);
  }
});

export default router;
