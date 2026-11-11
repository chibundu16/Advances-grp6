import "dotenv/config";
import express from "express";
import cors from "cors";
import { query } from "./db.js";
import matchesRouter from "./routes/matches.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Only let our own React app call this server from a browser (CORS).
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));
// Lets us read JSON sent in request bodies.
app.use(express.json());

// Health check: proves the server is up AND can reach the database.
app.get("/api/health", async (req, res) => {
  try {
    const result = await query("SELECT NOW() AS time");
    res.json({ status: "ok", databaseTime: result.rows[0].time });
  } catch (err) {
    console.error("Health check failed:", err.message);
    res.status(500).json({ status: "error", message: "Database not reachable" });
  }
});

// All match routes live in routes/matches.js
app.use("/api/matches", matchesRouter);

// Anything we haven't defined yet.
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Last line of defence: never leak internal errors to the player.
app.use((err, req, res, next) => {
  // Someone sent broken JSON, which is their mistake, not ours.
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Request body is not valid JSON" });
  }
  console.error(err);
  res.status(500).json({ error: "Something went wrong on the server" });
});

app.listen(PORT, () => {
  console.log(`Greedy Pig API running on http://localhost:${PORT}`);
});
export default app;
