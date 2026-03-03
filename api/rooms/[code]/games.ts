import type { VercelRequest, VercelResponse } from "@vercel/node";
import prisma from "../../_prisma.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { code } = req.query;

  try {
    const room = await prisma.room.findUnique({
      where: { code: code as string },
      include: { participants: true },
    });
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
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

    return res.json(game);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to start game" });
  }
}
