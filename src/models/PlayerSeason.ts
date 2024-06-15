import { Player } from '@prisma/client';

import { StatType, TeamKey } from '@/constants';
import { PassAggregate, RecvAggregate, RushAggregate } from '@/data/ssr';
import { IdMap, PlayerSeason } from '@/types';

// TODO all of these have `team` to use in a indexed + filtered IndexedDB query,
// but tbh it literally doesn't even matter, we could load all the players, or,
// if we really care, do a "fetch players with id in ..."

export type PlayerBaseProjection = {
  playerId: number;
  team: TeamKey;
  gp: number;
};

export const mkDefaultBase = (
  player: Player,
  team: TeamKey
): PlayerBaseProjection => ({
  playerId: player.id,
  team,
  gp: 17,
});

export type PassSeason = {
  playerId: number;
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
  team,
  att: 30,
  cmp: 75,
  ypa: 7.5,
  tdp: 5,
});

export const passAggregateToSeason = ({
  playerId,
  team,
  gp,
  att,
  cmp,
  yds,
  tds,
}: Exclude<PassAggregate, 'name'>): PassSeason => ({
  playerId,
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
  team,
  tgt: 6,
  rec: 65,
  ypr: 9,
  tdp: 5,
});

export const recvAggregateToSeason = ({
  playerId,
  team,
  gp,
  tgt,
  rec,
  yds,
  tds,
}: Exclude<RecvAggregate, 'name'>): RecvSeason => ({
  playerId,
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
  team,
  att: 20,
  ypc: 3.5,
  tdp: 5,
});

export const rushAggregateToSeason = ({
  playerId,
  team,
  gp,
  att,
  yds,
  tds,
}: Exclude<RushAggregate, 'name'>): RushSeason => ({
  playerId,
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

export const typeOfSeason = (season: PlayerSeason): StatType => {
  // TODO maybe try a tagged enum thing.
  if ('ypa' in season) {
    return StatType.PASS;
  } else if ('tgt' in season) {
    return StatType.RECV;
  } else {
    return StatType.RUSH;
  }
};

export interface PlayerProjection {
  id: number;
  // TODO tbh don't know if it's even worth normalizing so hard here, so what if we dupe it,
  // easier to write that back straight to the IndexedDB without having to fuck with it.
  base: Exclude<PlayerBaseProjection, 'playerId'>;
  pass?: Exclude<PassSeason, 'playerId'>;
  recv?: Exclude<RecvSeason, 'playerId'>;
  rush?: Exclude<RushSeason, 'playerId'>;
}

export type LastSeason = PlayerProjection;

export type PlayerProjections = {
  [playerId: number]: PlayerProjection;
};

export type LastSeasons = PlayerProjections;

// TODO not sure there is a real need for it, with better refactoring....
export function extractSeasons<T extends PlayerSeason>(
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
