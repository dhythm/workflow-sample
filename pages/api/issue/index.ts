import { prisma } from "@/prisma/db.server";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const { title, content, authorId, assigneeId } = req.body;
    const issue = await prisma.issue.create({
      data: {
        title,
        content,
        authorId,
        assigneeId,
      },
    });
    res.status(200).json(issue);
    return;
  }

  const issues = await prisma.issue.findMany({
    include: {
      author: true,
      assignee: true,
      weakReviewers: true,
      strongReviewers: true,
    },
  });
  res.status(200).json(issues);
}
