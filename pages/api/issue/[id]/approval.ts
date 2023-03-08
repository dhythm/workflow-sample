
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
    const { userId, approved } = req.body;
    const issue = await prisma.issue.findUnique({
      where: {
        id: issueId
      },
      include: {
        weakReviewers: true,
        strongReviewers: true,
      }
    })
    if (!issue) {
      res.status(404);
      return;
    }

    if (!approved && issue.strongReviewers.some(reviewer => reviewer.id === userId)) {
      await prisma.approval.updateMany({
        where: {
          issueId,
        },
        data: {
          approved: false,
          updatedAt: new Date()
        },
      });
    }
    await prisma.approval.create({
      data: {
        userId,
        issueId,
        approved,
      },
    });
    res.status(200).json({});
    return;
  }

  const approvals = await prisma.approval.findMany({
    where: {
      issueId,
    },
    include: {
      user: true
    }
  });
  res.status(200).json(approvals);
}
