import { PlayerProjection } from './PlayerSeason';
import { ScoringSettings, scoreProjection } from './ScoringSettings';

import { describe, expect, it } from 'vitest';

import { TeamKey } from '@/constants';

describe('scoreProjection', () => {
  const defaultSettings: ScoringSettings = {
    passYdsPer: 25,
    passTd: 4,
    rec: 0.5,
    recvYdsPer: 10,
    recvTd: 6,
    rushYdsPer: 10,
    rushTd: 6,
  };

  it('calculates score for a quarterback', () => {
    const qbProjection: PlayerProjection = {
      id: 1,
      base: { team: TeamKey.ATL, gp: 10 },
      pass: { att: 20, cmp: 50, ypa: 10, tdp: 5 },
    };

    const score = scoreProjection(qbProjection, defaultSettings);
    expect(score).toBeCloseTo(120, 2);
  });

  // TODO
  // it('calculates score for a wide receiver', () => {
  //   const wrProjection: PlayerProjection = {
  //     id: 2,
  //     base: { team: TeamKey.ATL, gp: 16 },
  //     recv: { tgt: 8, rec: 5, ypr: 14, tdp: 5 },
  //   };
  //
  //   const score = scoreProjection(wrProjection, defaultSettings);
  //   expect(score).toBeCloseTo(120, 2);
  // });
  //
  // it('calculates score for a running back', () => {
  //   const rbProjection: PlayerProjection = {
  //     id: 3,
  //     base: { team: TeamKey.ATL, gp: 16 },
  //     rush: { att: 20, ypc: 4.5, tdp: 3 },
  //     recv: { tgt: 4, rec: 3, ypr: 8, tdp: 5 },
  //   };
  //
  //   const score = scoreProjection(rbProjection, defaultSettings);
  //   expect(score).toBeCloseTo(223.84, 2);
  // });
  //
  // it('handles player with no projections', () => {
  //   const emptyProjection: PlayerProjection = {
  //     id: 4,
  //     base: { team: TeamKey.ATL, gp: 16 },
  //   };
  //
  //   const score = scoreProjection(emptyProjection, defaultSettings);
  //   expect(score).toBe(0);
  // });
  //
  // it('calculates score with different scoring settings', () => {
  //   const customSettings: ScoringSettings = {
  //     passYdsPer: 20,
  //     passTd: 6,
  //     rec: 1,
  //     recvYdsPer: 8,
  //     recvTd: 8,
  //     rushYdsPer: 8,
  //     rushTd: 8,
  //   };
  //
  //   const playerProjection: PlayerProjection = {
  //     id: 5,
  //     base: { team: TeamKey.ATL, gp: 16 },
  //     pass: { att: 30, cmp: 20, ypa: 8, tdp: 6 },
  //     rush: { att: 5, ypc: 4, tdp: 2 },
  //     recv: { tgt: 2, rec: 1, ypr: 10, tdp: 5 },
  //   };
  //
  //   const score = scoreProjection(playerProjection, customSettings);
  //   expect(score).toBeCloseTo(424.8, 2);
  // });
});
