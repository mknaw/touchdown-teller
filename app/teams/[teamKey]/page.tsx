import TeamPage from './TeamPage';
import { Metadata } from 'next';

import { PrismaClient } from '@prisma/client';

import Nav from '@/app/nav';
import ProjectionPanel from 'app/components/panels/Projection';
import { TeamKey, TeamWithExtras, lastSeason } from 'app/types';
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

async function getTeam(teamKey: string): Promise<TeamWithExtras> {
  const prisma = new PrismaClient();
  return await prisma.team.findFirstOrThrow({
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
  //const players = team.players;
  //const games = [...team.homeGames, ...team.awayGames];

  return (
    <Nav header={getTeamName(teamKey)}>
      <TeamPage team={team} />
    </Nav>
  );
}
