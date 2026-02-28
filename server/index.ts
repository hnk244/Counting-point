import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import prisma from "./prisma.js";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

app.use(cors());
app.use(express.json());

// ─── REST API ────────────────────────────────────────────────────────────────

// Create a new room
app.post("/api/rooms", async (_req, res) => {
  try {
    const code = String(Math.floor(1000 + Math.random() * 9000));
    const room = await prisma.room.create({
      data: {
        code,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    res.json(room);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create room" });
  }
});

// Get room by code
app.get("/api/rooms/:code", async (req, res) => {
  try {
    const room = await prisma.room.findUnique({
      where: { code: req.params.code },
      include: {
        participants: true,
        games: { include: { scores: { include: { participant: true } } }, orderBy: { startedAt: "desc" } },
      },
    });
    if (!room) {
      res.status(404).json({ error: "Room not found" });
      return;
    }
    if (!room.isActive || new Date() > room.expiresAt) {
      res.status(410).json({ error: "Room has expired" });
      return;
    }
    res.json(room);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch room" });
  }
});

// Add participant to room
app.post("/api/rooms/:code/participants", async (req, res) => {
  try {
    const room = await prisma.room.findUnique({ where: { code: req.params.code } });
    if (!room) {
      res.status(404).json({ error: "Room not found" });
      return;
    }
    const participant = await prisma.participant.create({
      data: { name: req.body.name, roomId: room.id },
    });
    io.to(req.params.code).emit("participant-added", participant);
    res.json(participant);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add participant" });
  }
});

// Start a game (create game + scores for each participant)
app.post("/api/rooms/:code/games", async (req, res) => {
  try {
    const room = await prisma.room.findUnique({
      where: { code: req.params.code },
      include: { participants: true },
    });
    if (!room) {
      res.status(404).json({ error: "Room not found" });
      return;
    }
    const game = await prisma.game.create({
      data: {
        roomId: room.id,
        scores: {
          create: room.participants.map((p) => ({
            participantId: p.id,
            value: 0,
          })),
        },
      },
      include: { scores: { include: { participant: true } } },
    });
    io.to(req.params.code).emit("game-started", game);
    res.json(game);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to start game" });
  }
});

// Increment score
app.post("/api/scores/:scoreId/increment", async (req, res) => {
  try {
    const score = await prisma.score.update({
      where: { id: req.params.scoreId },
      data: { value: { increment: 1 } },
      include: { participant: true, game: { include: { room: true } } },
    });
    io.to(score.game.room.code).emit("score-updated", {
      scoreId: score.id,
      participantId: score.participantId,
      value: score.value,
      participantName: score.participant.name,
    });
    res.json(score);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to increment score" });
  }
});

// Decrement score
app.post("/api/scores/:scoreId/decrement", async (req, res) => {
  try {
    const score = await prisma.score.update({
      where: { id: req.params.scoreId },
      data: { value: { decrement: 1 } },
      include: { participant: true, game: { include: { room: true } } },
    });
    io.to(score.game.room.code).emit("score-updated", {
      scoreId: score.id,
      participantId: score.participantId,
      value: score.value,
      participantName: score.participant.name,
    });
    res.json(score);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to decrement score" });
  }
});

// End game
app.post("/api/games/:gameId/end", async (req, res) => {
  try {
    const game = await prisma.game.update({
      where: { id: req.params.gameId },
      data: { endedAt: new Date() },
      include: { scores: { include: { participant: true } }, room: true },
    });
    io.to(game.room.code).emit("game-ended", game);
    res.json(game);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to end game" });
  }
});

// Get game history for a room
app.get("/api/rooms/:code/history", async (req, res) => {
  try {
    const room = await prisma.room.findUnique({ where: { code: req.params.code } });
    if (!room) {
      res.status(404).json({ error: "Room not found" });
      return;
    }
    const games = await prisma.game.findMany({
      where: { roomId: room.id, endedAt: { not: null } },
      include: { scores: { include: { participant: true } } },
      orderBy: { startedAt: "desc" },
    });
    res.json(games);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

// ─── SOCKET.IO ───────────────────────────────────────────────────────────────

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("join-room", (roomCode: string) => {
    socket.join(roomCode);
    console.log(`Socket ${socket.id} joined room ${roomCode}`);
  });

  socket.on("leave-room", (roomCode: string) => {
    socket.leave(roomCode);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// ─── CLEANUP EXPIRED ROOMS ──────────────────────────────────────────────────

async function cleanupExpiredRooms() {
  try {
    await prisma.room.updateMany({
      where: { expiresAt: { lt: new Date() }, isActive: true },
      data: { isActive: false },
    });
  } catch (err) {
    console.error("Cleanup error:", err);
  }
}

// Run cleanup every hour
setInterval(cleanupExpiredRooms, 60 * 60 * 1000);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
