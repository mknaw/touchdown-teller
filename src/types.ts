import { Prisma } from '@prisma/client';

import { PassAggregate, RecvAggregate, RushAggregate } from '@/data/ssr';
import { PassSeason, RecvSeason, RushSeason } from '@/models/PlayerSeason';

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
    homeGames: true;
    awayGames: true;
  };
}>;

export type PlayerSeason = PassSeason | RecvSeason | RushSeason;

export type SeasonAggregate<T extends PlayerSeason> = T extends PassSeason
  ? PassAggregate
  : T extends RecvSeason
  ? RecvAggregate
  : RushAggregate;
