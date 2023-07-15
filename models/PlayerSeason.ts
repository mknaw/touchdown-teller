// TODO do the `fromPrisma` thing for sensible defaults for players with history
import { TeamKey } from '@/types';

export type PassSeasonData = Pick<
  PassSeason,
  'id' | 'team' | 'gp' | 'att' | 'cmp' | 'ypa' | 'tdp'
>;

export class PassSeason implements PassSeasonData {
  id: number;
  team: TeamKey;
  gp: number;
  att: number;
  cmp: number;
  ypa: number;
  tdp: number;

  constructor(props: PassSeasonData) {
    this.id = props.id;
    this.team = props.team;
    this.gp = props.gp;
    this.att = props.att;
    this.cmp = props.cmp;
    this.ypa = props.ypa;
    this.tdp = props.tdp;
  }

  static default(id: number, team: TeamKey) {
    return new PassSeason({
      id,
      team,
      gp: 17,
      att: 30,
      cmp: 75,
      ypa: 7.5,
      tdp: 5,
    });
  }

  toStoreData(): PassSeasonData {
    return {
      id: this.id,
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
      return 'Touchdown Percentage';
    }
  }

  isPercentField(stat: string): boolean {
    return ['cmp', 'tdp'].includes(stat);
  }
}

export type RushSeasonData = Pick<
  RushSeason,
  'id' | 'team' | 'gp' | 'att' | 'ypc' | 'tdp'
>;

export class RushSeason implements RushSeasonData {
  id: number;
  team: TeamKey;
  gp: number;
  att: number;
  ypc: number;
  tdp: number;

  constructor(props: RushSeasonData) {
    this.id = props.id;
    this.team = props.team;
    this.gp = props.gp;
    this.att = props.att;
    this.ypc = props.ypc;
    this.tdp = props.tdp;
  }

  static default(id: number, team: TeamKey) {
    return new RushSeason({
      id,
      team,
      gp: 15,
      att: 20,
      ypc: 3.5,
      tdp: 5,
    });
  }

  toStoreData(): RushSeasonData {
    return {
      id: this.id,
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
}

// TODO the `Pick` might be marginally cleaner
export type RecvSeasonData = Pick<
  RecvSeason,
  'id' | 'team' | 'gp' | 'tgt' | 'rec' | 'ypr' | 'tdp'
>;

export class RecvSeason implements RecvSeasonData {
  id: number;
  team: TeamKey;
  gp: number;
  tgt: number;
  rec: number;
  ypr: number;
  tdp: number;

  constructor(props: RecvSeasonData) {
    this.id = props.id;
    this.team = props.team;
    this.gp = props.gp;
    this.tgt = props.tgt;
    this.rec = props.rec;
    this.ypr = props.ypr;
    this.tdp = props.tdp;
  }

  static default(id: number, team: TeamKey) {
    return new RecvSeason({
      id,
      team,
      gp: 15,
      tgt: 6,
      rec: 65,
      ypr: 9,
      tdp: 5,
    });
  }

  toStoreData(): RecvSeasonData {
    return {
      id: this.id,
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
}
