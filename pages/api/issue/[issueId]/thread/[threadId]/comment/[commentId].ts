import { prisma } from "@/prisma/db.server";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { issueId, threadId, commentId } = req.query;

  if (
    typeof issueId !== "string" ||
    typeof threadId !== "string" ||
    typeof commentId !== "string"
  ) {
    res.status(400).send("BAD REQUEST");
    return;
  }

  if (req.method !== "DELETE") {
    res.status(405).send("MEATHOD NOT ALLOWED");
    return;
  }

  const { userId } = req.body;

  const comment = await prisma.comment.findFirst({
    where: {
      id: commentId,
      threadId,
      userId,
    },
  });
  if (!comment) {
    res.status(404).send("NOT FOUND");
    return;
  }

  await prisma.comment.delete({
    where: { id: commentId },
  });
  res.status(200).json({});
}
