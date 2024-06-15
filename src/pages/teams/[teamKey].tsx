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
  PassSeason,
  RecvSeason,
  RushSeason,
  extractSeasons,
  passAggregateToSeason,
  recvAggregateToSeason,
  rushAggregateToSeason,
} from '@/models/PlayerSeason';
import { TeamSeason, teamSeasonFromPrisma } from '@/models/TeamSeason';
import { AppState, useAppDispatch } from '@/store';
import {
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
// const getClientDataHandlers = <T extends PlayerSeason>(
//   teamKey: TeamKey,
//   playerSeasons: IdMap<T>,
//   mkDefault: (player: Player, team: TeamKey) => T,
//   table: Table,
//   setValidationMessage: (message: string) => void
// ) => {
//   const initSeason = (player: Player, projection: Projection) => {
//     const lastSeason = playerSeasons.get(player.id);
//     let season = lastSeason
//       ? _.cloneDeep(lastSeason)
//       : mkDefault(player, teamKey as TeamKey);
//     season = ensureValid(season, projection);
//     // Presumably could not have been null to get this far.
//     // TODO still probably could do better to handle mid season switches...
//     // and / or reseting the client DB if a player changes teams...
//     season.team = toEnumValue(TeamKey, player.teamName as string);
//     table
//       .put(season, player.id)
//       // TODO would prefer to render optimistically and resolve failure
//       // but that could be more complicated... for later
//       .then(() => updateSeason(season))
//       .catch(alert);
//   };
//
//   const updateSeason = (season: T) => {
//     setSeasons((s: IdMap<T>) => setOnClone(s, season.playerId, season));
//   };
//
//   const persistSeason = (season: T, projection: Projection) => {
//     const [updatedSeason, wasValid] = clampPlayerSeason(season, projection);
//     if (!wasValid) {
//       setValidationMessage(
//         'Player projection limited in accordance with team total.'
//       );
//     }
//     // TODO untangle this reference to the other fn
//     updateSeason(updatedSeason);
//     // TODO unhardcode kirk cousins
//     table.update(20, updatedSeason);
//   };
//
//   const deleteSeason = (playerId: number) => {
//     setSeasons((season) => {
//       season.delete(playerId);
//       return season;
//     });
//     table.where('id').equals(playerId).delete();
//   };
//
//   return {
//     fetchSeasons,
//     initSeason,
//     updateSeason,
//     persistSeason,
//     deleteSeason,
//   };
// };

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

  useEffect(() => {
    dispatch(loadPlayerProjections(team.key));
  }, [dispatch]);

  const [selectedPlayer, setSelectedPlayer] = useState<Player | undefined>(
    undefined
  );

  const [playerSeasonValidationMessage, setPlayerSeasonValidationMessage] =
    useState('');
  const [teamSeasonValidationMessage, setTeamSeasonValidationMessage] =
    useState('');

  // TODO still embarrassing to WET this up...
  const playerBaseSeasons = _.merge(
    _(lastYearPassAggregates)
      .groupBy('playerId')
      .mapValues((agg, playerId) => ({
        playerId: parseInt(playerId),
        team: agg[0].team,
        gp: _.sumBy(agg, 'gp'),
      }))
      .value(),
    _(lastYearRecvAggregates)
      .groupBy('playerId')
      .mapValues((agg, playerId) => ({
        playerId: parseInt(playerId),
        team: agg[0].team,
        gp: _.sumBy(agg, 'gp'),
      }))
      .value(),
    _(lastYearRushAggregates)
      .groupBy('playerId')
      .mapValues((agg, playerId) => ({
        playerId: parseInt(playerId),
        team: agg[0].team,
        gp: _.sumBy(agg, 'gp'),
      }))
      .value()
  );

  const playerPassSeasons = _(lastYearPassAggregates)
    .groupBy('playerId')
    .mapValues((agg, playerId) =>
      passAggregateToSeason({
        playerId: parseInt(playerId),
        team: agg[0].team,
        gp: _.sumBy(agg, 'gp'),
        att: _.sumBy(agg, 'att'),
        cmp: _.sumBy(agg, 'cmp'),
        yds: _.sumBy(agg, 'yds'),
        tds: _.sumBy(agg, 'tds'),
      })
    )
    .mapValues((agg, _) => ({
      pass: agg,
    }))
    .value();

  const playerRecvSeasons = _(lastYearRecvAggregates)
    .groupBy('playerId')
    .mapValues((agg, playerId) =>
      recvAggregateToSeason({
        playerId: parseInt(playerId),
        team: agg[0].team,
        gp: _.sumBy(agg, 'gp'),
        tgt: _.sumBy(agg, 'tgt'),
        rec: _.sumBy(agg, 'rec'),
        yds: _.sumBy(agg, 'yds'),
        tds: _.sumBy(agg, 'tds'),
      })
    )
    .mapValues((agg, _) => ({
      recv: agg,
    }))
    .value();

  const playerRushSeasons = _(lastYearRushAggregates)
    .groupBy('playerId')
    .mapValues((agg, playerId) =>
      rushAggregateToSeason({
        playerId: parseInt(playerId),
        team: agg[0].team,
        gp: _.sumBy(agg, 'gp'),
        att: _.sumBy(agg, 'att'),
        yds: _.sumBy(agg, 'yds'),
        tds: _.sumBy(agg, 'tds'),
      })
    )
    .mapValues((agg, _) => ({
      rush: agg,
    }))
    .value();

  const lastSeasons = _.merge(
    _.map(playerBaseSeasons, (v) => ({ base: v })),
    playerPassSeasons,
    playerRecvSeasons,
    playerRushSeasons
  );

  // TODO how tf am I getting a playerId == 0 here?
  console.log('lastSeasons', lastSeasons);

  if (!teamProjection) {
    return null; // Shouldn't happen.
  }

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

  const commonProps = {
    team,
    statType,
    selectedPlayer,
    setSelectedPlayer,
    projections: playerProjections,
    lastSeasons,
  };

  const playerPanel = {
    [StatType.PASS]: (
      <PlayerPanel {...commonProps} relevantPositions={[Position.QB]} />
    ),
    [StatType.RECV]: (
      <PlayerPanel
        {...commonProps}
        relevantPositions={[Position.WR, Position.TE, Position.RB]}
      />
    ),
    [StatType.RUSH]: (
      <PlayerPanel
        {...commonProps}
        relevantPositions={[Position.RB, Position.QB, Position.WR]}
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
              passSeasons={extractSeasons<PassSeason>(
                'pass',
                playerProjections
              )}
              recvSeasons={extractSeasons<RecvSeason>(
                'recv',
                playerProjections
              )}
              rushSeasons={extractSeasons<RushSeason>(
                'rush',
                playerProjections
              )}
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
