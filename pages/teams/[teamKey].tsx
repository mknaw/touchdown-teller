import { useState } from 'react';

import { Metadata } from 'next';
import type { GetStaticPaths, GetStaticProps } from 'next';
import { ParsedUrlQuery } from 'querystring';

import { PrismaClient } from '@prisma/client';

import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

import Card from '@/components/Card';
import DoughnutChart from '@/components/DoughnutChart';
import HorizontalChart from '@/components/HorizontalChart';
import PlayerPanel from '@/features/teams/PlayerPanel';
import {
  PassStats,
  RecvStats,
  RushStats,
  StatType,
  TeamKey,
  TeamWithExtras,
  lastSeason,
} from '@/types';
import { getTeamName } from '@/utils';

interface Props {
  params: Params;
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

// TODO have to 404 if not among these?
export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: Object.values(TeamKey).map((teamKey) => ({ params: { teamKey } })),
    fallback: false,
  };
};

interface Params extends ParsedUrlQuery {
  teamKey: TeamKey;
}

export const getStaticProps: GetStaticProps<
  {
    team: TeamWithExtras;
  },
  Params
> = async (context) => {
  const { teamKey } = context.params as Params;
  const team = await getTeam(teamKey);

  return {
    props: { team },
  };
};

export default function Page({ team }: { team: TeamWithExtras }) {
  const [statType, setStatType] = useState<StatType>(StatType.PASS);
  const spacing = 4;

  const commonProps = {
    team,
    statType,
    setStatType,
  };
  let statPanel;
  switch (statType) {
  // TODO seems a little repetitive ...
  case StatType.PASS:
    statPanel = (
      <PlayerPanel<PassStats>
        {...commonProps}
        constructor={PassStats}
        toStoreData={(s: PassStats) => s.toStoreData()}
      />
    );
    break;
  case StatType.RECV:
    statPanel = (
      <PlayerPanel<RecvStats>
        {...commonProps}
        constructor={RecvStats}
        toStoreData={(s: RecvStats) => s.toStoreData()}
      />
    );
    break;
  default: // Rushing
    statPanel = (
      <PlayerPanel<RushStats>
        {...commonProps}
        constructor={RushStats}
        toStoreData={(s: RushStats) => s.toStoreData()}
      />
    );
  }
  return (
    <div className={'flex h-body pb-5'}>
      <Grid
        container
        alignItems='stretch'
        justifyContent='stretch'
        spacing={spacing}
      >
        <Grid item xs={6}>
          <Card className={'h-full flex-col justify-stretch relative'}>
            {statPanel}
          </Card>
        </Grid>
        <Grid container direction={'column'} item xs={6} spacing={spacing}>
          <Grid item xs={4}>
            <Card className={'h-full'}>
              <Typography className={'text-xl w-full text-center'}>
                HorizontalChart
              </Typography>
              <div className={'h-10 relative bg-red-500'}>
                <HorizontalChart />
              </div>
            </Card>
          </Grid>
          {[0, 1].map((i) => (
            <Grid key={i} container item xs={4} spacing={spacing}>
              {[0, 1].map((j) => (
                <Grid key={j} item xs={6}>
                  <Card className={'h-full'}>
                    <div className={'h-full relative'}>
                      <Typography className={'text-xl w-full text-center'}>
                        {`${lastSeason} Target Share`}
                      </Typography>
                      <div className={'flex h-full justify-center'}>
                        <div className={'flex w-full justify-center'}>
                          <DoughnutChart />
                        </div>
                      </div>
                    </div>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ))}
        </Grid>
      </Grid>
    </div>
  );
}
