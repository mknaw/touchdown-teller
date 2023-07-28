import { Player, Prisma } from '@prisma/client';

import { TeamKey } from '@/constants';
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

export interface IDBStore<T> {
  add(value: T, key?: number): Promise<number>;
  update(value: T, key?: number): Promise<number>;
  getByID(id: string | number): Promise<T>;
  getManyByKey(keyPath: string, value: string | number): Promise<T[]>;
  deleteByID(id: number): Promise<number>;
}

export type IdMap<T> = Map<number, T>;

export type SliderMarks = Array<{ label?: string; value: number }>;

export type TeamWithExtras = Prisma.TeamGetPayload<{
  include: {
    players: {
      include: {
        passGames: true;
        rushGames: true;
        recvGames: true;
      };
    };
    seasons: true;
    passGames: {
      include: {
        player: {
          select: {
            name: true;
          };
        };
      };
    };
    recvGames: {
      include: {
        player: {
          select: {
            name: true;
          };
        };
      };
    };
    rushGames: {
      include: {
        player: {
          select: {
            name: true;
          };
        };
      };
    };
    homeGames: true;
    awayGames: true;
  };
}>;

export type PlayerSeason = PassSeason | RecvSeason | RushSeason;

export type PlayerSeasonData<T extends PlayerSeason> = T extends PassSeason
  ? PassSeasonData
  : T extends RecvSeason
  ? RecvSeasonData
  : RushSeasonData;

export type SeasonAggregate<T extends PlayerSeason> = T extends PassSeason
  ? PassAggregate
  : T extends RecvSeason
  ? RecvAggregate
  : RushAggregate;

export interface PlayerSeasonConstructable<T extends PlayerSeason> {
  new (data: PlayerSeasonData<T>): T;
  default(player: Player, team: TeamKey): T;
  fromAggregate(aggregate: SeasonAggregate<T>): T;
}

export function createPlayerSeason<T extends PlayerSeason>(
  Klass: PlayerSeasonConstructable<T>,
  data: PlayerSeasonData<T>
): T {
  return new Klass(data);
}
