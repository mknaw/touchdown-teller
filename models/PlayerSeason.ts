import { Player } from '@prisma/client';

import { TeamKey } from '@/constants';

export type AnnualizedPassSeason = {
  att: number;
  cmp: number;
  yds: number;
  tds: number;
};

export type PassAggregate = {
  playerId: number;
  name: string;
  team: TeamKey;
  gp: number;
  att: number;
  cmp: number;
  yds: number;
  tds: number;
};

export type PassSeasonData = Pick<
  PassSeason,
  'playerId' | 'name' | 'team' | 'gp' | 'att' | 'cmp' | 'ypa' | 'tdp'
>;

export const passAggregateToSeasonData = (
  player: Player,
  team: TeamKey,
  gp: number,
  aggregate: PassAggregate
): PassSeasonData => {
  const att = aggregate.att || 0;
  return {
    playerId: player.id,
    name: player.name,
    team,
    gp: gp,
    att: att / gp,
    cmp: 100 * ((aggregate.cmp || 0) / att),
    ypa: (aggregate.yds || 0) / att,
    tdp: 100 * ((aggregate.tds || 0) / att),
  };
};

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

  static fromAggregate({
    playerId,
    name,
    team,
    gp,
    att,
    cmp,
    yds,
    tds,
  }: PassAggregate) {
    return new PassSeason({
      playerId,
      name,
      team,
      gp: gp,
      att: att / gp,
      cmp: 100 * (cmp / att),
      ypa: yds / att,
      tdp: 100 * (tds / att),
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
      cmp: (this.cmp / 100) * this.att * this.gp,
      yds: this.ypa * this.att * (this.cmp / 100) * this.gp,
      tds: (this.tdp / 100) * this.att * this.gp,
    };
  }
}

export type RecvAggregate = {
  playerId: number;
  name: string;
  team: TeamKey;
  gp: number;
  tgt: number;
  rec: number;
  yds: number;
  tds: number;
};

export type AnnualizedRecvSeason = {
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

  static fromAggregate({
    playerId,
    name,
    team,
    gp,
    tgt,
    rec,
    yds,
    tds,
  }: RecvAggregate) {
    return new RecvSeason({
      playerId,
      name,
      team,
      gp: gp,
      tgt: tgt / gp,
      rec: 100 * (rec / tgt),
      ypr: yds / rec,
      tdp: 100 * (tds / rec),
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

export type RushAggregate = {
  playerId: number;
  name: string;
  team: TeamKey;
  gp: number;
  att: number;
  yds: number;
  tds: number;
};

export type AnnualizedRushSeason = {
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

  static fromAggregate({
    playerId,
    name,
    team,
    gp,
    att,
    yds,
    tds,
  }: RushAggregate) {
    return new RushSeason({
      playerId,
      name,
      team,
      gp: gp,
      att: att / gp,
      ypc: yds / att,
      tdp: 100 * (tds / att),
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
