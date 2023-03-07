import { prisma } from "@/prisma/db.server";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id: issueId } = req.query;
  const { reviewerId } = req.body;

  if (req.method !== "POST") {
    res.status(405);
    return;
  }

  if (typeof issueId !== "string") {
    res.status(400);
    return;
  }

  const issue = await prisma.issue.findFirst({
    where: {
      id: issueId,
    },
    include: {
      author: true,
      asignee: true,
      reviewers: true,
    },
  });
  if (!issue) {
    res.status(404);
    return;
  }
  if (issue.reviewers.some((reviewer) => reviewer.id === reviewerId)) {
    res.status(400);
    return;
  }

  await prisma.issue.update({
    where: {
      id: issueId,
    },
    data: {
      reviewers: {
        connect: {
          id: reviewerId,
        },
      },
    },
  });

  res.status(200).json({});
}
