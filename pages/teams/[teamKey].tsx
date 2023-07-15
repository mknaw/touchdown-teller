import { Dispatch, SetStateAction, useEffect, useState } from 'react';

import _ from 'lodash';
import { Metadata } from 'next';
import type { GetStaticPaths, GetStaticProps } from 'next';
import { ParsedUrlQuery } from 'querystring';
import { useIndexedDBStore } from 'use-indexeddb';

import { PrismaClient } from '@prisma/client';

import { Paper } from '@mui/material';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

import Card from '@/components/Card';
import DoughnutChart from '@/components/DoughnutChart';
import { StorageKey, setupPersistence } from '@/data/persistence';
import PlayerPanel from '@/features/teams/PlayerPanel';
import TeamPanel from '@/features/teams/TeamPanel';
import {
  PassSeason,
  PassSeasonData,
  RecvSeason,
  RecvSeasonData,
  RushSeason,
  RushSeasonData,
} from '@/models/PlayerSeason';
import {
  PlayerSeason,
  PlayerSeasonConstructable,
  PlayerSeasonData,
  Position,
  StatType,
  TeamKey,
  TeamWithExtras,
  createPlayerSeason,
  lastYear,
} from '@/types';
import { getTeamName, setOnClone } from '@/utils';

interface Params extends ParsedUrlQuery {
  teamKey: TeamKey;
}

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
    include: {
      players: {
        include: {
          passSeasons: {
            where: {
              season: lastYear,
            },
          },
          rushSeasons: {
            where: {
              season: lastYear,
            },
          },
          recvSeasons: {
            where: {
              season: lastYear,
            },
          },
        },
      },
      seasons: {
        where: {
          season: lastYear,
        },
      },
      passSeasons: {
        where: {
          season: lastYear,
        },
      },
      rushSeasons: {
        where: {
          season: lastYear,
        },
      },
      recvSeasons: {
        where: {
          season: lastYear,
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

interface IDBStore<T> {
  add(value: T, key?: number): Promise<number>;
  update(value: T, key?: number): Promise<number>;
  getManyByKey(keyPath: string, value: string | number): Promise<T[]>;
  deleteByID(id: number): Promise<number>;
}

type SeasonMap<T extends PlayerSeason> = Map<number, T>;

const getDataHandlers = <T extends PlayerSeason>(
  teamKey: TeamKey,
  constructor: PlayerSeasonConstructable<T>,
  store: IDBStore<PlayerSeasonData<T>>,
  toStoreData: (s: T) => PlayerSeasonData<T>,
  setSeason: Dispatch<SetStateAction<SeasonMap<T>>>
) => {
  const fetchedDataToMap = (data: PlayerSeasonData<T>[]): SeasonMap<T> =>
    new Map(
      data.map((d) => createPlayerSeason(constructor, d)).map((p) => [p.id, p])
    );

  const initSeasons = async () => {
    const data = await store.getManyByKey('team', teamKey);
    setSeason(fetchedDataToMap(data as PlayerSeasonData<T>[]));
  };

  const initSeason = (playerId: number) => {
    const season = constructor.default(playerId, teamKey as TeamKey);
    store
      .add(toStoreData(season), playerId)
      // TODO would prefer to render optimistically and resolve failure
      // but that could be more complicated... for later
      .then(() => updateSeason(season))
      .catch(alert);
  };

  const updateSeason = (season: T) => {
    setSeason((s: SeasonMap<T>) => setOnClone(s, season.id, season));
  };

  const persistSeason = (season: T) => {
    updateSeason(season);
    store.update(toStoreData(season), season.id);
  };

  const deleteSeason = (playerId: number) => {
    setSeason((season) => {
      season.delete(playerId);
      return season;
    });
    store.deleteByID(playerId);
  };

  return {
    initSeasons,
    initSeason,
    updateSeason,
    persistSeason,
    deleteSeason,
  };
};

export default function Page({ team }: { team: TeamWithExtras }) {
  const spacing = 4;

  const [statType, setStatType] = useState<StatType>(StatType.PASS);
  const [passSeasons, setPassSeasons] = useState<SeasonMap<PassSeason>>(
    new Map()
  );
  const [recvSeasons, setRecvSeasons] = useState<SeasonMap<RecvSeason>>(
    new Map()
  );
  const [rushSeasons, setRushSeasons] = useState<SeasonMap<RushSeason>>(
    new Map()
  );

  const passStore = useIndexedDBStore<PassSeasonData>(StorageKey.PASS);
  const passDataHandlers = getDataHandlers(
    team.key as TeamKey,
    PassSeason,
    passStore,
    (s: PassSeason) => s.toStoreData(),
    setPassSeasons
  );

  const recvStore = useIndexedDBStore<RecvSeasonData>(StorageKey.RECV);
  const recvDataHandlers = getDataHandlers(
    team.key as TeamKey,
    RecvSeason,
    recvStore,
    (s: RecvSeason) => s.toStoreData(),
    setRecvSeasons
  );

  const rushStore = useIndexedDBStore<RushSeasonData>(StorageKey.RUSH);
  const rushDataHandlers = getDataHandlers(
    team.key as TeamKey,
    RushSeason,
    rushStore,
    (s: RushSeason) => s.toStoreData(),
    setRushSeasons
  );

  useEffect(() => {
    const fetch = async () => {
      await setupPersistence();
      passDataHandlers.initSeasons();
      recvDataHandlers.initSeasons();
      rushDataHandlers.initSeasons();
    };
    fetch();
  }, []);

  let playerPanel;
  const commonProps = {
    team,
    statType,
    setStatType,
  };
  switch (statType) {
  case StatType.PASS:
    playerPanel = (
      <PlayerPanel<PassSeason>
        {...commonProps}
        relevantPositions={[Position.QB]}
        seasons={passSeasons}
        initSeason={passDataHandlers.initSeason}
        // TODO passing in particular have to enforce that all gp in a team sum to 1.
        updateSeason={passDataHandlers.updateSeason}
        persistSeason={passDataHandlers.persistSeason}
        deleteSeason={passDataHandlers.deleteSeason}
      />
    );
    break;
  case StatType.RECV:
    playerPanel = (
      <PlayerPanel<RecvSeason>
        {...commonProps}
        relevantPositions={[Position.WR, Position.TE, Position.RB]}
        seasons={recvSeasons}
        initSeason={recvDataHandlers.initSeason}
        updateSeason={recvDataHandlers.updateSeason}
        persistSeason={recvDataHandlers.persistSeason}
        deleteSeason={recvDataHandlers.deleteSeason}
      />
    );
    break;
  default: // Rushing
    playerPanel = (
      <PlayerPanel<RushSeason>
        {...commonProps}
        relevantPositions={[Position.RB, Position.QB, Position.WR]}
        seasons={rushSeasons}
        initSeason={rushDataHandlers.initSeason}
        updateSeason={rushDataHandlers.updateSeason}
        persistSeason={rushDataHandlers.persistSeason}
        deleteSeason={rushDataHandlers.deleteSeason}
      />
    );
  }

  const passingTotal = _.sumBy([...passSeasons.values()], (s) => s.att * s.gp);

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
            {playerPanel}
          </Card>
        </Grid>
        <Grid container direction={'column'} item xs={6} spacing={spacing}>
          <Grid item xs={4}>
            <Card className={'h-full'}>
              <Typography className={'w-full text-center'}>
                Team Stats
              </Typography>
              <Paper className={'px-8 py-5'}>
                <TeamPanel team={team} passingTotal={passingTotal} />
              </Paper>
            </Card>
          </Grid>
          {[0, 1].map((i) => (
            <Grid key={i} container item xs={4} spacing={spacing}>
              {[0, 1].map((j) => (
                <Grid key={j} item xs={6}>
                  <Card className={'h-full'}>
                    <div className={'h-full relative'}>
                      <Typography className={'text-xl w-full text-center'}>
                        {`${lastYear} Target Share`}
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
