import { prisma } from "@/prisma/db.server";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id: issueId } = req.query;

  if (typeof issueId !== "string") {
    res.status(400).send("BAD REQUEST");
    return;
  }

  if (req.method === "POST") {
    const { userId, approved } = req.body;
    const issue = await prisma.issue.findUnique({
      where: {
        id: issueId,
      },
      include: {
        weakReviewers: true,
        strongReviewers: true,
        approvals: {
          where: {
            approved: true,
          },
        },
      },
    });
    if (!issue) {
      res.status(404).send("NOT FOUND");
      return;
    }

    if (!approved) {
      // Cannot reject if already approved
      if (issue.approvals.some((approval) => approval.userId === userId)) {
        res.status(400).send("BAD REQUEST");
        return;
      }
      // Discard all approvals if strong reviewer rejects
      if (issue.strongReviewers.some((reviewer) => reviewer.id === userId)) {
        await prisma.approval.updateMany({
          where: {
            issueId,
          },
          data: {
            approved: false,
            updatedAt: new Date(),
          },
        });
      }
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
      user: true,
    },
  });
  res.status(200).json(approvals);
}
