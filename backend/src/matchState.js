import { pool } from "./db.js";

// Turns raw database rows into the shape the frontend will receive.
// (The database uses snake_case names; JavaScript usually uses camelCase.)
export function formatMatch(matchRow, playerRows) {
  const players = playerRows.map((p) => ({
    seat: p.seat,
    name: p.name,
    avatar: p.avatar,
    runningPoints: p.running_points,
    totalPoints: p.total_points,
    doubleDownUsed: p.double_down_used,
  }));

  // The leaderboard: best score first. If two players tie, whoever
  // plays first (lower seat number) is listed first.
  const leaderboard = [...players]
    .sort((a, b) => b.totalPoints - a.totalPoints || a.seat - b.seat)
    .map((p, index) => ({ rank: index + 1, ...p }));

  return {
    id: matchRow.id,
    maxPoints: matchRow.max_points,
    status: matchRow.status,
    currentPlayer: matchRow.current_player, // seat number whose turn it is
    winnerSeat: matchRow.winner_seat,
    createdAt: matchRow.created_at,
    finishedAt: matchRow.finished_at,
    players,
    leaderboard,
  };
}

// Loads one match and its players. Returns null if the match doesn't exist.
// Other files (roll, pass, history) will reuse this.
// "db" is the connection to use. Inside a transaction we pass that transaction's
// own connection, so the request never needs a second one.
export async function getMatchState(id, db = pool) {
  const match = await db.query("SELECT * FROM matches WHERE id = $1", [id]);
  if (match.rows.length === 0) return null;

  const players = await db.query(
    "SELECT * FROM match_players WHERE match_id = $1 ORDER BY seat",
    [id]
  );
  return formatMatch(match.rows[0], players.rows);
}
