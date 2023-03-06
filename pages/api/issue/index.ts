import { prisma } from "@/prisma/db.server";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const { title, content } = req.body;
    const issue = await prisma.issue.create({
      data: {
        title,
        content,
        authorId: "85aed796-6e70-4380-80ac-caf3564a4d4c"
      },
    });
    res.status(200).json({ issue });
    return;
  }

  const issues = await prisma.issue.findMany({
    include: {
      author: true,
      asignee: true,
      reviewers: true
    }
  });
  res.status(200).json({ issues });
}
