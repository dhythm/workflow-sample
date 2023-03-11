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

  const thread = await prisma.thread.findFirst({
    where: { id: threadId, issueId },
    include: { comments: { include: { user: true } } },
  });
  if (!thread) {
    res.status(404).send("NOT FOUND");
    return;
  }

  res.status(200).json(thread);
}
