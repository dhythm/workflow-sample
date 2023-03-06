import { prisma } from '@/prisma/db.server'
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log({ req, res })
  const users = await prisma.user.findMany();
  res.status(200).json({ users })
}

