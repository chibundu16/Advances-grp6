import { Router } from "express";
import { randomInt } from "node:crypto";
import { pool } from "../db.js";
import { getMatchState, formatMatch } from "../matchState.js";

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

// GET /api/matches  -> the history: finished matches, newest first, a page at a time.
// Example: /api/matches?page=2&limit=5
router.get("/", async (req, res, next) => {
  const page = req.query.page === undefined ? 1 : Number(req.query.page);
  const limit = req.query.limit === undefined ? 10 : Number(req.query.limit);

  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 50) {
    return res.status(400).json({ error: "page must be 1 or more, and limit must be 1 to 50" });
  }

  try {
    // How many finished matches exist in total (so the frontend can show page numbers).
    const countResult = await pool.query(
      "SELECT COUNT(*) FROM matches WHERE status = 'finished'"
    );
    const total = Number(countResult.rows[0].count);

    // Just this page of matches. OFFSET skips the matches on earlier pages.
    const matchesResult = await pool.query(
      `SELECT * FROM matches
       WHERE status = 'finished'
       ORDER BY finished_at DESC, id DESC
       LIMIT $1 OFFSET $2`,
      [limit, (page - 1) * limit]
    );

    // Load the players of ALL these matches in one query (not one query per match).
    const ids = matchesResult.rows.map((m) => m.id);
    let playerRows = [];
    if (ids.length > 0) {
      const playersResult = await pool.query(
        "SELECT * FROM match_players WHERE match_id = ANY($1) ORDER BY match_id, seat",
        [ids]
      );
      playerRows = playersResult.rows;
    }

    const matches = matchesResult.rows.map((m) =>
      formatMatch(m, playerRows.filter((p) => p.match_id === m.id))
    );

    res.json({ matches, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
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

// Used by roll and pass. Inside a transaction it:
//  1. locks the match row (FOR UPDATE), so if a player double-clicks, the second
//     request waits for the first one instead of mixing up the scores;
//  2. checks the match exists and is not finished;
//  3. loads the players and picks out whose turn it is.
// Returns { error, status } if the move isn't allowed, otherwise { match, players, player }.
async function lockActiveMatch(client, id) {
  const matchResult = await client.query(
    "SELECT * FROM matches WHERE id = $1 FOR UPDATE",
    [id]
  );
  if (matchResult.rows.length === 0) {
    return { status: 404, error: "Match not found" };
  }
  const match = matchResult.rows[0];

  if (match.status === "finished") {
    return { status: 409, error: "This match is already finished" };
  }

  const playersResult = await client.query(
    "SELECT * FROM match_players WHERE match_id = $1 ORDER BY seat",
    [id]
  );
  const players = playersResult.rows;
  const player = players[match.current_player]; // seats are 0, 1, 2 ... in order
  return { match, players, player };
}

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

    // Lock the match and load the current player (see lockActiveMatch above).
    const found = await lockActiveMatch(client, id);
    if (found.error) {
      await client.query("ROLLBACK");
      return res.status(found.status).json({ error: found.error });
    }
    const { match, players, player } = found;

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

// POST /api/matches/:id/pass  -> the current player banks their points and the turn moves on.
// Like roll, the browser sends nothing: the server knows whose turn it is and how many
// points they are holding, so nobody can claim extra points.
router.post("/:id/pass", async (req, res, next) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Match id must be a positive whole number" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const found = await lockActiveMatch(client, id);
    if (found.error) {
      await client.query("ROLLBACK");
      return res.status(found.status).json({ error: found.error });
    }
    const { match, players, player } = found;

    // Move the held points into the banked total.
    const banked = player.running_points;
    await client.query(
      "UPDATE match_players SET total_points = total_points + running_points, running_points = 0 WHERE id = $1",
      [player.id]
    );

    // Next player's turn (wraps back to seat 0 after the last player).
    const nextSeat = (match.current_player + 1) % players.length;
    await client.query(
      "UPDATE matches SET current_player = $1 WHERE id = $2",
      [nextSeat, id]
    );

    const updated = await getMatchState(id, client);
    await client.query("COMMIT");

    res.json({ outcome: "passed", banked, match: updated });
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
});

export default router;
