import { pool } from "./db.js";

// Turns raw database rows into the shape the frontend will receive.
// (The database uses snake_case names; JavaScript usually uses camelCase.)
export function formatMatch(matchRow, playerRows) {
  return {
    id: matchRow.id,
    maxPoints: matchRow.max_points,
    status: matchRow.status,
    currentPlayer: matchRow.current_player, // seat number whose turn it is
    winnerSeat: matchRow.winner_seat,
    createdAt: matchRow.created_at,
    finishedAt: matchRow.finished_at,
    players: playerRows.map((p) => ({
      seat: p.seat,
      name: p.name,
      avatar: p.avatar,
      runningPoints: p.running_points,
      totalPoints: p.total_points,
    })),
  };
}

// Loads one match and its players. Returns null if the match doesn't exist.
// Other files (roll, pass, history) will reuse this.
export async function getMatchState(id) {
  const match = await pool.query("SELECT * FROM matches WHERE id = $1", [id]);
  if (match.rows.length === 0) return null;

  const players = await pool.query(
    "SELECT * FROM match_players WHERE match_id = $1 ORDER BY seat",
    [id]
  );
  return formatMatch(match.rows[0], players.rows);
}
