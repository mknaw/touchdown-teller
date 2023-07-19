import { Dispatch, SetStateAction, useEffect, useState } from 'react';

import _ from 'lodash';
import type { GetStaticPaths, GetStaticProps } from 'next';
import { ParsedUrlQuery } from 'querystring';
import { useIndexedDBStore } from 'use-indexeddb';

import { PrismaClient } from '@prisma/client';

import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

import Card from '@/components/Card';
import { Position, StatType, TeamKey, gameCount, lastYear } from '@/constants';
import { StorageKey, setupPersistence, teamStoreKey } from '@/data/persistence';
import {
  PassChartGroup,
  RecvChartGroup,
  RushChartGroup,
} from '@/features/teams/ChartGroup';
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
import TeamSeason, { TeamSeasonData } from '@/models/TeamSeason';
import {
  IDBStore,
  IdMap,
  PassSeasonWithExtras,
  PlayerSeason,
  PlayerSeasonConstructable,
  PlayerSeasonData,
  PlayerWithExtras,
  PrismaPlayerSeason,
  RecvSeasonWithExtras,
  RushSeasonWithExtras,
  TeamWithExtras,
  createPlayerSeason,
} from '@/types';
import { makeIdMap, setOnClone } from '@/utils';

interface Params extends ParsedUrlQuery {
  teamKey: TeamKey;
}

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
        include: {
          player: {
            select: {
              name: true,
            },
          },
        },
      },
      rushSeasons: {
        where: {
          season: lastYear,
        },
        include: {
          player: {
            select: {
              name: true,
            },
          },
        },
      },
      recvSeasons: {
        where: {
          season: lastYear,
        },
        include: {
          player: {
            select: {
              name: true,
            },
          },
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

const getDataHandlers = <T extends PlayerSeason>(
  teamKey: TeamKey,
  seasonKey: 'passSeasons' | 'recvSeasons' | 'rushSeasons',
  constructor: PlayerSeasonConstructable<T>,
  store: IDBStore<PlayerSeasonData<T>>,
  toStoreData: (s: T) => PlayerSeasonData<T>,
  setSeason: Dispatch<SetStateAction<IdMap<T>>>
) => {
  const fetchedDataToMap = (data: PlayerSeasonData<T>[]): IdMap<T> =>
    new Map(
      data
        .map((d) => createPlayerSeason(constructor, d))
        .map((p) => [p.playerId, p])
    );

  const initSeasons = async () => {
    const data = await store.getManyByKey('team', teamKey);
    setSeason(fetchedDataToMap(data as PlayerSeasonData<T>[]));
  };

  const initSeason = (player: PlayerWithExtras) => {
    const lastSeason = player[seasonKey][0];

    const season = lastSeason
      ? constructor.fromPrisma(
        player,
          teamKey as TeamKey,
          lastSeason as PrismaPlayerSeason<T>
      )
      : constructor.default(player, teamKey as TeamKey);
    store
      .add(toStoreData(season), player.id)
      // TODO would prefer to render optimistically and resolve failure
      // but that could be more complicated... for later
      .then(() => updateSeason(season))
      .catch(alert);
  };

  const updateSeason = (season: T) => {
    setSeason((s: IdMap<T>) => setOnClone(s, season.playerId, season));
  };

  const persistSeason = (
    season: T,
    // `validator` returns an error message if the update is _not_ valid.
    validator: undefined | (() => string | null)
  ) => {
    updateSeason(season);
    const errorMsg = (validator && validator()) || '';
    if (errorMsg) {
      // Use the `store` to fetch the previous value.
      // Less overhead trying to "remember" it this way.
      store.getByID(season.playerId).then((seasonData) => {
        alert(errorMsg);
        updateSeason(new constructor(seasonData));
      });
    } else {
      store.update(toStoreData(season), season.playerId);
    }
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

const validateAgainstTeamTotals = <T extends PlayerSeason>(
  seasons: IdMap<T>,
  teamSeason: TeamSeason,
  specs: [string, string, string][]
) => {
  if (!teamSeason) return '';
  const annualized = [...seasons.values()].map((s) => s.annualize());
  for (const [stat, teamStat, label] of specs) {
    if (
      _.sumBy(annualized, stat) >
      teamSeason[teamStat as keyof typeof teamSeason]
    ) {
      return `Sum of players' projected ${label} cannot exceed projected team total.`;
    }
  }
  return '';
};

const filterHistoricalPassSeasons = (seasons: PassSeasonWithExtras[]) =>
  seasons.filter((s) => s.att > 100);

const filterHistoricalRecvSeasons = (seasons: RecvSeasonWithExtras[]) =>
  seasons.filter((s) => s.tgt > 50);

const filterHistoricalRushSeasons = (seasons: RushSeasonWithExtras[]) =>
  seasons.filter((s) => s.att > 50);

export default function Page({ team }: { team: TeamWithExtras }) {
  const spacing = 4;

  const [statType, setStatType] = useState<StatType>(StatType.PASS);

  const [passSeasons, setPassSeasons] = useState<IdMap<PassSeason>>(new Map());
  const [recvSeasons, setRecvSeasons] = useState<IdMap<RecvSeason>>(new Map());
  const [rushSeasons, setRushSeasons] = useState<IdMap<RushSeason>>(new Map());

  const [teamSeason, setTeamSeason] = useState<TeamSeason | null>(null);
  const persistTeamSeason = (data: TeamSeasonData) => {
    const teamProjection = new TeamSeason(data);
    teamStore.update(data, team.key);
    setTeamSeason(teamProjection);
  };
  const teamStore = useIndexedDBStore<TeamSeasonData>(teamStoreKey);
  const lastSeason = team.seasons[0];
  if (!lastSeason) {
    return null; // Shouldn't happen.
  }
  useEffect(() => {
    async function fetch() {
      await setupPersistence();
      const teamProjectionData = await teamStore.getByID(team.key);
      if (teamProjectionData) {
        setTeamSeason(new TeamSeason(teamProjectionData));
      } else {
        const newTeamSeason = TeamSeason.fromPrisma(lastSeason);
        setTeamSeason(newTeamSeason);
        teamStore.add(newTeamSeason, team.key);
      }
    }
    fetch();
  }, [team, teamStore]);

  const passStore = useIndexedDBStore<PassSeasonData>(StorageKey.PASS);
  const passDataHandlers = getDataHandlers(
    team.key as TeamKey,
    'passSeasons',
    PassSeason,
    passStore,
    (s: PassSeason) => s.toStoreData(),
    setPassSeasons
  );
  const passPersistValidator = () => {
    if (_.sumBy([...passSeasons.values()], 'gp') > gameCount) {
      return `Team QBs cannot exceed ${gameCount} games played.`;
    }
    if (!teamSeason) return '';
    return validateAgainstTeamTotals(passSeasons, teamSeason, [
      ['att', 'passAtt', 'attempts'],
      ['cmp', 'passCmp', 'completions'],
      ['yds', 'passYds', 'yards'],
      ['tds', 'passTds', 'touchdowns'],
    ]);
  };

  const recvStore = useIndexedDBStore<RecvSeasonData>(StorageKey.RECV);
  const recvDataHandlers = getDataHandlers(
    team.key as TeamKey,
    'recvSeasons',
    RecvSeason,
    recvStore,
    (s: RecvSeason) => s.toStoreData(),
    setRecvSeasons
  );
  const recvPersistValidator = () => {
    // TODO questionable ...
    // should have it but nothing should be changeable if we don't
    if (!teamSeason) return '';
    return validateAgainstTeamTotals(passSeasons, teamSeason, [
      ['tgt', 'passAtt', 'targets'],
      ['rec', 'passCmp', 'receptions'],
      ['yds', 'passYds', 'yards'],
      ['tds', 'passTds', 'touchdowns'],
    ]);
  };

  const rushStore = useIndexedDBStore<RushSeasonData>(StorageKey.RUSH);
  const rushDataHandlers = getDataHandlers(
    team.key as TeamKey,
    'rushSeasons',
    RushSeason,
    rushStore,
    (s: RushSeason) => s.toStoreData(),
    setRushSeasons
  );
  const rushPersistValidator = () => {
    // TODO questionable ...
    // should have it but nothing should be changeable if we don't
    if (!teamSeason) return '';
    if (!teamSeason) return '';
    return validateAgainstTeamTotals(passSeasons, teamSeason, [
      ['att', 'rushAtt', 'carries'],
      ['yds', 'rushYds', 'yards'],
      ['tds', 'rushTds', 'touchdowns'],
    ]);
  };

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
        persistSeason={(s) =>
          passDataHandlers.persistSeason(s, passPersistValidator)
        }
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
        persistSeason={(s) =>
          recvDataHandlers.persistSeason(s, recvPersistValidator)
        }
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
        persistSeason={(s) =>
          rushDataHandlers.persistSeason(s, rushPersistValidator)
        }
        deleteSeason={rushDataHandlers.deleteSeason}
      />
    );
  }

  // TODO not sure how I'll handle old players for the lastSeason...
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
          <Grid item xs={8}>
            <Card className={'h-full'}>
              <Typography className={'text-xl w-full text-center'}>
                Team Stats
              </Typography>
              {teamSeason && team.seasons[0] && (
                <>
                  <TeamPanel
                    statType={statType}
                    teamSeason={teamSeason}
                    setTeamSeason={setTeamSeason}
                    persistTeamSeason={persistTeamSeason}
                    lastSeason={lastSeason}
                  />
                  {
                    {
                      [StatType.PASS]: team.passSeasons && (
                        <PassChartGroup
                          seasons={passSeasons}
                          lastSeasons={makeIdMap(
                            filterHistoricalPassSeasons(team.passSeasons),
                            'playerId'
                          )}
                          teamSeason={teamSeason}
                          lastSeason={team.seasons[0]}
                        />
                      ),
                      [StatType.RECV]: team.recvSeasons && (
                        <RecvChartGroup
                          seasons={recvSeasons}
                          lastSeasons={makeIdMap(
                            filterHistoricalRecvSeasons(team.recvSeasons),
                            'playerId'
                          )}
                          teamSeason={teamSeason}
                          lastSeason={team.seasons[0]}
                        />
                      ),
                      [StatType.RUSH]: team.rushSeasons && (
                        <RushChartGroup
                          seasons={rushSeasons}
                          lastSeasons={makeIdMap(
                            filterHistoricalRushSeasons(team.rushSeasons),
                            'playerId'
                          )}
                          teamSeason={teamSeason}
                          lastSeason={team.seasons[0]}
                        />
                      ),
                    }[statType]
                  }
                </>
              )}
            </Card>
          </Grid>
          {[0].map((i) => (
            <Grid key={i} container item xs={4} spacing={spacing}>
              {[0, 1].map((j) => (
                <Grid key={j} item xs={6}>
                  <Card className={'h-full'}>
                    <div className={'h-full relative'}>
                      <Typography className={'text-xl w-full text-center'}>
                        {`${lastYear} Target Share`}
                      </Typography>
                      {/*
                      <div className={'flex h-full justify-center'}>
                        <div className={'flex w-full justify-center'}>
                          <DoughnutChart data={chartData} />
                        </div>
                      </div>
                      */}
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
