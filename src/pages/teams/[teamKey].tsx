import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { Table } from 'dexie';
import _ from 'lodash';
import type { GetStaticPaths, GetStaticProps } from 'next';
import { ParsedUrlQuery } from 'querystring';

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
import Schedule from '@/components/Schedule';
import {
  Position,
  StatType,
  TeamKey,
  currentYear,
  lastYear,
} from '@/constants';
import { db, getTeamProjection } from '@/data/client';
import {
  getPlayerPassAggregates,
  getPlayerPassGame,
  getPlayerRecvAggregates,
  getPlayerRecvGame,
  getPlayerRushAggregates,
  getPlayerRushGame,
  getTeam,
} from '@/data/ssr';
import { PassAggregate, RecvAggregate, RushAggregate } from '@/data/ssr';
import TeamSeasonsModal from '@/features/TeamSeasonsModal';
import PlayerGameLog from '@/features/teams/PlayerGameLog';
import PlayerPanel from '@/features/teams/PlayerPanel';
import TeamPanel from '@/features/teams/TeamPanel';
import {
  clampPlayerSeason,
  clampTeamSeason,
  ensureValid,
} from '@/features/teams/validation';
import {
  GamesPlayed,
  PassSeason,
  RecvSeason,
  RushSeason,
  mkDefaultPassSeason,
  mkDefaultRecvSeason,
  mkDefaultRushSeason,
  passAggregateToSeason,
  recvAggregateToSeason,
  rushAggregateToSeason,
} from '@/models/PlayerSeason';
import { TeamSeason, teamSeasonFromPrisma } from '@/models/TeamSeason';
import { AppState, useAppDispatch } from '@/store';
import {
  PlayerProjections,
  PlayerProjectionsStore,
  loadPlayerProjections,
} from '@/store/playerProjectionSlice';
import {
  TeamProjectionStore,
  loadTeamProjection,
  persistTeamProjection,
} from '@/store/teamProjectionSlice';
import { IdMap, PlayerSeason, TeamWithExtras } from '@/types';
import { getTeamName, makeIdMap, setOnClone, toEnumValue } from '@/utils';

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
  const team = await getTeam(prisma, teamKey, lastYear);
  const playerIds = _.map(team.players, 'id');
  const [
    lastYearPassGames,
    lastYearRecvGames,
    lastYearRushGames,
    lastYearPassAggregates,
    lastYearRecvAggregates,
    lastYearRushAggregates,
  ] = await Promise.all([
    getPlayerPassGame(prisma, playerIds, lastYear),
    getPlayerRecvGame(prisma, playerIds, lastYear),
    getPlayerRushGame(prisma, playerIds, lastYear),
    getPlayerPassAggregates(prisma, teamKey, playerIds, lastYear),
    getPlayerRecvAggregates(prisma, teamKey, playerIds, lastYear),
    getPlayerRushAggregates(prisma, teamKey, playerIds, lastYear),
  ]);

  return {
    props: {
      team,
      title: getTeamName(team.key as TeamKey),
      lastYearPassGames,
      lastYearRecvGames,
      lastYearRushGames,
      lastYearPassAggregates,
      lastYearRecvAggregates,
      lastYearRushAggregates,
    },
  };
};

export type Projection = {
  teamSeason: TeamSeason;
  passSeasons: PassSeason[];
  recvSeasons: RecvSeason[];
  rushSeasons: RushSeason[];
};

// TODO shouldnt this be somewhere with general client data code?
const getClientDataHandlers = <T extends PlayerSeason>(
  teamKey: TeamKey,
  playerSeasons: IdMap<T>,
  mkDefault: (player: Player, team: TeamKey) => T,
  table: Table,
  setSeasons: Dispatch<SetStateAction<IdMap<T>>>,
  setValidationMessage: (message: string) => void
) => {
  const fetchSeasons = async () => {
    const fetchedDataToMap = (
      data: (T & GamesPlayed)[]
    ): IdMap<T & GamesPlayed> =>
      // TODO actually fetch
      new Map(data.map((ps) => [ps.playerId, { ...ps, gp: 0 }]));
    const data = await table.where('team').equals(teamKey).toArray();
    setSeasons(fetchedDataToMap(data as (T & GamesPlayed)[]));
  };

  const initSeason = (player: Player, projection: Projection) => {
    const lastSeason = playerSeasons.get(player.id);
    let season = lastSeason
      ? _.cloneDeep(lastSeason)
      : mkDefault(player, teamKey as TeamKey);
    season = ensureValid(season, projection);
    // Presumably could not have been null to get this far.
    // TODO still probably could do better to handle mid season switches...
    // and / or reseting the client DB if a player changes teams...
    season.team = toEnumValue(TeamKey, player.teamName as string);
    table
      .put(season, player.id)
      // TODO would prefer to render optimistically and resolve failure
      // but that could be more complicated... for later
      .then(() => updateSeason(season))
      .catch(alert);
  };

  const updateSeason = (season: T) => {
    setSeasons((s: IdMap<T>) => setOnClone(s, season.playerId, season));
  };

  const persistSeason = (season: T, projection: Projection) => {
    const [updatedSeason, wasValid] = clampPlayerSeason(season, projection);
    if (!wasValid) {
      setValidationMessage(
        'Player projection limited in accordance with team total.'
      );
    }
    // TODO untangle this reference to the other fn
    updateSeason(updatedSeason);
    // TODO unhardcode kirk cousins
    table.update(20, updatedSeason);
  };

  const deleteSeason = (playerId: number) => {
    setSeasons((season) => {
      season.delete(playerId);
      return season;
    });
    table.where('id').equals(playerId).delete();
  };

  return {
    fetchSeasons,
    initSeason,
    updateSeason,
    persistSeason,
    deleteSeason,
  };
};

// TODO these can go wherever, but probably no need for them here.
function extractSeasons<T extends PlayerSeason>(
  type: string,
  projections: PlayerProjections
): IdMap<T> {
  // TODO this is not very elegant, I'm sure there's nicer lodash here
  const val = _(Object.entries(projections))
    .filter(([_, p]) => !!p[type])
    .map(([playerId, p]) => [parseInt(playerId), p[type]])
    .value();

  return new Map(val);
}

export default function Page({
  team,
  lastYearPassGames,
  lastYearRecvGames,
  lastYearRushGames,
  lastYearPassAggregates,
  lastYearRecvAggregates,
  lastYearRushAggregates,
}: {
  team: TeamWithExtras;
  lastYearPassGames: PassGame[];
  lastYearRecvGames: RecvGame[];
  lastYearRushGames: RushGame[];
  lastYearPassAggregates: PassAggregate[];
  lastYearRecvAggregates: RecvAggregate[];
  lastYearRushAggregates: RushAggregate[];
}) {
  const dispatch = useAppDispatch();

  const lastSeason = team.seasons[0];
  if (!lastSeason) {
    return null; // Shouldn't happen.
  }

  useEffect(() => {
    dispatch(loadTeamProjection(team.key as TeamKey)).then(({ payload }) => {
      if (!payload) {
        const projection = teamSeasonFromPrisma(lastSeason);
        dispatch(persistTeamProjection(projection));
      }
    });
  }, [dispatch, team]);

  const { projection: teamProjection } = useSelector<
    AppState,
    TeamProjectionStore
  >((state) => state.teamProjection);

  const statType = useSelector<AppState, StatType>(
    (state) => state.settings.statType
  );

  const { projections: playerProjections } = useSelector<
    AppState,
    PlayerProjectionsStore
  >((state) => state.playerProjections);

  const passSeasons = extractSeasons<PassSeason>('pass', playerProjections);
  const recvSeasons = extractSeasons<RecvSeason>('recv', playerProjections);
  const rushSeasons = extractSeasons<RushSeason>('rush', playerProjections);

  useEffect(() => {
    dispatch(loadPlayerProjections(team.key));
  }, [dispatch]);

  const [_passSeasons, setPassSeasons] = useState<IdMap<PassSeason>>(new Map());
  const [_recvSeasons, setRecvSeasons] = useState<IdMap<RecvSeason>>(new Map());
  const [_rushSeasons, setRushSeasons] = useState<IdMap<RushSeason>>(new Map());

  const [selectedPlayer, setSelectedPlayer] = useState<Player | undefined>(
    undefined
  );

  const [playerSeasonValidationMessage, setPlayerSeasonValidationMessage] =
    useState('');
  const [teamSeasonValidationMessage, setTeamSeasonValidationMessage] =
    useState('');

  // TODO really embarrassing to WET this up...
  const playerPassSeasons = makeIdMap(
    _.map(_.groupBy(lastYearPassAggregates, 'playerId'), (agg, playerId) => {
      return passAggregateToSeason({
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
  const passDataHandlers = getClientDataHandlers(
    team.key as TeamKey,
    playerPassSeasons,
    mkDefaultPassSeason,
    db.pass,
    setPassSeasons,
    setPlayerSeasonValidationMessage
  );

  const playerRecvSeasons = makeIdMap(
    _.map(_.groupBy(lastYearRecvAggregates, 'playerId'), (agg, playerId) => {
      return recvAggregateToSeason({
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
  const recvDataHandlers = getClientDataHandlers(
    team.key as TeamKey,
    playerRecvSeasons,
    mkDefaultRecvSeason,
    db.recv,
    setRecvSeasons,
    setPlayerSeasonValidationMessage
  );

  const playerRushSeasons = makeIdMap(
    _.map(_.groupBy(lastYearRushAggregates, 'playerId'), (agg, playerId) => {
      return rushAggregateToSeason({
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
  const rushDataHandlers = getClientDataHandlers(
    team.key as TeamKey,
    playerRushSeasons,
    mkDefaultRushSeason,
    db.rush,
    setRushSeasons,
    setPlayerSeasonValidationMessage
  );

  useEffect(() => {
    const fetch = async () => {
      passDataHandlers.fetchSeasons();
      recvDataHandlers.fetchSeasons();
      rushDataHandlers.fetchSeasons();
    };
    fetch();
  }, [team]);

  const commonProps = {
    team,
    statType,
    selectedPlayer,
    setSelectedPlayer,
  };
  if (!teamProjection) {
    return null; // Shouldn't happen.
  }

  const projection = {
    teamSeason: teamProjection, // TODO rename this
    passSeasons: [...passSeasons.values()],
    recvSeasons: [...recvSeasons.values()],
    rushSeasons: [...rushSeasons.values()],
  };

  // const persistTeamSeason = () => {
  //   const [newTeamSeason, wasValid] = clampTeamSeason(projection);
  //   setTeamSeason(() => _.cloneDeep(newTeamSeason));
  //
  //   if (wasValid) {
  //     db.team.update(team.key as TeamKey, newTeamSeason);
  //   } else {
  //     setTeamSeasonValidationMessage(
  //       'Team total limited in accordance with player projection total.'
  //     );
  //   }
  // };

  const playerPanel = {
    [StatType.PASS]: (
      <PlayerPanel<PassSeason>
        {...commonProps}
        relevantPositions={[Position.QB]}
        seasons={passSeasons}
        pastSeasons={playerPassSeasons}
        initSeason={() => alert('probably dont need this anymore')}
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
        initSeason={() => alert('probably dont need this anymore')}
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
        initSeason={() => alert('probably dont need this anymore')}
        persistSeason={(s) => rushDataHandlers.persistSeason(s, projection)}
        deleteSeason={rushDataHandlers.deleteSeason}
      />
    ),
  }[statType];

  const games = selectedPlayer
    ? {
        [StatType.PASS]: _.filter(
          lastYearPassGames,
          (g) => g.player_id == selectedPlayer.id
        ),
        [StatType.RECV]: _.filter(
          lastYearRecvGames,
          (g) => g.player_id == selectedPlayer.id
        ),
        [StatType.RUSH]: _.filter(
          lastYearRushGames,
          (g) => g.player_id == selectedPlayer.id
        ),
      }[statType]
    : [];

  return (
    <div className={'flex h-full pb-5'}>
      <TeamSeasonsModal />
      <div
        className={
          'flex gap-8 h-full w-full flex-col lg:grid lg:grid-cols-2 lg:grid-flow-col'
        }
      >
        <div className={'h-full w-full lg:row-span-2'}>
          <Card className={'h-full flex-col justify-stretch relative'}>
            {playerPanel}
            <Snackbar
              sx={{ position: 'absolute' }}
              open={!!playerSeasonValidationMessage}
              autoHideDuration={3000}
              message={playerSeasonValidationMessage}
              onClose={() => setPlayerSeasonValidationMessage('')}
            />
          </Card>
        </div>
        <Card className={'flex flex-col h-full relative'}>
          {teamProjection && team.seasons[0] && (
            <TeamPanel
              statType={statType}
              teamSeason={teamProjection}
              setTeamSeason={() => null}
              persistTeamSeason={() => null}
              lastSeason={lastSeason}
              passSeasons={_passSeasons}
              recvSeasons={_recvSeasons}
              rushSeasons={_rushSeasons}
              passAggregates={_.filter(
                lastYearPassAggregates,
                (agg) => agg.team == team.key
              )}
              recvAggregates={_.filter(
                lastYearRecvAggregates,
                (agg) => agg.team == team.key
              )}
              rushAggregates={_.filter(
                lastYearRushAggregates,
                (agg) => agg.team == team.key
              )}
            />
          )}
          <Snackbar
            sx={{ position: 'absolute' }}
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
            <div className={'flex flex-col h-full'}>
              <Typography className={'text-center text-2xl mb-5'}>
                {`${currentYear} Schedule`}
              </Typography>
              <Schedule
                teamKey={team.key as TeamKey}
                games={[...team.awayGames, ...team.homeGames]}
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
