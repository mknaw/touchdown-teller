import _ from 'lodash';

import { Omit } from '@prisma/client/runtime/library';

import { StatType, TeamKey } from '@/constants';
import { PassAggregate, RecvAggregate, RushAggregate } from '@/data/ssr';
import { PlayerSeason } from '@/types';

// TODO all of these have `team` to use in a indexed + filtered IndexedDB query,
// but tbh it literally doesn't even matter, we could load all the players, or,
// if we really care, do a "fetch players with id in ..."

export type PlayerBaseProjection = {
  team: TeamKey;
  gp: number;
};

export const mkDefaultBase = (team: TeamKey): PlayerBaseProjection => ({
  team,
  gp: 17,
});

export type PassSeason = {
  att: number;
  cmp: number;
  ypa: number;
  tdp: number;
};

export const mkDefaultPassSeason = (): PassSeason => ({
  att: 30,
  cmp: 75,
  ypa: 7.5,
  tdp: 5,
});

export const passAggregateToSeason = ({
  gp,
  att,
  cmp,
  yds,
  tds,
}: Omit<PassAggregate, 'name'>): PassSeason => ({
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

export const annualizePassSeason = (
  season: Pick<PassSeason, 'att' | 'cmp' | 'ypa' | 'tdp'>,
  gp: number
): AnnualizedPassSeason => ({
  att: season.att * gp,
  cmp: (season.cmp / 100) * season.att * gp,
  yds: season.ypa * season.att * gp,
  tds: (season.tdp / 100) * season.att * gp,
});

// Not actually used for anything right now, but could be useful.
export const deannualizePassSeason = (
  season: Pick<AnnualizedPassSeason, 'att' | 'cmp' | 'yds' | 'tds'>,
  gp: number
): PassSeason => ({
  att: season.att / gp,
  cmp: 100 * (season.cmp / season.att),
  ypa: season.yds / season.att,
  tdp: 100 * (season.tds / season.att),
});

export type RecvSeason = {
  tgt: number;
  rec: number;
  ypr: number;
  tdp: number;
};

export const mkDefaultRecvSeason = (): RecvSeason => ({
  tgt: 6,
  rec: 65,
  ypr: 9,
  tdp: 5,
});

export const recvAggregateToSeason = ({
  gp,
  tgt,
  rec,
  yds,
  tds,
}: Omit<RecvAggregate, 'name'>): RecvSeason => ({
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
  season: Pick<RecvSeason, 'tgt' | 'rec' | 'ypr' | 'tdp'>,
  gp: number
): AnnualizedRecvSeason => ({
  tgt: season.tgt * gp,
  rec: season.tgt * (season.rec / 100) * gp,
  yds: season.tgt * (season.rec / 100) * season.ypr * gp,
  tds: season.tgt * (season.rec / 100) * (season.tdp / 100) * gp,
});

export const deannualizeRecvSeason = (
  season: Pick<AnnualizedRecvSeason, 'tgt' | 'rec' | 'yds' | 'tds'>,
  gp: number
): RecvSeason => ({
  tgt: season.tgt / gp,
  rec: 100 * (season.rec / season.tgt),
  ypr: season.yds / season.rec,
  tdp: 100 * (season.tds / season.rec),
});

export type RushSeason = {
  att: number;
  ypc: number;
  tdp: number;
};

export const mkDefaultRushSeason = (): RushSeason => ({
  att: 20,
  ypc: 3.5,
  tdp: 5,
});

export const rushAggregateToSeason = ({
  gp,
  att,
  yds,
  tds,
}: Omit<RushAggregate, 'name'>): RushSeason => ({
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
  season: Pick<RushSeason, 'att' | 'ypc' | 'tdp'>,
  gp: number
): AnnualizedRushSeason => ({
  att: season.att * gp,
  yds: season.att * season.ypc * gp,
  tds: season.att * (season.tdp / 100) * gp,
});

export const deannualizeRushSeason = (
  season: Pick<AnnualizedRushSeason, 'att' | 'yds' | 'tds'>,
  gp: number
): RushSeason => ({
  att: season.att / gp,
  ypc: season.yds / season.att,
  tdp: 100 * (season.tds / season.att),
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
  base: Omit<PlayerBaseProjection, 'playerId'>;
  pass?: PassSeason;
  recv?: RecvSeason;
  rush?: RushSeason;
}

export type PlayerProjections = {
  [playerId: number]: Omit<PlayerProjection, 'id'>;
};

export type AnnualizedSeason =
  | AnnualizedPassSeason
  | AnnualizedRecvSeason
  | AnnualizedRushSeason;

export type AggregatePlayerProjections = {
  pass: AnnualizedPassSeason & { gp: number };
  recv: AnnualizedRecvSeason;
  rush: AnnualizedRushSeason;
};

// TODO not sure about prepopulating the empty seasons here.
export const annualizePlayerProjection = (
  projection: Omit<PlayerProjection, 'id'>
): Partial<AggregatePlayerProjections> => ({
  ...(projection?.pass && {
    pass: {
      ...annualizePassSeason(projection.pass, projection.base.gp),
      gp: projection.base.gp,
    },
  }),
  ...(projection?.recv && {
    recv: annualizeRecvSeason(projection.recv, projection.base.gp),
  }),
  ...(projection?.rush && {
    rush: annualizeRushSeason(projection.rush, projection.base.gp),
  }),
});

export type SeasonTypeMap = {
  base: PlayerBaseProjection;
  pass: PassSeason;
  recv: RecvSeason;
  rush: RushSeason;
};

export function extractSeasons<T extends keyof SeasonTypeMap>(
  type: T,
  projections: PlayerProjections
): { [id: number]: SeasonTypeMap[T] } {
  return _(projections)
    .mapValues((v) => v[type])
    .pickBy(_.identity)
    .value() as { [id: number]: SeasonTypeMap[T] };
}
