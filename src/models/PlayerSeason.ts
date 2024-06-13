import { Player } from '@prisma/client';

import { TeamKey } from '@/constants';
import { PassAggregate, RecvAggregate, RushAggregate } from '@/data/ssr';

export type GamesPlayed = {
  gp: number;
}

export type PlayerBaseProjection = GamesPlayed & {
  playerId: number;
};

export type PassSeason = {
  playerId: number;
  // name: string;
  team: TeamKey;
  att: number;
  cmp: number;
  ypa: number;
  tdp: number;
};

export const mkDefaultPassSeason = (
  player: Player,
  team: TeamKey
): PassSeason => ({
  playerId: player.id,
  // name: player.name,
  team,
  att: 30,
  cmp: 75,
  ypa: 7.5,
  tdp: 5,
});

export const passAggregateToSeason = ({
  playerId,
  name,
  team,
  gp,
  att,
  cmp,
  yds,
  tds,
}: PassAggregate): PassSeason => ({
  playerId,
  // name,
  team,
  att: att / gp,
  cmp: 100 * (cmp / att),
  ypa: yds / att,
  tdp: 100 * (tds / att),
});

// TODO when is this even used? can't this be `PassAggregate`?
export type AnnualizedPassSeason = {
  att: number;
  cmp: number;
  yds: number;
  tds: number;
};

export function annualizePassSeason(
  season: PassSeason,
  gp: number
): AnnualizedPassSeason {
  return {
    att: season.att * gp,
    cmp: (season.cmp / 100) * season.att * gp,
    yds: season.ypa * season.att * (season.cmp / 100) * gp,
    tds: (season.tdp / 100) * season.att * gp,
  };
}

export type RecvSeason = {
  playerId: number;
  // name: string;
  team: TeamKey;
  tgt: number;
  rec: number;
  ypr: number;
  tdp: number;
};

export const mkDefaultRecvSeason = (
  player: Player,
  team: TeamKey
): RecvSeason => ({
  playerId: player.id,
  // name: player.name,
  team,
  tgt: 6,
  rec: 65,
  ypr: 9,
  tdp: 5,
});

export const recvAggregateToSeason = ({
  playerId,
  name,
  team,
  gp,
  tgt,
  rec,
  yds,
  tds,
}: RecvAggregate): RecvSeason => ({
  playerId,
  // name,
  team,
  tgt: tgt / gp,
  rec: 100 * (rec / tgt),
  ypr: yds / rec,
  tdp: 100 * (tds / rec),
});

export type AnnualizedRecvSeason = {
  tgt: number;
  rec: number;
  yds: number;
  tds: number;
};

export const annualizeRecvSeason = (
  season: RecvSeason,
  gp: number
): AnnualizedRecvSeason => ({
  tgt: season.tgt * gp,
  rec: season.tgt * (season.rec / 100) * gp,
  yds: season.tgt * (season.rec / 100) * season.ypr * gp,
  tds: season.tgt * (season.rec / 100) * (season.tdp / 100) * gp,
});

export type RushSeason = {
  playerId: number;
  // name: string;
  team: TeamKey;
  att: number;
  ypc: number;
  tdp: number;
};

export const mkDefaultRushSeason = (
  player: Player,
  team: TeamKey
): RushSeason => ({
  playerId: player.id,
  // name: player.name,
  team,
  att: 20,
  ypc: 3.5,
  tdp: 5,
});

export const rushAggregateToSeason = ({
  playerId,
  name,
  team,
  gp,
  att,
  yds,
  tds,
}: RushAggregate): RushSeason => ({
  playerId,
  // name,
  team,
  att: att / gp,
  ypc: yds / att,
  tdp: 100 * (tds / att),
});

export type AnnualizedRushSeason = {
  att: number;
  yds: number;
  tds: number;
};

export const annualizeRushSeason = (
  season: RushSeason,
  gp: number
): AnnualizedRushSeason => ({
  att: season.att * gp,
  yds: season.att * season.ypc * gp,
  tds: season.att * (season.tdp / 100) * gp,
});

export interface PlayerProjection {
  id: number;
  pass: Exclude<PassSeason, 'playerId' | 'name'>;
  recv: Exclude<RecvSeason, 'playerId' | 'name'>;
  rush: Exclude<RushSeason, 'playerId' | 'name'>;
}
