import { Dispatch, SetStateAction, useEffect, useState } from 'react';

import _ from 'lodash';
import type { GetStaticPaths, GetStaticProps } from 'next';
import { ParsedUrlQuery } from 'querystring';
import { useIndexedDBStore } from 'use-indexeddb';

import {
  PassGames,
  Player,
  Prisma,
  PrismaClient,
  RecvGames,
  RushGames,
} from '@prisma/client';

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
import PlayerGameLog from '@/features/teams/PlayerGameLog';
import PlayerPanel from '@/features/teams/PlayerPanel';
import TeamPanel from '@/features/teams/TeamPanel';
import {
  PassAggregate,
  PassSeason,
  PassSeasonData,
  RecvAggregate,
  RecvSeason,
  RecvSeasonData,
  RushAggregate,
  RushSeason,
  RushSeasonData,
} from '@/models/PlayerSeason';
import TeamSeason, { TeamSeasonData } from '@/models/TeamSeason';
import {
  IDBStore,
  IdMap,
  PlayerSeason,
  PlayerSeasonConstructable,
  PlayerSeasonData,
  TeamWithExtras,
  createPlayerSeason,
} from '@/types';
import { makeIdMap, setOnClone } from '@/utils';

interface Params extends ParsedUrlQuery {
  teamKey: TeamKey;
}

async function getTeam(
  prisma: PrismaClient,
  teamKey: string
): Promise<TeamWithExtras> {
  return await prisma.team.findFirstOrThrow({
    where: {
      key: teamKey,
    },
    include: {
      players: {
        include: {
          passGames: {
            where: {
              season: lastYear,
            },
          },
          rushGames: {
            where: {
              season: lastYear,
            },
          },
          recvGames: {
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
      homeGames: true,
      awayGames: true,
    },
  });
}

// TODO also could probably easily dedupe these fns
async function getPlayerPassGames(
  prisma: PrismaClient,
  playerIds: number[]
): Promise<PassGames[]> {
  return prisma.passGames.findMany({
    where: {
      season: lastYear,
      player_id: {
        in: playerIds,
      },
    },
  });
}

async function getPlayerRecvGames(
  prisma: PrismaClient,
  playerIds: number[]
): Promise<RecvGames[]> {
  return prisma.recvGames.findMany({
    where: {
      season: lastYear,
      player_id: {
        in: playerIds,
      },
    },
  });
}

async function getPlayerRushGames(
  prisma: PrismaClient,
  playerIds: number[]
): Promise<RushGames[]> {
  return prisma.rushGames.findMany({
    where: {
      season: lastYear,
      player_id: {
        in: playerIds,
      },
    },
  });
}

const downcastBigInts = (obj: object) =>
  _.mapValues(obj, (val) => (typeof val === 'bigint' ? Number(val) : val));

async function getPlayerPassAggregates(
  prisma: PrismaClient,
  teamKey: string,
  playerIds: number[]
): Promise<PassAggregate[]> {
  const agg: object[] = await prisma.$queryRaw`
    SELECT 
        p.id AS playerId,
        p.name,
        s.team,
        COUNT(s.week) AS gp,
        SUM(s.att) AS att,
        SUM(s.cmp) AS cmp,
        SUM(s.yds) AS yds,
        SUM(s.td) AS tds
    FROM 
        passing_game_stats s
    JOIN 
        player p ON p.id = s.player_id
    WHERE
        s.season = 2022
        AND (
          s.team = ${teamKey}
          OR s.player_id IN (${Prisma.join(playerIds)})
        )
    GROUP BY 
        s.player_id, s.team;
    `;
  return _.map(agg, downcastBigInts) as PassAggregate[];
}

async function getPlayerRecvAggregates(
  prisma: PrismaClient,
  teamKey: string,
  playerIds: number[]
): Promise<RecvAggregate[]> {
  const agg: object[] = await prisma.$queryRaw`
    SELECT 
        p.id AS playerId,
        p.name,
        s.team,
        COUNT(s.week) AS gp,
        SUM(s.tgt) AS tgt,
        SUM(s.rec) AS rec,
        SUM(s.yds) AS yds,
        SUM(s.td) AS tds
    FROM 
        receiving_game_stats s
    JOIN 
        player p ON p.id = s.player_id
    WHERE
        s.season = 2022
        AND (
          s.team = ${teamKey}
          OR s.player_id IN (${Prisma.join(playerIds)})
        )
    GROUP BY 
        s.player_id, s.team;
    `;
  return _.map(agg, downcastBigInts) as RecvAggregate[];
}

async function getPlayerRushAggregates(
  prisma: PrismaClient,
  teamKey: string,
  playerIds: number[]
): Promise<RushAggregate[]> {
  const agg: object[] = await prisma.$queryRaw`
    SELECT 
        p.id AS playerId,
        p.name,
        s.team,
        COUNT(s.week) AS gp,
        SUM(s.att) AS att,
        SUM(s.yds) AS yds,
        SUM(s.td) AS tds
    FROM 
        rushing_game_stats s
    JOIN 
        player p ON p.id = s.player_id
    WHERE
        s.season = 2022
        AND (
          s.team = ${teamKey}
          OR s.player_id IN (${Prisma.join(playerIds)})
        )
    GROUP BY 
        s.player_id, s.team;
    `;
  return _.map(agg, downcastBigInts) as RushAggregate[];
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
  const prisma = new PrismaClient();
  const team = await getTeam(prisma, teamKey);
  const playerIds = _.map(team.players, 'id');
  const [
    passGames,
    recvGames,
    rushGames,
    passAggregates,
    recvAggregates,
    rushAggregates,
  ] = await Promise.all([
    getPlayerPassGames(prisma, playerIds),
    getPlayerRecvGames(prisma, playerIds),
    getPlayerRushGames(prisma, playerIds),
    getPlayerPassAggregates(prisma, teamKey, playerIds),
    getPlayerRecvAggregates(prisma, teamKey, playerIds),
    getPlayerRushAggregates(prisma, teamKey, playerIds),
  ]);

  return {
    props: {
      team,
      passGames,
      recvGames,
      rushGames,
      passAggregates,
      recvAggregates,
      rushAggregates,
    },
  };
};

const getDataHandlers = <T extends PlayerSeason>(
  teamKey: TeamKey,
  playerSeasons: IdMap<T>,
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

  const initSeason = (player: Player) => {
    const lastSeason = playerSeasons.get(player.id);
    const season = lastSeason
      ? _.cloneDeep(lastSeason)
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

// TODO I think it will be better to have one big State that we pass
// to a validation module (maybe with an "event" characterizing what
// just changed)
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

const filterHistoricalPassAggregates = (seasons: PassAggregate[]) =>
  seasons.filter((s) => s.att > 100);

const filterHistoricalRecvAggregates = (seasons: RecvAggregate[]) =>
  seasons.filter((s) => s.tgt > 50);

const filterHistoricalRushAggregates = (seasons: RushAggregate[]) =>
  seasons.filter((s) => s.att > 50);

export default function Page({
  team,
  passGames,
  recvGames,
  rushGames,
  passAggregates,
  recvAggregates,
  rushAggregates,
}: {
  team: TeamWithExtras;
  passGames: PassGames[];
  recvGames: RecvGames[];
  rushGames: RushGames[];
  passAggregates: PassAggregate[];
  recvAggregates: RecvAggregate[];
  rushAggregates: RushAggregate[];
}) {
  const spacing = 4;

  const [statType, setStatType] = useState<StatType>(StatType.PASS);

  const [passSeasons, setPassSeasons] = useState<IdMap<PassSeason>>(new Map());
  const [recvSeasons, setRecvSeasons] = useState<IdMap<RecvSeason>>(new Map());
  const [rushSeasons, setRushSeasons] = useState<IdMap<RushSeason>>(new Map());

  const [selectedPlayer, setSelectedPlayer] = useState<Player | undefined>(
    undefined
  );
  // TODO
  //useEffect(() => {
  //  setSelectedPlayer(undefined);
  //}, [team]);

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
  // TODO really embarrassing to WET this up...
  const playerPassSeasons = makeIdMap(
    _.map(_.groupBy(passAggregates, 'playerId'), (agg, playerId) => {
      return PassSeason.fromAggregate({
        playerId: parseInt(playerId),
        name: agg[0].name,
        team: agg[0].team,
        gp: _.sumBy(agg, 'gp'),
        att: _.sumBy(agg, 'att'),
        cmp: _.sumBy(agg, 'cmp'),
        yds: _.sumBy(agg, 'yds'),
        tds: _.sumBy(agg, 'tds'),
      });
    }),
    'playerId'
  );
  const passDataHandlers = getDataHandlers(
    team.key as TeamKey,
    playerPassSeasons,
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
  const playerRecvSeasons = makeIdMap(
    _.map(_.groupBy(recvAggregates, 'playerId'), (agg, playerId) => {
      return RecvSeason.fromAggregate({
        playerId: parseInt(playerId),
        name: agg[0].name,
        team: agg[0].team,
        gp: _.sumBy(agg, 'gp'),
        tgt: _.sumBy(agg, 'tgt'),
        rec: _.sumBy(agg, 'rec'),
        yds: _.sumBy(agg, 'yds'),
        tds: _.sumBy(agg, 'tds'),
      });
    }),
    'playerId'
  );
  const recvDataHandlers = getDataHandlers(
    team.key as TeamKey,
    playerRecvSeasons,
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
  const playerRushSeasons = makeIdMap(
    _.map(_.groupBy(rushAggregates, 'playerId'), (agg, playerId) => {
      return RushSeason.fromAggregate({
        playerId: parseInt(playerId),
        name: agg[0].name,
        team: agg[0].team,
        gp: _.sumBy(agg, 'gp'),
        att: _.sumBy(agg, 'att'),
        yds: _.sumBy(agg, 'yds'),
        tds: _.sumBy(agg, 'tds'),
      });
    }),
    'playerId'
  );
  const rushDataHandlers = getDataHandlers(
    team.key as TeamKey,
    playerRushSeasons,
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
    setStatType: (st: StatType) => {
      // TODO probably could do better by remembering
      // the last selected player for each `StatType`
      setStatType(st);
      setSelectedPlayer(undefined);
    },
    selectedPlayer,
    setSelectedPlayer,
  };
  switch (statType) {
  case StatType.PASS:
    playerPanel = (
      <PlayerPanel<PassSeason>
        {...commonProps}
        relevantPositions={[Position.QB]}
        seasons={passSeasons}
        pastSeasons={playerPassSeasons}
        initSeason={passDataHandlers.initSeason}
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
        pastSeasons={playerRecvSeasons}
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
        pastSeasons={playerRushSeasons}
        initSeason={rushDataHandlers.initSeason}
        updateSeason={rushDataHandlers.updateSeason}
        persistSeason={(s) =>
          rushDataHandlers.persistSeason(s, rushPersistValidator)
        }
        deleteSeason={rushDataHandlers.deleteSeason}
      />
    );
  }

  const games = selectedPlayer
    ? {
      [StatType.PASS]: _.filter(
        passGames,
        (g) => g.player_id == selectedPlayer.id
      ),
      [StatType.RECV]: _.filter(
        recvGames,
        (g) => g.player_id == selectedPlayer.id
      ),
      [StatType.RUSH]: _.filter(
        rushGames,
        (g) => g.player_id == selectedPlayer.id
      ),
    }[statType]
    : [];

  // TODO not sure how I'll handle old players for the lastSeason...
  return (
    <div className={'flex h-full pb-5'}>
      <Grid
        container
        alignItems='stretch'
        justifyContent='stretch'
        spacing={spacing}
      >
        <Grid item xs={6} className={'h-full'}>
          <Card className={'h-full flex-col justify-stretch relative'}>
            {playerPanel}
          </Card>
        </Grid>
        <Grid item xs={6} container direction={'column'} spacing={spacing}>
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
                      [StatType.PASS]: (
                        <PassChartGroup
                          seasons={passSeasons}
                          lastSeasons={makeIdMap(
                            filterHistoricalPassAggregates(
                              _.filter(
                                passAggregates,
                                (agg) => agg.team == team.key
                              )
                            ),
                            'playerId'
                          )}
                          teamSeason={teamSeason}
                          lastSeason={team.seasons[0]}
                        />
                      ),
                      [StatType.RECV]: (
                        <RecvChartGroup
                          seasons={recvSeasons}
                          lastSeasons={makeIdMap(
                            filterHistoricalRecvAggregates(
                              _.filter(
                                recvAggregates,
                                (agg) => agg.team == team.key
                              )
                            ),
                            'playerId'
                          )}
                          teamSeason={teamSeason}
                          lastSeason={team.seasons[0]}
                        />
                      ),
                      [StatType.RUSH]: (
                        <RushChartGroup
                          seasons={rushSeasons}
                          lastSeasons={makeIdMap(
                            filterHistoricalRushAggregates(
                              _.filter(
                                rushAggregates,
                                (agg) => agg.team == team.key
                              )
                            ),
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
          <Grid item xs={4} className={'h-full'}>
            <Card className={'h-full w-full'}>
              {games.length ? (
                <>
                  <div className={'flex-col h-full bg-slate-500'}>
                    <Typography className={'text-center'}>
                      2022 Gamelog
                    </Typography>
                    {/* TODO flexing to fill the rest of the space is driving me insane! */}
                    <div className={'flex w-full bg-red-500'}>
                      <PlayerGameLog
                        className={'h-full w-full'}
                        games={games}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div>No player selected</div>
              )}
            </Card>
          </Grid>
        </Grid>
      </Grid>
    </div>
  );
}
