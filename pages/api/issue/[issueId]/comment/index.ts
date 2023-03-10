import { prisma } from "@/prisma/db.server";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { issueId } = req.query;

  if (typeof issueId !== "string") {
    res.status(400).send("BAD REQUEST");
    return;
  }

  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: { threads: true },
  });
  if (!issue) {
    res.status(404).send("NOT FOUND");
    return;
  }

  if (req.method === "POST") {
    const { threadId, userId, content } = req.body;
    if (!issue.threads.some((thread) => thread.id === threadId)) {
      res.status(400).send("BAD REQUEST");
      return;
    }
    await prisma.comment.create({
      data: {
        threadId,
        userId,
        content,
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
      user: true,
    },
  });
  res.status(200).json(comments);
}
