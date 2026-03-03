import type { VercelRequest, VercelResponse } from "@vercel/node";
import prisma from "../../_prisma.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { code } = req.query;

  try {
    const room = await prisma.room.findUnique({ where: { code: code as string } });
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    const participant = await prisma.participant.create({
      data: { name: req.body.name, roomId: room.id },
    });

    return res.json(participant);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to add participant" });
  }
}
