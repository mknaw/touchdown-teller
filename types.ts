import { Prisma } from '@prisma/client';

// TODO could get this from some sort of cfg + calculation.
export const lastSeason = 2022;

export type SliderMarks = Array<{ label?: string; value: number }>;

export type TeamWithExtras = Prisma.TeamGetPayload<{
  include: {
    players: {
      include: {
        passingSeasons: true;
        rushingSeasons: true;
        receivingSeasons: true;
      };
    };
    seasons: true;
    passingSeasons: true;
    receivingSeasons: true;
    rushingSeasons: true;
    homeGames: true;
    awayGames: true;
  };
}>;

export type PlayerWithExtras = Prisma.PlayerGetPayload<{
  include: {
    passingSeasons: true;
    rushingSeasons: true;
    receivingSeasons: true;
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

export type TeamProjectionData = Pick<
  TeamProjection,
  'playsPerGame' | 'passRunRatio'
>;

export class TeamProjection {
  playsPerGame: number;
  passRunRatio: number;

  constructor(props: TeamProjectionData) {
    this.playsPerGame = props.playsPerGame;
    this.passRunRatio = props.passRunRatio;
  }

  static default() {
    return new TeamProjection({
      playsPerGame: 65,
      passRunRatio: 50,
    });
  }

  attempts() {
    return this.playsPerGame * gameCount;
  }

  passAttempts() {
    return Math.floor(this.attempts() * (this.passRunRatio / 100));
  }

  rushAttempts() {
    return this.attempts() - this.passAttempts();
  }
}

export interface Share {
  id: number;
  team: TeamKey;
  share: number;
}

export interface PassStatData {
  id: number;
  gp: number; // Games played
  att: number; // Attempts per game
  cmp: number; // Completion percentage
  ypa: number; // Yards per attempt
  tdp: number; // Touchdown percentage
}

export class PassStats implements PassStatData {
  id: number;
  gp: number;
  att: number;
  cmp: number;
  ypa: number;
  tdp: number;

  constructor(props: PassStatData) {
    this.id = props.id;
    this.gp = props.gp;
    this.att = props.att;
    this.cmp = props.cmp;
    this.ypa = props.ypa;
    this.tdp = props.tdp;
  }

  static default(id: number) {
    return new PassStats({
      id,
      gp: 17,
      att: 30,
      cmp: 75,
      ypa: 7.5,
      tdp: 5,
    });
  }

  toStoreData(): PassStatData {
    return {
      id: this.id,
      gp: this.gp,
      att: this.att,
      cmp: this.cmp,
      ypa: this.ypa,
      tdp: this.tdp,
    };
  }

  labelFor(stat: string): string {
    switch (stat) {
    case 'gp':
      return 'Games Played';
    case 'att':
      return 'Attempts per Game';
    case 'cmp':
      return 'Completion Percentage';
    case 'ypa':
      return 'Yards per Attempt';
    default: // tdp
      return 'Touchdown Percentage';
    }
  }

  isPercentField(stat: string): boolean {
    return ['cmp', 'tdp'].includes(stat);
  }
}

// TODO deleteme
export function defaultPassStats(id: number): PassStatData {
  return {
    id,
    gp: 17,
    att: 30,
    cmp: 75,
    ypa: 7.5,
    tdp: 5,
  };
}

export interface RushStatData {
  id: number;
  gp: number; // Games played
  att: number; // Attempts per game
  ypc: number; // Yards per carry
  tdp: number; // Touchdown percentage
}

// TODO deleteme
export function defaultRushStats(id: number): RushStatData {
  return {
    id,
    gp: 15,
    att: 20,
    ypc: 3.5,
    tdp: 5,
  };
}

export class RushStats implements RushStatData {
  id: number;
  gp: number;
  att: number;
  ypc: number;
  tdp: number;

  constructor(props: RushStatData) {
    this.id = props.id;
    this.gp = props.gp;
    this.att = props.att;
    this.ypc = props.ypc;
    this.tdp = props.tdp;
  }

  static default(id: number) {
    return new RushStats({
      id,
      gp: 15,
      att: 20,
      ypc: 3.5,
      tdp: 5,
    });
  }

  toStoreData(): RushStatData {
    return {
      id: this.id,
      gp: this.gp,
      att: this.att,
      ypc: this.ypc,
      tdp: this.tdp,
    };
  }

  labelFor(stat: string): string {
    switch (stat) {
    case 'gp':
      return 'Games Played';
    case 'att':
      return 'Attempts per Game';
    case 'ypc':
      return 'Yards per Carry';
    default: // tdp
      return 'Touchdown Percentage';
    }
  }

  isPercentField(stat: string): boolean {
    return stat == 'tdp';
  }
}

export interface RecvStatData {
  id: number;
  gp: number; // Games played
  tgt: number; // Targets per game
  rec: number; // Completion percentage
  ypr: number; // Yards per reception
  tdp: number; // Touchdown percentage
}

export function defaultRecvStats(id: number): RecvStatData {
  return {
    id,
    gp: 15,
    tgt: 6,
    rec: 65,
    ypr: 9,
    tdp: 5,
  };
}

export class RecvStats implements RecvStatData {
  id: number;
  gp: number;
  tgt: number;
  rec: number;
  ypr: number;
  tdp: number;

  constructor(props: RecvStatData) {
    this.id = props.id;
    this.gp = props.gp;
    this.tgt = props.tgt;
    this.rec = props.rec;
    this.ypr = props.ypr;
    this.tdp = props.tdp;
  }

  static default(id: number) {
    return new RecvStats({
      id,
      gp: 15,
      tgt: 6,
      rec: 65,
      ypr: 9,
      tdp: 5,
    });
  }

  toStoreData(): RecvStatData {
    return {
      id: this.id,
      gp: this.gp,
      tgt: this.tgt,
      rec: this.rec,
      ypr: this.ypr,
      tdp: this.tdp,
    };
  }

  // TODO don't really love typing arg as any `string` here,
  // but have to figure out how to appease typescript better
  labelFor(stat: string): string {
    switch (stat) {
    case 'gp':
      return 'Games Played';
    case 'tgt':
      return 'Targets per Game';
    case 'rec':
      return 'Reception Percentage';
    case 'ypr':
      return 'Yard per Reception';
    default: // tdp
      return 'Touchdown Percentage';
    }
  }

  isPercentField(stat: string): boolean {
    return ['rec', 'tdp'].includes(stat);
  }
}

export type PlayerStats = PassStats | RecvStats | RushStats;

export type PlayerStatData<T extends PlayerStats> = T extends PassStats
  ? PassStatData
  : T extends RecvStats
  ? RecvStatData
  : RushStatData;

export interface PlayerStatConstructable<T extends PlayerStats> {
  new (data: PlayerStatData<T>): T;
  default(id: number): T;
}

export function createPlayerStats<T extends PlayerStats>(
  Klass: PlayerStatConstructable<T>,
  data: PlayerStatData<T>
): T {
  return new Klass(data);
}
