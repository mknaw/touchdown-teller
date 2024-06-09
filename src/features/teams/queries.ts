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

import {
  PassAggregate,
  RecvAggregate,
  RushAggregate,
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
