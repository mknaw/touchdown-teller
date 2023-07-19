// TODO do the `fromPrisma` thing for sensible defaults for players with history
import {
  Player,
  PassSeason as PrismaPassSeason,
  RecvSeason as PrismaRecvSeason,
  RushSeason as PrismaRushSeason,
} from '@prisma/client';

import { TeamKey } from '@/constants';

type AnnualizedPassSeason = {
  att: number;
  yds: number;
  tds: number;
};

export type PassSeasonData = Pick<
  PassSeason,
  'playerId' | 'name' | 'team' | 'gp' | 'att' | 'cmp' | 'ypa' | 'tdp'
>;

export class PassSeason implements PassSeasonData {
  playerId: number;
  name: string; // Redundant, but convenient to "denormalize" onto here.
  team: TeamKey;
  gp: number;
  att: number;
  cmp: number;
  ypa: number;
  tdp: number;

  constructor(props: PassSeasonData) {
    this.playerId = props.playerId;
    this.name = props.name;
    this.team = props.team;
    this.gp = props.gp;
    this.att = props.att;
    this.cmp = props.cmp;
    this.ypa = props.ypa;
    this.tdp = props.tdp;
  }

  static default(player: Player, team: TeamKey) {
    return new PassSeason({
      playerId: player.id,
      name: player.name,
      team,
      gp: 0,
      att: 30,
      cmp: 75,
      ypa: 7.5,
      tdp: 5,
    });
  }

  static fromPrisma(
    player: Player,
    team: TeamKey,
    passSeason: PrismaPassSeason
  ) {
    return new PassSeason({
      playerId: player.id,
      name: player.name,
      team,
      gp: passSeason.gp,
      att: passSeason.att / passSeason.gp,
      cmp: 100 * (passSeason.cmp / passSeason.att),
      ypa: passSeason.yds / passSeason.att,
      tdp: 100 * (passSeason.tds / passSeason.att),
    });
  }

  toStoreData(): PassSeasonData {
    return {
      playerId: this.playerId,
      name: this.name,
      team: this.team,
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
      return 'Touchdowns per Attempt';
    }
  }

  isPercentField(stat: string): boolean {
    return ['cmp', 'tdp'].includes(stat);
  }

  annualize(): AnnualizedPassSeason {
    return {
      att: this.att * this.gp,
      yds: this.ypa * this.att * (this.cmp / 100) * this.gp,
      tds: (this.tdp / 100) * this.att * this.gp,
    };
  }
}

type AnnualizedRecvSeason = {
  tgt: number;
  rec: number;
  yds: number;
  tds: number;
};

export type RecvSeasonData = Pick<
  RecvSeason,
  'playerId' | 'name' | 'team' | 'gp' | 'tgt' | 'rec' | 'ypr' | 'tdp'
>;

export class RecvSeason implements RecvSeasonData {
  playerId: number;
  name: string;
  team: TeamKey;
  gp: number;
  tgt: number;
  rec: number;
  ypr: number;
  tdp: number;

  constructor(props: RecvSeasonData) {
    this.playerId = props.playerId;
    this.name = props.name;
    this.team = props.team;
    this.gp = props.gp;
    this.tgt = props.tgt;
    this.rec = props.rec;
    this.ypr = props.ypr;
    this.tdp = props.tdp;
  }

  static default(player: Player, team: TeamKey) {
    return new RecvSeason({
      playerId: player.id,
      name: player.name,
      team,
      gp: 0,
      tgt: 6,
      rec: 65,
      ypr: 9,
      tdp: 5,
    });
  }

  static fromPrisma(
    player: Player,
    team: TeamKey,
    recvSeason: PrismaRecvSeason
  ) {
    return new RecvSeason({
      playerId: player.id,
      name: player.name,
      team,
      gp: recvSeason.gp,
      tgt: recvSeason.tgt / recvSeason.gp,
      rec: 100 * (recvSeason.rec / recvSeason.tgt),
      ypr: recvSeason.yds / recvSeason.rec,
      tdp: 100 * (recvSeason.tds / recvSeason.rec),
    });
  }

  toStoreData(): RecvSeasonData {
    return {
      playerId: this.playerId,
      name: this.name,
      team: this.team,
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

  annualize(): AnnualizedRecvSeason {
    return {
      tgt: this.tgt * this.gp,
      rec: this.tgt * (this.rec / 100) * this.gp,
      yds: this.tgt * (this.rec / 100) * this.ypr * this.gp,
      tds: this.tgt * (this.rec / 100) * (this.tdp / 100) * this.gp,
    };
  }
}

type AnnualizedRushSeason = {
  att: number;
  yds: number;
  tds: number;
};

export type RushSeasonData = Pick<
  RushSeason,
  'playerId' | 'name' | 'team' | 'gp' | 'att' | 'ypc' | 'tdp'
>;

export class RushSeason implements RushSeasonData {
  playerId: number;
  name: string;
  team: TeamKey;
  gp: number;
  att: number;
  ypc: number;
  tdp: number;

  constructor(props: RushSeasonData) {
    this.playerId = props.playerId;
    this.name = props.name;
    this.team = props.team;
    this.gp = props.gp;
    this.att = props.att;
    this.ypc = props.ypc;
    this.tdp = props.tdp;
  }

  static default(player: Player, team: TeamKey) {
    return new RushSeason({
      playerId: player.id,
      name: player.name,
      team,
      gp: 0,
      att: 20,
      ypc: 3.5,
      tdp: 5,
    });
  }

  static fromPrisma(
    player: Player,
    team: TeamKey,
    rushSeason: PrismaRushSeason
  ) {
    return new RushSeason({
      playerId: player.id,
      name: player.name,
      team,
      gp: rushSeason.gp,
      att: rushSeason.att / rushSeason.gp,
      ypc: rushSeason.yds / rushSeason.att,
      tdp: 100 * (rushSeason.tds / rushSeason.att),
    });
  }

  toStoreData(): RushSeasonData {
    return {
      playerId: this.playerId,
      name: this.name,
      team: this.team,
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

  annualize(): AnnualizedRushSeason {
    return {
      att: this.att * this.gp,
      yds: this.att * this.ypc * this.gp,
      tds: this.att * (this.tdp / 100) * this.gp,
    };
  }
}
