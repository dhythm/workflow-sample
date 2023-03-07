import { prisma } from "@/prisma/db.server";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (typeof id !== "string") {
    res.status(400);
    return;
  }

  const issue = await prisma.issue.findUnique({
    where: {
      id,
    },
    include: {
      author: true,
      asignee: true,
      reviewers: true,
    },
  });
  console.log({ id, issue });
  res.status(200).json({ issue });
}
