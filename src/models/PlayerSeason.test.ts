import { describe, expect, it } from 'vitest';

import {
  AnnualizedPassSeason,
  AnnualizedRecvSeason,
  AnnualizedRushSeason,
  PassSeason,
  RecvSeason,
  RushSeason,
  annualizePassSeason,
  annualizeRecvSeason,
  annualizeRushSeason,
  deannualizePassSeason,
  deannualizeRecvSeason,
  deannualizeRushSeason,
} from '@/models/PlayerSeason';

describe('PassSeason', () => {
  const gp = 16;

  const deannualized: PassSeason = {
    att: 25,
    cmp: 50,
    ypa: 10,
    tdp: 5,
  };

  const annualized: AnnualizedPassSeason = {
    att: 400,
    cmp: 200,
    yds: 4000,
    tds: 20,
  };

  it('should correctly annualize pass season', () => {
    expect(annualizePassSeason(deannualized, gp)).toEqual(annualized);
  });

  it('should correctly deannualize pass season', () => {
    expect(deannualizePassSeason(annualized, gp)).toEqual(deannualized);
  });
});

describe('RecvSeason', () => {
  const gp = 16;

  const deannualized: RecvSeason = {
    tgt: 10,
    rec: 50,
    ypr: 10,
    tdp: 5,
  };

  const annualized: AnnualizedRecvSeason = {
    tgt: 160,
    rec: 80,
    yds: 800,
    tds: 4,
  };

  it('should correctly annualize recv season', () => {
    expect(annualizeRecvSeason(deannualized, gp)).toEqual(annualized);
  });

  it('should correctly deannualize recv season', () => {
    expect(deannualizeRecvSeason(annualized, gp)).toEqual(deannualized);
  });
});

describe('RushSeason', () => {
  const gp = 16;

  const deannualized: RushSeason = {
    att: 20,
    ypc: 3,
    tdp: 5,
  };

  const annualized: AnnualizedRushSeason = {
    att: 320,
    yds: 960,
    tds: 16,
  };

  it('should correctly annualize recv season', () => {
    expect(annualizeRushSeason(deannualized, gp)).toEqual(annualized);
  });

  it('should correctly deannualize recv season', () => {
    expect(deannualizeRushSeason(annualized, gp)).toEqual(deannualized);
  });
});
