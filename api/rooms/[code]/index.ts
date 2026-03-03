import type { VercelRequest, VercelResponse } from "@vercel/node";
import prisma from "../../_prisma.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { code } = req.query;

  try {
    const room = await prisma.room.findUnique({
      where: { code: code as string },
      include: {
        participants: true,
        games: {
          include: { scores: { include: { participant: true } } },
          orderBy: { startedAt: "desc" },
        },
      },
    });

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }
    if (!room.isActive || new Date() > room.expiresAt) {
      return res.status(410).json({ error: "Room has expired" });
    }

    return res.json(room);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch room" });
  }
}
