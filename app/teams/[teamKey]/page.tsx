import { Metadata } from 'next';

import { PrismaClient, Team } from '@prisma/client';

import Header from 'app/components/Header';
import ProjectionPanel from 'app/components/panels/Projection';
import { TeamKey, lastSeason } from 'app/types';
import { getTeamName } from 'app/utils';

interface Props {
  params: {
    teamKey: TeamKey;
  };
}

export const generateMetadata = async ({
  params: { teamKey },
}: Props): Promise<Metadata> => ({
  title: getTeamName(teamKey),
});

async function getTeam(teamKey: string): Promise<Team> {
  const prisma = new PrismaClient();
  // TODO probably should be `findFirstOrThrow`
  return await prisma.Team.findFirst({
    where: {
      key: teamKey,
    },
    // The `lastSeason` filters are tentative...
    include: {
      players: {
        include: {
          passingSeasons: {
            where: {
              season: lastSeason,
            },
          },
          rushingSeasons: {
            where: {
              season: lastSeason,
            },
          },
          receivingSeasons: {
            where: {
              season: lastSeason,
            },
          },
        },
      },
      seasons: {
        where: {
          season: lastSeason,
        },
      },
      passingSeasons: {
        where: {
          season: lastSeason,
        },
      },
      rushingSeasons: {
        where: {
          season: lastSeason,
        },
      },
      receivingSeasons: {
        where: {
          season: lastSeason,
        },
      },
      homeGames: true,
      awayGames: true,
    },
  });
}

export default async function Page({ params: { teamKey } }: Props) {
  const team = await getTeam(teamKey);
  const players = team.players;
  const games = [...team.homeGames, ...team.awayGames];

  // TODO believe this `main` should just be in the `layout`
  return (
    <main className='w-full flex min-h-screen flex-col justify-stretch'>
      <Header team={teamKey} />
      <ProjectionPanel team={team} games={games} players={players} />
    </main>
  );
}
