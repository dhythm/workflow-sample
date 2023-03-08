import { prisma } from "@/prisma/db.server";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id: issueId } = req.query;
  const { type, reviewerId } = req.body;

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
      assignee: true,
      weakReviewers: true,
      strongReviewers: true,
      approvedBy: true
    },
  });
  if (!issue) {
    res.status(404);
    return;
  }
  if (issue.weakReviewers.concat(issue.strongReviewers).some((reviewer) => reviewer.id === reviewerId) ) {
    res.status(400);
    return;
  }

  await prisma.issue.update({
    where: {
      id: issueId,
    },
    data: {
      ...(type === 'strong' ? {
        strongReviewers: {
          connect: {
            id: reviewerId,
          },
        },
      } : {
        weakReviewers: {
          connect: {
            id: reviewerId,
          },
        },
        })
    },
  });

  res.status(200).json({});
}
