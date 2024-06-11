import { NextApiRequest, NextApiResponse } from 'next';

import { PrismaClient } from '@prisma/client';

import { lastYear } from '@/constants';
import { getTeamSeasons } from '@/data/ssr';

// TODO probably should take the year from an api param
export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  const prisma = new PrismaClient();
  getTeamSeasons(prisma, lastYear).then((data) => res.status(200).json(data));
  // TODO error handling? can't imagine how this would error out tbh
}
