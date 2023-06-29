import { Game, Player, PrismaClient } from '@prisma/client';
import { Metadata } from 'next';

import Header from 'app/components/Header';
import Schedule from 'app/components/Schedule';
import ProjectionPanel from 'app/components/panels/Projection';
import { TeamKey } from 'app/types';
import { getTeamName } from 'app/utils';

interface Props {
  params: {
    team: TeamKey;
  };
}

export const generateMetadata = async ({
  params: { team },
}: Props): Promise<Metadata> => ({
  title: getTeamName(team),
});

async function getPlayers(team: string): Promise<Player[]> {
  const prisma = new PrismaClient();
  return await prisma.player.findMany({
    where: {
      team: team,
    },
  });
}

async function getGames(team: string): Promise<Game[]> {
  const prisma = new PrismaClient();
  return await prisma.game.findMany({
    where: {
      OR: [
        {
          home: team,
        },
        {
          away: team,
        },
      ],
    },
    orderBy: {
      week: 'asc',
    },
  });
}

export default async function Page({ params: { team } }: Props) {
  const [players, games] = await Promise.all([
    getPlayers(team),
    getGames(team),
  ]);
  return (
    <main className="w-full flex min-h-screen flex-col justify-stretch">
      <Header team={team} />
      <ProjectionPanel team={team} games={games} players={players} />
    </main>
  );
}
