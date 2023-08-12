import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import _ from 'lodash';
import type { GetStaticPaths, GetStaticProps } from 'next';
import { ParsedUrlQuery } from 'querystring';
import { useIndexedDBStore } from 'use-indexeddb';

import {
  PassGame,
  Player,
  PrismaClient,
  RecvGame,
  RushGame,
} from '@prisma/client';

import Snackbar from '@mui/material/Snackbar';
import Typography from '@mui/material/Typography';

import Card from '@/components/Card';
import { Position, StatType, TeamKey } from '@/constants';
import { StorageKey, setupPersistence, teamStoreKey } from '@/data/persistence';
import TeamComparisonDialog from '@/features/TeamComparisonDialog';
import {
  PassChartGroup,
  RecvChartGroup,
  RushChartGroup,
} from '@/features/teams/ChartGroup';
import PlayerGameLog from '@/features/teams/PlayerGameLog';
import PlayerPanel from '@/features/teams/PlayerPanel';
import TeamPanel from '@/features/teams/TeamPanel';
import {
  getPlayerPassAggregates,
  getPlayerPassGame,
  getPlayerRecvAggregates,
  getPlayerRecvGame,
  getPlayerRushAggregates,
  getPlayerRushGame,
  getTeam,
} from '@/features/teams/queries';
import {
  clampPlayerSeason,
  clampTeamSeason,
  ensureValid,
} from '@/features/teams/validation';
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
import { AppState } from '@/store';
import { toggleTeamPassSeasonModal } from '@/store/appStateSlice';
import {
  IDBStore,
  IdMap,
  PlayerSeason,
  PlayerSeasonConstructable,
  PlayerSeasonData,
  TeamWithExtras,
  createPlayerSeason,
} from '@/types';
import { getTeamName, makeIdMap, setOnClone } from '@/utils';

interface Params extends ParsedUrlQuery {
  teamKey: TeamKey;
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
    getPlayerPassGame(prisma, playerIds),
    getPlayerRecvGame(prisma, playerIds),
    getPlayerRushGame(prisma, playerIds),
    getPlayerPassAggregates(prisma, teamKey, playerIds),
    getPlayerRecvAggregates(prisma, teamKey, playerIds),
    getPlayerRushAggregates(prisma, teamKey, playerIds),
  ]);

  return {
    props: {
      team,
      title: getTeamName(team.key as TeamKey),
      passGames,
      recvGames,
      rushGames,
      passAggregates,
      recvAggregates,
      rushAggregates,
    },
  };
};

export type Projection = {
  teamSeason: TeamSeason;
  passSeasons: PassSeason[];
  recvSeasons: RecvSeason[];
  rushSeasons: RushSeason[];
};

const getDataHandlers = <T extends PlayerSeason>(
  teamKey: TeamKey,
  playerSeasons: IdMap<T>,
  constructor: PlayerSeasonConstructable<T>,
  store: IDBStore<PlayerSeasonData<T>>,
  toStoreData: (s: T) => PlayerSeasonData<T>,
  setSeason: Dispatch<SetStateAction<IdMap<T>>>,
  setValidationMessage: (message: string) => void
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

  const initSeason = (player: Player, projection: Projection) => {
    const lastSeason = playerSeasons.get(player.id);
    let season = lastSeason
      ? _.cloneDeep(lastSeason)
      : constructor.default(player, teamKey as TeamKey);
    season = ensureValid(season, projection);
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

  const persistSeason = (season: T, projection: Projection) => {
    const [updatedSeason, wasValid] = clampPlayerSeason(season, projection);
    if (!wasValid) {
      setValidationMessage(
        'Player projection limited in accordance with team total.'
      );
    }
    updateSeason(updatedSeason);
    store.update(toStoreData(updatedSeason), season.playerId);
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
  passGames: PassGame[];
  recvGames: RecvGame[];
  rushGames: RushGame[];
  passAggregates: PassAggregate[];
  recvAggregates: RecvAggregate[];
  rushAggregates: RushAggregate[];
}) {
  const statType = useSelector<AppState, StatType>(
    (state) => state.settings.statType
  );

  const [passSeasons, setPassSeasons] = useState<IdMap<PassSeason>>(new Map());
  const [recvSeasons, setRecvSeasons] = useState<IdMap<RecvSeason>>(new Map());
  const [rushSeasons, setRushSeasons] = useState<IdMap<RushSeason>>(new Map());

  const [selectedPlayer, setSelectedPlayer] = useState<Player | undefined>(
    undefined
  );

  const [teamSeason, setTeamSeason] = useState<TeamSeason | null>(null);
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

  const [playerSeasonValidationMessage, setPlayerSeasonValidationMessage] =
    useState('');
  const [teamSeasonValidationMessage, setTeamSeasonValidationMessage] =
    useState('');

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
    setPassSeasons,
    setPlayerSeasonValidationMessage
  );

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
    setRecvSeasons,
    setPlayerSeasonValidationMessage
  );

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
    setRushSeasons,
    setPlayerSeasonValidationMessage
  );

  useEffect(() => {
    const fetch = async () => {
      await setupPersistence();
      passDataHandlers.initSeasons();
      recvDataHandlers.initSeasons();
      rushDataHandlers.initSeasons();
    };
    fetch();
  }, [team]);

  const commonProps = {
    team,
    statType,
    selectedPlayer,
    setSelectedPlayer,
  };
  if (!teamSeason) {
    return null; // Shouldn't happen.
  }

  const projection = {
    teamSeason,
    passSeasons: [...passSeasons.values()],
    recvSeasons: [...recvSeasons.values()],
    rushSeasons: [...rushSeasons.values()],
  };

  const persistTeamSeason = () => {
    const [newTeamSeason, wasValid] = clampTeamSeason(projection);
    setTeamSeason(() => _.cloneDeep(newTeamSeason));

    if (wasValid) {
      teamStore.update(newTeamSeason.toStoreData(), team.key);
    } else {
      setTeamSeasonValidationMessage(
        'Team total limited in accordance with player projection total.'
      );
    }
  };

  const playerPanel = {
    [StatType.PASS]: (
      <PlayerPanel<PassSeason>
        {...commonProps}
        relevantPositions={[Position.QB]}
        seasons={passSeasons}
        pastSeasons={playerPassSeasons}
        initSeason={(p) => passDataHandlers.initSeason(p, projection)}
        updateSeason={passDataHandlers.updateSeason}
        persistSeason={(s) => passDataHandlers.persistSeason(s, projection)}
        deleteSeason={passDataHandlers.deleteSeason}
      />
    ),
    [StatType.RECV]: (
      <PlayerPanel<RecvSeason>
        {...commonProps}
        relevantPositions={[Position.WR, Position.TE, Position.RB]}
        seasons={recvSeasons}
        pastSeasons={playerRecvSeasons}
        initSeason={(p) => recvDataHandlers.initSeason(p, projection)}
        updateSeason={recvDataHandlers.updateSeason}
        persistSeason={(s) => recvDataHandlers.persistSeason(s, projection)}
        deleteSeason={recvDataHandlers.deleteSeason}
      />
    ),
    [StatType.RUSH]: (
      <PlayerPanel<RushSeason>
        {...commonProps}
        relevantPositions={[Position.RB, Position.QB, Position.WR]}
        seasons={rushSeasons}
        pastSeasons={playerRushSeasons}
        initSeason={(p) => rushDataHandlers.initSeason(p, projection)}
        updateSeason={rushDataHandlers.updateSeason}
        persistSeason={(s) => rushDataHandlers.persistSeason(s, projection)}
        deleteSeason={rushDataHandlers.deleteSeason}
      />
    ),
  }[statType];

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

  const teamPanelHeader = {
    [StatType.PASS]: 'Team Passing Stats',
    [StatType.RECV]: 'Team Receiving Stats',
    [StatType.RUSH]: 'Team Rushing Stats',
  }[statType];

  const dispatch = useDispatch();

  return (
    <div className={'flex h-full pb-5'}>
      <TeamComparisonDialog />
      <div className={'flex grid-cols-2 gap-8 h-full w-full'}>
        <div className={'h-full w-full'}>
          <Card className={'h-full flex-col justify-stretch relative'}>
            {playerPanel}
            <Snackbar
              className={'absolute'}
              open={!!playerSeasonValidationMessage}
              autoHideDuration={3000}
              message={playerSeasonValidationMessage}
              onClose={() => setPlayerSeasonValidationMessage('')}
            />
          </Card>
        </div>
        <div className={'w-full h-full grid grid-flow-row grid-rows-3 gap-8'}>
          <Card className={'row-span-2 h-full relative flex flex-col'}>
            {/* TODO ought to do a better job of vertical alignment with LHS */}
            {/* TODO also ought to just be in the `TeamPanel` */}
            <Typography
              className={'text-2xl w-full text-center cursor-pointer py-4'}
              onClick={() => dispatch(toggleTeamPassSeasonModal())}
            >
              {teamPanelHeader}
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
                <div
                  className={
                    'grid grid-flow-row grid-rows-4 h-full overflow-hidden'
                  }
                >
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
                </div>
              </>
            )}
            <Snackbar
              className={'absolute'}
              open={!!teamSeasonValidationMessage}
              autoHideDuration={3000}
              message={teamSeasonValidationMessage}
              onClose={() => setTeamSeasonValidationMessage('')}
            />
          </Card>
          <Card className={'h-full w-full'}>
            {games.length ? (
              <>
                <div className={'flex flex-col h-full'}>
                  <Typography className={'text-center text-2xl'}>
                    2022 Gamelog
                  </Typography>
                  <div className={'flex w-full h-full'}>
                    <PlayerGameLog className={'h-full w-full'} games={games} />
                  </div>
                </div>
              </>
            ) : (
              // TODO replace with schedule grid
              // Or even message about rookies...
              <div>No player selected</div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
