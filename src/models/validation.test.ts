import _ from 'lodash';

import { describe, expect, it } from 'vitest';

import { TeamKey } from '@/constants';
import {
  AggregatePlayerProjections,
  PlayerProjection,
  PlayerProjections,
} from '@/models/PlayerSeason';
import { TeamSeason } from '@/models/TeamSeason';
import {
  InequalityCtx,
  aggregatePlayerProjections,
  asTeamProjectionDelta,
  clampPlayerProjectionUpdate,
  getBudget,
  passInequalities,
  solveInequalities,
  solveInequality,
} from '@/models/validation';
import { PlayerProjectionUpdate } from '@/store/playerProjectionSlice';

describe('solveEquation', () => {
  it('should solve for a single unknown', () => {
    const result = solveInequality({ lhs: ['x', 2], rhs: 10 }, {});
    expect(result).toBe(5);
  });

  it('should handle multiple known terms', () => {
    const result = solveInequality(
      { lhs: ['x', 'y', 'z'], rhs: 120 },
      { y: 2, z: 3 }
    );
    expect(result).toBe(20);
  });

  it('should handle numeric terms', () => {
    const result = solveInequality(
      { lhs: ['x', 2, 'y', 3], rhs: 60 },
      { y: 5 }
    );
    expect(result).toBe(2);
  });

  it('should throw an error if there is more than one unknown', () => {
    expect(() => solveInequality({ lhs: ['x', 'y'], rhs: 10 }, {})).toThrow(
      'More than one unknown variable in equation'
    );
  });

  it('should throw an error if there is no unknown', () => {
    expect(() => solveInequality({ lhs: [2, 3], rhs: 6 }, {})).toThrow(
      'No unknown variable in equation'
    );
  });
});

describe('solveInequalities', () => {
  it('should correctly solve for att given specific parameters', () => {
    const context: InequalityCtx = {
      base: {
        gp: 16,
      },
      pass: {
        cmp: 50,
        ypa: 10,
        tdp: 5,
      },
      passAtt: 500,
      passCmp: 300,
      passYds: 4000,
      passTds: 30,
    };

    const result = solveInequalities(passInequalities, context, 'pass.att');

    // Let's break down the expected results for each inequality:
    // 1. att * 16 <= 500         ==> att <= 31.25
    // 2. att * 16 * 0.5 <= 300   ==> att <= 37.5
    // 3. att * 16 * 10 <= 4000   ==> att <= 25
    // 4. att * 16 * 0.05 <= 30   ==> att <= 37.5

    // The minimum of all these is 25, which should be our result
    expect(result).toBeCloseTo(25, 2);
  });
});

const playerProjections: PlayerProjections = {
  1: {
    base: { team: TeamKey.ATL, gp: 10 },
    pass: { att: 10, cmp: 50, ypa: 10, tdp: 5 },
    recv: { tgt: 10, rec: 50, ypr: 10, tdp: 10 },
    rush: { att: 15, ypc: 3, tdp: 10 },
  },
};

const playerProjection = playerProjections[1];

const annualizedProjection: AggregatePlayerProjections = {
  pass: { att: 100, cmp: 50, yds: 1000, tds: 5, gp: 10 },
  recv: { tgt: 100, rec: 50, yds: 500, tds: 5 },
  rush: { att: 150, yds: 450, tds: 15 },
};

const teamProjection: TeamSeason = {
  teamName: TeamKey.ATL,
  passAtt: 360,
  passCmp: 300,
  passYds: 4000,
  passTds: 50,
  rushAtt: 100,
  rushYds: 1500,
  rushTds: 15,
};

describe('annualizePlayerProjections', () => {
  it('should correctly annualize player projections', () => {
    const result = aggregatePlayerProjections(playerProjections);
    expect(result).toEqual(annualizedProjection);
  });
});

describe('getBudget', () => {
  it('should correctly calculate the budget', () => {
    const result = getBudget(annualizedProjection, teamProjection);
    expect(result).toEqual({
      pass: { att: 260, cmp: 250, yds: 3000, tds: 45, gp: 7 },
      recv: { tgt: 260, rec: 250, yds: 3500, tds: 45 },
      rush: { att: -50, yds: 1050, tds: 0 },
    });
  });
});

describe('clampPlayerProjectionUpdate', () => {
  const budget = getBudget(
    {
      pass: { att: 0, cmp: 0, yds: 0, tds: 0, gp: 0 },
      recv: { tgt: 0, rec: 0, yds: 0, tds: 0 },
      rush: { att: 0, yds: 0, tds: 0 },
    },
    teamProjection
  );

  it('should clamp passing games played to not exceed gameCount', () => {
    const update: PlayerProjectionUpdate = {
      id: 1,
      statType: 'base',
      stat: 'gp',
      value: 12,
    };
    const result = clampPlayerProjectionUpdate(
      {
        pass: { att: 1000, cmp: 250, yds: 3000, tds: 45, gp: 10 },
        recv: { tgt: 1000, rec: 250, yds: 3500, tds: 45 },
        rush: { att: 0, yds: 0, tds: 0 },
      },
      {
        base: { team: TeamKey.ATL, gp: 10 },
        pass: { att: 10, cmp: 50, ypa: 10, tdp: 5 },
      },
      update
    );
    expect(result.value).toBe(10);
  });

  it('should clamp pass attempts per game within budget', () => {
    const update: PlayerProjectionUpdate = {
      id: 1,
      statType: 'pass',
      stat: 'att',
      value: 45,
    };
    const result = clampPlayerProjectionUpdate(
      budget,
      _.pick(playerProjection, ['base', 'pass']),
      update
    );
    expect(result.value).toBe(36);
  });

  it('should not clamp pass attempts when within budget', () => {
    const update: PlayerProjectionUpdate = {
      id: 1,
      statType: 'pass',
      stat: 'att',
      value: 15,
    };
    const result = clampPlayerProjectionUpdate(
      budget,
      _.pick(playerProjection, ['base', 'pass']),
      update
    );
    expect(result.value).toBe(15);
  });

  it('should clamp receiving targets per game within budget', () => {
    const update: PlayerProjectionUpdate = {
      id: 1,
      statType: 'recv',
      stat: 'tgt',
      value: 70,
    };
    const result = clampPlayerProjectionUpdate(
      {
        pass: { att: 1000, cmp: 250, yds: 3000, tds: 45, gp: 7 },
        recv: { tgt: 1000, rec: 250, yds: 3500, tds: 45 },
        rush: { att: 0, yds: 0, tds: 0 },
      },
      {
        base: { team: TeamKey.ATL, gp: 10 },
        recv: { tgt: 10, rec: 50, ypr: 1, tdp: 0 },
      },
      update
    );
    // 250 completions = 10 gp * 50% catch rate * 50 targets per game... hall of fame numbers for unit tests
    expect(result.value).toBe(50);
  });

  it('should limit in accordance with statted recv, not just pass', () => {
    const update: PlayerProjectionUpdate = {
      id: 1,
      statType: 'recv',
      stat: 'tgt',
      value: 30,
    };
    const result = clampPlayerProjectionUpdate(
      {
        pass: { att: 1000, cmp: 0, yds: 0, tds: 0, gp: 0 },
        recv: { tgt: 200, rec: 1000, yds: 1000, tds: 10 },
        rush: { att: 0, yds: 0, tds: 0 },
      },
      {
        base: { team: TeamKey.ATL, gp: 10 },
        recv: { tgt: 10, rec: 50, ypr: 1, tdp: 0 },
      },
      update
    );
    // 250 completions = 10 gp * 50% catch rate * 50 targets per game... hall of fame numbers for unit tests
    expect(result.value).toBe(20);
  });

  it('should clamp rushing attempts per game within budget', () => {
    const update: PlayerProjectionUpdate = {
      id: 1,
      statType: 'rush',
      stat: 'att',
      value: 50,
    };
    const result = clampPlayerProjectionUpdate(
      {
        pass: { att: 0, cmp: 0, yds: 0, tds: 0, gp: 0 },
        recv: { tgt: 0, rec: 0, yds: 0, tds: 0 },
        rush: { att: 200, yds: 1000, tds: 10 },
      },
      {
        base: { team: TeamKey.ATL, gp: 10 },
        rush: { att: 15, ypc: 1, tdp: 1 },
      },
      update
    );
    expect(result.value).toBe(20);
  });
});

describe('asTeamProjectionDelta', () => {
  it('should correctly calculate team projection delta', () => {
    const budget: AggregatePlayerProjections = {
      pass: { att: -50, cmp: -30, yds: -500, tds: -3, gp: 0 },
      recv: { tgt: -40, rec: -25, yds: -400, tds: -2 },
      rush: { att: 10, yds: -50, tds: 1 },
    };

    const result = asTeamProjectionDelta(budget);

    expect(result).toEqual({
      passAtt: -50,
      passCmp: -30,
      passYds: -500,
      passTds: -3,
      rushAtt: 0,
      rushYds: -50,
      rushTds: 0,
    });
  });
});
