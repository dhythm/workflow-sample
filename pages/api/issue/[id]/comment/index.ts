import { prisma } from "@/prisma/db.server";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id: issueId } = req.query;

  if (typeof issueId !== "string") {
    res.status(400);
    return;
  }

  if (req.method === "POST") {
    const { content, userId } = req.body;
    await prisma.comment.create({
      data: {
        content,
        userId,
        issueId,
      },
    });
    res.status(200).json({});
    return;
  }

  const comments = await prisma.comment.findMany({
    where: {
      issueId,
    },
    include: {
      user: true
    }
  });
  res.status(200).json(comments);
}
