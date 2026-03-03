import type { VercelRequest, VercelResponse } from "@vercel/node";
import prisma from "../../_prisma.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { gameId } = req.query;

  try {
    const game = await prisma.game.update({
      where: { id: gameId as string },
      data: { endedAt: new Date() },
      include: { scores: { include: { participant: true } }, room: true },
    });
    return res.json(game);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to end game" });
  }
}
