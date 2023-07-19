import {
  Player,
  Prisma,
  PassSeason as PrismaPassSeason,
  RecvSeason as PrismaRecvSeason,
  RushSeason as PrismaRushSeason,
} from '@prisma/client';

import { TeamKey } from '@/constants';
import {
  PassSeason,
  PassSeasonData,
  RecvSeason,
  RecvSeasonData,
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
        passSeasons: true;
        rushSeasons: true;
        recvSeasons: true;
      };
    };
    seasons: true;
    passSeasons: {
      include: {
        player: {
          select: {
            name: true;
          };
        };
      };
    };
    recvSeasons: {
      include: {
        player: {
          select: {
            name: true;
          };
        };
      };
    };
    rushSeasons: {
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

export type PlayerWithExtras = Prisma.PlayerGetPayload<{
  include: {
    passSeasons: true;
    rushSeasons: true;
    recvSeasons: true;
  };
}>;

export type PassSeasonWithExtras = Prisma.PassSeasonGetPayload<{
  include: {
    player: {
      select: {
        name: true;
      };
    };
  };
}>;

export type RecvSeasonWithExtras = Prisma.RecvSeasonGetPayload<{
  include: {
    player: {
      select: {
        name: true;
      };
    };
  };
}>;

export type RushSeasonWithExtras = Prisma.RushSeasonGetPayload<{
  include: {
    player: {
      select: {
        name: true;
      };
    };
  };
}>;

export type PlayerSeason = PassSeason | RecvSeason | RushSeason;

export type PlayerSeasonData<T extends PlayerSeason> = T extends PassSeason
  ? PassSeasonData
  : T extends RecvSeason
  ? RecvSeasonData
  : RushSeasonData;

export type PrismaPlayerSeason<T extends PlayerSeason> = T extends PassSeason
  ? PrismaPassSeason
  : T extends RecvSeason
  ? PrismaRecvSeason
  : PrismaRushSeason;

export interface PlayerSeasonConstructable<T extends PlayerSeason> {
  new (data: PlayerSeasonData<T>): T;
  default(player: Player, team: TeamKey): T;
  fromPrisma(player: Player, team: TeamKey, season: PrismaPlayerSeason<T>): T;
}

export function createPlayerSeason<T extends PlayerSeason>(
  Klass: PlayerSeasonConstructable<T>,
  data: PlayerSeasonData<T>
): T {
  return new Klass(data);
}
