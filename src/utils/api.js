// Every call from the React app to our backend goes through this file.
// On your laptop the backend runs on port 3000. When the app is deployed, we set
// VITE_API_URL (in the hosting dashboard) to the live backend address instead.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Sends one request and returns the JSON reply.
// If anything goes wrong it throws an Error with a message that is safe to show a player.
async function request(path, options = {}) {
  const { body, ...rest } = options;

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...rest,
      // Only send a body (and say it is JSON) when we actually have one.
      ...(body !== undefined && {
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    });
  } catch {
    throw new Error("Can't reach the game server. Check your internet and try again.");
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    // the reply wasn't JSON; handled below
  }

  if (!response.ok) {
    throw new Error(data?.error || "Something went wrong. Please try again.");
  }
  return data;
}

// Start a match. players looks like [{ name: "Leo", avatar: 3 }, ...]
export const createMatch = (maxPoints, players) =>
  request("/api/matches", { method: "POST", body: { maxPoints, players } });

// The SERVER rolls the dice. We send nothing but the match id.
export const rollDice = (matchId) =>
  request(`/api/matches/${matchId}/roll`, { method: "POST" });

// Bank the current player's points and move to the next player.
export const passTurn = (matchId) =>
  request(`/api/matches/${matchId}/pass`, { method: "POST" });

// Match history: a page of finished matches, newest first.
export const getMatches = (page = 1, limit = 10) =>
  request(`/api/matches?page=${page}&limit=${limit}`);

// One match with its leaderboard.
export const getMatch = (matchId) => request(`/api/matches/${matchId}`);
