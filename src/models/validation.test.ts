import { describe, expect, it } from 'vitest';

import { TeamKey } from '@/constants';
import {
  AggregatePlayerProjections,
  PlayerProjections,
} from '@/models/PlayerSeason';
import { TeamSeason } from '@/models/TeamSeason';
import {
  InequalityCtx,
  annualizePlayerProjections,
  getBudget,
  passInequalities,
  solveInequalities,
  solveInequality,
} from '@/models/validation';

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
      gp: 16,
      cmp: 50,
      ypa: 10,
      tdp: 5,
      attTot: 500,
      cmpTot: 300,
      ydsTot: 4000,
      tdsTot: 30,
    };

    const result = solveInequalities(passInequalities, context);

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
    base: { team: TeamKey.ATL, gp: 16 },
    pass: { att: 10, cmp: 50, ypa: 10, tdp: 5 },
    recv: { tgt: 10, rec: 50, ypr: 10, tdp: 5 },
    rush: { att: 15, ypc: 3, tdp: 5 },
  },
};

const annualizedProjection: AggregatePlayerProjections = {
  pass: { att: 160, cmp: 80, yds: 1600, tds: 8 },
  recv: { tgt: 160, rec: 80, yds: 800, tds: 4 },
  rush: { att: 240, yds: 720, tds: 12 },
};

const teamProjection: TeamSeason = {
  teamName: TeamKey.ATL,
  passAtt: 360,
  passCmp: 100,
  passYds: 2000,
  passTds: 10,
  rushAtt: 200,
  rushYds: 1500,
  rushTds: 15,
};

const budget = {
  pass: { att: 200, cmp: 20, yds: 400, tds: 2 },
  recv: { tgt: 200, rec: 20, yds: 1200, tds: 6 },
  rush: { att: -40, yds: 780, tds: 3 },
};

describe('annualizePlayerProjections', () => {
  it('should correctly annualize player projections', () => {
    const result = annualizePlayerProjections(playerProjections);
    expect(result).toEqual(annualizedProjection);
  });
});

describe('getBudget', () => {
  it('should correctly calculate the budget', () => {
    const result = getBudget(annualizedProjection, teamProjection);
    expect(result).toEqual(budget);
  });
});

// describe('clampPlayerProjection', () => {
//   it('should correctly clamp player projection', () => {
//     const projection: PlayerProjection = {
//       id: 1,
//       ...playerProjections[1],
//     };
//
//     const result = clampPlayerProjection(budget, projection);
//
//     expect(result).toEqual({
//       id: 1,
//       base: { team: TeamKey.ATL, gp: 16 },
//       pass: { att: 10, cmp: 50, ypa: 10, tdp: 5 },
//       recv: { tgt: 10, rec: 50, ypr: 10, tdp: 5 },
//       rush: { att: 15, ypc: 3, tdp: 5 },
//     });
//   });
// });

// describe('asTeamProjectionDelta', () => {
//   it('should correctly calculate team projection delta', () => {
//     const budget = {
//       pass: { att: -50, cmp: -30, yds: -500, tds: -3 },
//       recv: { tgt: -40, rec: -25, yds: -400, tds: -2 },
//       rush: { att: -10, yds: -50, tds: -1 },
//     };
//
//     const result = asTeamProjectionDelta(budget);
//
//     expect(result).toEqual({
//       passAtt: -40,
//       passCmp: -25,
//       passYds: -400,
//       passTds: -2,
//       rushAtt: -10,
//       rushYds: -50,
//       rushTds: -1,
//     });
//   });
// });
//
// describe('getPlayerValidationErrors', () => {
//   it('should return an empty array when clamped and original are equal', () => {
//     const clamped: PlayerProjection = {
//       id: 'player1',
//       base: { gp: 16 },
//       pass: { att: 500, cmp: 300, ypa: 8, tdp: 6 },
//     };
//     const original: PlayerProjection = {
//       id: 'player1',
//       base: { gp: 16 },
//       pass: { att: 500, cmp: 300, ypa: 8, tdp: 6 },
//     };
//
//     const result = getPlayerValidationErrors(clamped, original);
//
//     expect(result).toEqual([]);
//   });
//
//   it('should return an array with an error message when clamped and original are different', () => {
//     const clamped: PlayerProjection = {
//       id: 'player1',
//       base: { gp: 16 },
//       pass: { att: 400, cmp: 250, ypa: 8, tdp: 6 },
//     };
//     const original: PlayerProjection = {
//       id: 'player1',
//       base: { gp: 16 },
//       pass: { att: 500, cmp: 300, ypa: 8, tdp: 6 },
//     };
//
//     const result = getPlayerValidationErrors(clamped, original);
//
//     expect(result).toEqual([
//       'Player projection limited in accordance with team total.',
//     ]);
//   });
// });
//
// // describe('getTeamValidationErrors', () => {
// //   it('should return an empty array when clamped and original are equal', () => {
// //     const clamped: TeamSeason = {
// //       passAtt: 600,
// //       passCmp: 400,
// //       passYds: 5000,
// //       passTds: 40,
// //       rushAtt: 300,
// //       rushYds: 1500,
// //       rushTds: 15,
// //     };
// //     const original: TeamSeason = {
// //       passAtt: 600,
// //       passCmp: 400,
// //       passYds: 5000,
// //       passTds: 40,
// //       rushAtt: 300,
// //       rushYds: 1500,
// //       rushTds: 15,
// //     };
// //
// //     const result = getTeamValidationErrors(clamped, original);
// //
// //     expect(result).toEqual([]);
// //   });
// //
// //   it('should return an array with an error message when clamped and original are different', () => {
// //     const clamped: TeamSeason = {
// //       passAtt: 550,
// //       passCmp: 370,
// //       passYds: 4800,
// //       passTds: 38,
// //       rushAtt: 280,
// //       rushYds: 1400,
// //       rushTds: 14,
// //     };
// //     const original: TeamS
