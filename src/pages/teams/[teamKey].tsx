import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

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
import {
  getPlayerPassAggregates,
  getPlayerPassGame,
  getPlayerRecvAggregates,
  getPlayerRecvGame,
  getPlayerRushAggregates,
  getPlayerRushGame,
  getTeam,
  mergeStats,
} from '@/data/ssr';
import { PassAggregate, RecvAggregate, RushAggregate } from '@/data/ssr';
import TeamSeasonsModal from '@/features/TeamSeasonsModal';
import PlayerGameLog from '@/features/teams/PlayerGameLog';
import PlayerPanel from '@/features/teams/PlayerPanel';
import TeamPanel from '@/features/teams/TeamPanel';
import {
  AnnualizedPassSeason,
  AnnualizedRecvSeason,
  AnnualizedRushSeason,
  annualizePlayerProjection,
} from '@/models/PlayerSeason';
import { AppState, useAppDispatch } from '@/store';
import { ValidationErrors, clearValidationErrors } from '@/store/appStateSlice';
import {
  PlayerProjectionsStore,
  loadPlayerProjections,
} from '@/store/playerProjectionSlice';
import { TeamWithExtras } from '@/types';
import { getTeamName } from '@/utils';

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

  const validationErrors = useSelector<AppState, ValidationErrors>(
    (state) => state.appState.validationErrors
  );

  const lastSeasons = mergeStats(
    lastYearPassAggregates,
    lastYearRecvAggregates,
    lastYearRushAggregates
  );

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

  const annualizedProjections = _.mapValues(
    playerProjections,
    annualizePlayerProjection
  );

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
            <ValidationErrorSnackbar errors={validationErrors.player} />
          </Card>
        </div>
        <Card className={'flex flex-col h-full relative'}>
          {team.seasons[0] && (
            <TeamPanel
              teamKey={team.key as TeamKey}
              statType={statType}
              lastSeason={lastSeason}
              passSeasons={
                _(annualizedProjections).mapValues('pass').pickBy().value() as {
                  [id: number]: AnnualizedPassSeason;
                }
              }
              recvSeasons={
                _(annualizedProjections).mapValues('recv').pickBy().value() as {
                  [id: number]: AnnualizedRecvSeason;
                }
              }
              rushSeasons={
                _(annualizedProjections).mapValues('rush').pickBy().value() as {
                  [id: number]: AnnualizedRushSeason;
                }
              }
              passAggregates={_(lastYearPassAggregates)
                .filter((agg) => agg.team == team.key)
                .keyBy('playerId')
                .value()}
              recvAggregates={_(lastYearRecvAggregates)
                .filter((agg) => agg.team == team.key)
                .keyBy('playerId')
                .value()}
              rushAggregates={_(lastYearRushAggregates)
                .filter((agg) => agg.team == team.key)
                .keyBy('playerId')
                .value()}
              names={_.merge(
                _(team.players).keyBy('id').mapValues('name').value(),
                // TODO kinda clunky to redo here considering all the shit we already did above for mergeStats
                _(lastYearPassAggregates)
                  .keyBy('playerId')
                  .mapValues('name')
                  .value(),
                _(lastYearRecvAggregates)
                  .keyBy('playerId')
                  .mapValues('name')
                  .value(),
                _(lastYearRushAggregates)
                  .keyBy('playerId')
                  .mapValues('name')
                  .value()
              )}
            />
          )}
          <ValidationErrorSnackbar errors={validationErrors.team} />
        </Card>
        <Card className={'h-full w-full'}>
          {games.length ? (
            <>
              <div className={'flex flex-col h-full'}>
                <Typography className={'text-center text-2xl'}>
                  2022 Gamelog
                </Typography>
                <div className={'flex w-full h-full'}>
                  <PlayerGameLog className={'h-full w-full relative'} games={games} />
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

const ValidationErrorSnackbar = ({ errors }: { errors: string[] }) => {
  const dispatch = useAppDispatch();

  return (
    <Snackbar
      sx={{ position: 'absolute' }}
      open={errors.length > 0}
      autoHideDuration={3000}
      message={errors.join('\n')}
      onClose={() => dispatch(clearValidationErrors())}
    />
  );
};
