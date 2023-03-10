import { prisma } from "@/prisma/db.server";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { issueId } = req.query;

  if (typeof issueId !== "string") {
    res.status(400).send("BAD REQUEST");
    return;
  }

  if (req.method === "POST") {
    const { content, userId } = req.body;
    await prisma.thread.create({
      data: {
        issueId,
        comments: {
          create: {
            userId,
            content,
          },
        },
      },
    });
    res.status(200).json({});
    return;
  }

  const threads = await prisma.thread.findMany({
    where: {
      issueId,
    },
    include: {
      comments: {
        include: {
          user: true,
        },
      },
    },
  });
  res.status(200).json(threads);
}
