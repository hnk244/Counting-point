import type { VercelRequest, VercelResponse } from "@vercel/node";
import prisma from "../../_prisma.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { scoreId } = req.query;

  try {
    const score = await prisma.score.update({
      where: { id: scoreId as string },
      data: { value: { increment: 1 } },
      include: { participant: true },
    });
    return res.json(score);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to increment score" });
  }
}
