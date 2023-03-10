import { prisma } from "@/prisma/db.server";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { issueId: id } = req.query;

  if (typeof id !== "string") {
    res.status(400).send("BAD REQUEST");
    return;
  }

  const issue = await prisma.issue.findUnique({
    where: {
      id,
    },
    include: {
      author: true,
      assignee: true,
      reviewers: true,
      approvers: true,
      approvals: {
        where: {
          approved: true,
        },
      },
      threads: { include: { comments: true } },
    },
  });
  if (!issue) {
    res.status(404).send("NOT FOUND");
    return;
  }

  if (req.method === "POST") {
    const { title, content, status, assigneeId } = req.body;
    const reviewers = [...issue.reviewers, ...issue.approvers];
    if (
      status === "completed" &&
      !reviewers.every((reviewer) =>
        issue.approvals.some((approval) => approval.userId === reviewer.id)
      )
    ) {
      res.status(400).send("NOT COMPLETED");
      return;
    }
    await prisma.issue.update({
      where: {
        id,
      },
      data: {
        title,
        content,
        status,
        assigneeId,
      },
    });
    res.status(200).json({});
    return;
  }

  res.status(200).json(issue);
}
