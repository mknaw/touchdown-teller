import { Prisma } from '@prisma/client';

import {
  PassSeason,
  PassSeasonData,
  RecvSeason,
  RecvSeasonData,
  RushSeason,
  RushSeasonData,
} from '@/models/PlayerSeason';

// TODO could get this from some sort of cfg + calculation.
export const lastYear = 2022;

export type SliderMarks = Array<{ label?: string; value: number }>;

export type TeamWithExtras = Prisma.TeamGetPayload<{
  include: {
    players: {
      include: {
        passSeasons: true;
        rushSeasons: true;
        recvSeasons: true;
      };
    };
    seasons: true;
    passSeasons: true;
    recvSeasons: true;
    rushSeasons: true;
    homeGames: true;
    awayGames: true;
  };
}>;

export type PlayerWithExtras = Prisma.PlayerGetPayload<{
  include: {
    passSeasons: true;
    rushSeasons: true;
    recvSeasons: true;
  };
}>;

export enum TeamKey {
  ARI = 'ARI',
  ATL = 'ATL',
  BAL = 'BAL',
  BUF = 'BUF',
  CAR = 'CAR',
  CHI = 'CHI',
  CIN = 'CIN',
  CLE = 'CLE',
  DAL = 'DAL',
  DEN = 'DEN',
  DET = 'DET',
  GB = 'GB',
  HOU = 'HOU',
  IND = 'IND',
  JAX = 'JAX',
  KC = 'KC',
  LV = 'LV',
  LAC = 'LAC',
  LAR = 'LAR',
  MIA = 'MIA',
  MIN = 'MIN',
  NWE = 'NWE',
  NO = 'NO',
  NYG = 'NYG',
  NYJ = 'NYJ',
  PHI = 'PHI',
  PIT = 'PIT',
  SF = 'SF',
  SEA = 'SEA',
  TB = 'TB',
  TEN = 'TEN',
  WSH = 'WSH',
}

export enum Position {
  QB = 'QB',
  RB = 'RB',
  WR = 'WR',
  TE = 'TE',
}

export enum StatType {
  PASS = 'pass',
  RECV = 'recv',
  RUSH = 'rush',
}

export const gameCount = 17;

export type PlayerSeason = PassSeason | RecvSeason | RushSeason;

export type PlayerSeasonData<T extends PlayerSeason> = T extends PassSeason
  ? PassSeasonData
  : T extends RecvSeason
  ? RecvSeasonData
  : RushSeasonData;

export interface PlayerSeasonConstructable<T extends PlayerSeason> {
  new (data: PlayerSeasonData<T>): T;
  default(id: number, team: TeamKey): T;
}

export function createPlayerSeason<T extends PlayerSeason>(
  Klass: PlayerSeasonConstructable<T>,
  data: PlayerSeasonData<T>
): T {
  return new Klass(data);
}
