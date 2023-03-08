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

  if (req.method === "POST") {
    const { title, content, status, assigneeId } = req.body;
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

  const issue = await prisma.issue.findUnique({
    where: {
      id,
    },
    include: {
      author: true,
      assignee: true,
      weakReviewers: true,
      strongReviewers: true,
    },
  });

  res.status(200).json(issue);
}
