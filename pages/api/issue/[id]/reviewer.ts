import { prisma } from "@/prisma/db.server";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id: issueId } = req.query;
  const { type, userId } = req.body;

  if (req.method !== "POST") {
    res.status(405).send("METHOD NOT ALLOWED");
    return;
  }

  if (typeof issueId !== "string") {
    res.status(400).send("BAD REQUEST");
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
    },
  });
  if (!issue) {
    res.status(404).send("NOT FOUND");
    return;
  }
  if (
    issue.weakReviewers
      .concat(issue.strongReviewers)
      .some((reviewer) => reviewer.id === userId)
  ) {
    res.status(400).send("BAD REQUEST");
    return;
  }

  await prisma.issue.update({
    where: {
      id: issueId,
    },
    data: {
      ...(type === "strong"
        ? {
            strongReviewers: {
              connect: {
                id: userId,
              },
            },
          }
        : {
            weakReviewers: {
              connect: {
                id: userId,
              },
            },
          }),
    },
  });
  res.status(200).json({});
}
