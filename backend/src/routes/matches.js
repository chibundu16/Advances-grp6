import { Router } from "express";
import { randomInt } from "node:crypto";
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

// Turns the :id in the URL into a number. Returns null if it isn't a valid id.
function parseId(text) {
  const id = Number(text);
  return Number.isInteger(id) && id >= 1 ? id : null;
}

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

    const match = await getMatchState(matchId, client);
    await client.query("COMMIT");

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
  const id = parseId(req.params.id);
  if (!id) {
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

// POST /api/matches/:id/roll  -> the SERVER rolls the dice for the current player.
// The browser sends no dice value at all, so it has nothing to fake.
router.post("/:id/roll", async (req, res, next) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Match id must be a positive whole number" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // FOR UPDATE locks this match until we finish. If a player double-clicks,
    // the second roll waits for the first one instead of mixing up the scores.
    const matchResult = await client.query(
      "SELECT * FROM matches WHERE id = $1 FOR UPDATE",
      [id]
    );
    if (matchResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Match not found" });
    }
    const match = matchResult.rows[0];

    if (match.status === "finished") {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "This match is already finished" });
    }

    const playersResult = await client.query(
      "SELECT * FROM match_players WHERE match_id = $1 ORDER BY seat",
      [id]
    );
    const players = playersResult.rows;
    const player = players[match.current_player]; // seats are 0, 1, 2 ... in order

    // The dice roll. randomInt(1, 7) gives 1, 2, 3, 4, 5 or 6 (7 is not included).
    const roll = randomInt(1, 7);
    let outcome;

    if (roll === 1) {
      // Bust: the player loses the points they were holding, and the turn moves on.
      await client.query(
        "UPDATE match_players SET running_points = 0 WHERE id = $1",
        [player.id]
      );
      const nextSeat = (match.current_player + 1) % players.length;
      await client.query(
        "UPDATE matches SET current_player = $1 WHERE id = $2",
        [nextSeat, id]
      );
      outcome = "bust";
    } else {
      const newRunning = player.running_points + roll;

      if (player.total_points + newRunning >= match.max_points) {
        // The player reached the target: bank everything and finish the match.
        await client.query(
          "UPDATE match_players SET total_points = $1, running_points = 0 WHERE id = $2",
          [player.total_points + newRunning, player.id]
        );
        await client.query(
          "UPDATE matches SET status = 'finished', winner_seat = $1, finished_at = now() WHERE id = $2",
          [player.seat, id]
        );
        outcome = "won";
      } else {
        // Normal roll: add to the points the player is holding. They can roll again or pass.
        await client.query(
          "UPDATE match_players SET running_points = $1 WHERE id = $2",
          [newRunning, player.id]
        );
        outcome = "rolled";
      }
    }

    const updated = await getMatchState(id, client);
    await client.query("COMMIT");

    res.json({ roll, outcome, match: updated });
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
});

export default router;
