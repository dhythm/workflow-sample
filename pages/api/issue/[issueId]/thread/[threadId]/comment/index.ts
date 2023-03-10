import { prisma } from "@/prisma/db.server";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { issueId, threadId } = req.query;

  if (typeof issueId !== "string" || typeof threadId !== "string") {
    res.status(400).send("BAD REQUEST");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).send("MEATHOD NOT ALLOWED");
    return;
  }

  const thread = await prisma.thread.findFirst({
    where: { id: threadId, issueId },
  });
  if (!thread) {
    res.status(404).send("NOT FOUND");
    return;
  }

  const { content, userId } = req.body;
  await prisma.comment.create({
    data: {
      userId,
      content,
      threadId,
    },
  });
  res.status(200).json({});
}
