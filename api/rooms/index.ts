import type { VercelRequest, VercelResponse } from "@vercel/node";
import prisma from "../_prisma.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const code = String(Math.floor(1000 + Math.random() * 9000));
    const room = await prisma.room.create({
      data: {
        code,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    return res.json(room);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to create room" });
  }
}
