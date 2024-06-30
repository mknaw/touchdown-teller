import _ from 'lodash';

import {
  PassGame,
  Player,
  Prisma,
  PrismaClient,
  RecvGame,
  RushGame,
  TeamSeason,
} from '@prisma/client';

import { TeamKey } from '@/constants';
import {
  AnnualizedPassSeason,
  AnnualizedRecvSeason,
  AnnualizedRushSeason,
  PlayerProjections,
  passAggregateToSeason,
  recvAggregateToSeason,
  rushAggregateToSeason,
} from '@/models/PlayerSeason';
import { TeamWithExtras } from '@/types';

export async function getAllPlayers(prisma: PrismaClient): Promise<Player[]> {
  return await prisma.player.findMany();
}

export async function getTeam(
  prisma: PrismaClient,
  teamKey: string,
  year: number
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
              season: year,
            },
          },
          rushGames: {
            where: {
              season: year,
            },
          },
          recvGames: {
            where: {
              season: year,
            },
          },
        },
      },
      seasons: {
        where: {
          season: year,
        },
      },
      homeGames: true,
      awayGames: true,
    },
  });
}

export async function getPlayerPassGame(
  prisma: PrismaClient,
  playerIds: number[],
  year: number
): Promise<PassGame[]> {
  return prisma.passGame.findMany({
    where: {
      season: year,
      player_id: {
        in: playerIds,
      },
    },
  });
}

export async function getPlayerRecvGame(
  prisma: PrismaClient,
  playerIds: number[],
  year: number
): Promise<RecvGame[]> {
  return prisma.recvGame.findMany({
    where: {
      season: year,
      player_id: {
        in: playerIds,
      },
    },
  });
}

export async function getPlayerRushGame(
  prisma: PrismaClient,
  playerIds: number[],
  year: number
): Promise<RushGame[]> {
  return prisma.rushGame.findMany({
    where: {
      season: year,
      player_id: {
        in: playerIds,
      },
    },
  });
}

const downcastBigInts = (obj: object) =>
  _.mapValues(obj, (val) => (typeof val === 'bigint' ? Number(val) : val));

export type PassAggregate = {
  playerId: number;
  name: string;
  team: TeamKey;
  gp: number;
} & AnnualizedPassSeason;

export async function getPlayerPassAggregates(
  prisma: PrismaClient,
  teamKey: string,
  playerIds: number[],
  year: number
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
        s.season = ${year}
        AND (
          s.team = ${teamKey}
          OR s.player_id IN (${Prisma.join(playerIds)})
        )
    GROUP BY 
        s.player_id, s.team;
    `;
  return _.map(agg, downcastBigInts) as PassAggregate[];
}

export type RecvAggregate = {
  playerId: number;
  name: string;
  team: TeamKey;
  gp: number;
} & AnnualizedRecvSeason;

export async function getPlayerRecvAggregates(
  prisma: PrismaClient,
  teamKey: string,
  playerIds: number[],
  year: number
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
        s.season = ${year}
        AND (
          s.team = ${teamKey}
          OR s.player_id IN (${Prisma.join(playerIds)})
        )
    GROUP BY 
        s.player_id, s.team;
    `;
  return _.map(agg, downcastBigInts) as RecvAggregate[];
}

export type RushAggregate = {
  playerId: number;
  name: string;
  team: TeamKey;
  gp: number;
} & AnnualizedRushSeason;

export async function getPlayerRushAggregates(
  prisma: PrismaClient,
  teamKey: string,
  playerIds: number[],
  year: number
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
        s.season = ${year}
        AND (
          s.team = ${teamKey}
          OR s.player_id IN (${Prisma.join(playerIds)})
        )
    GROUP BY 
        s.player_id, s.team;
    `;
  return _.map(agg, downcastBigInts) as RushAggregate[];
}

export async function getTeamSeasons(
  prisma: PrismaClient,
  year: number
): Promise<TeamSeason[]> {
  return await prisma.teamSeason.findMany({
    where: {
      season: year,
    },
  });
}

export const mergeStats = (
  passAggregates: PassAggregate[],
  recvAggregates: RecvAggregate[],
  rushAggregates: RushAggregate[]
): PlayerProjections => {
  // TODO still not a very elegant function!
  const playerBaseSeasons = _.merge(
    _(passAggregates)
      .groupBy('playerId')
      .mapValues((agg, playerId) => ({
        playerId: parseInt(playerId),
        team: agg[0].team,
        gp: _.sumBy(agg, 'gp'),
      }))
      .value(),
    _(recvAggregates)
      .groupBy('playerId')
      .mapValues((agg, playerId) => ({
        playerId: parseInt(playerId),
        team: agg[0].team,
        gp: _.sumBy(agg, 'gp'),
      }))
      .value(),
    _(rushAggregates)
      .groupBy('playerId')
      .mapValues((agg, playerId) => ({
        playerId: parseInt(playerId),
        team: agg[0].team,
        gp: _.sumBy(agg, 'gp'),
      }))
      .value()
  );

  const playerPassSeasons = _(passAggregates)
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

  const playerRecvSeasons = _(recvAggregates)
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

  const playerRushSeasons = _(rushAggregates)
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

  return _.merge(
    _.mapValues(playerBaseSeasons, (v) => ({ base: v })),
    playerPassSeasons,
    playerRecvSeasons,
    playerRushSeasons
  );
};
