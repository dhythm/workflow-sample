import { prisma } from '@/prisma/db.server'
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const issues = await prisma.issue.findMany();
  res.status(200).json({ issues })
}
