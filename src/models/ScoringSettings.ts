import { PlayerProjection, annualizePlayerProjection } from './PlayerSeason';

export type ScoringSettings = {
  passYdsPer: number;
  passTd: number;
  rec: number;
  recvYdsPer: number;
  recvTd: number;
  rushYdsPer: number;
  rushTd: number;
};

export const mkDefaultScoringSettings = (): ScoringSettings => ({
  passYdsPer: 25,
  passTd: 4,
  rec: 1,
  recvYdsPer: 10,
  recvTd: 6,
  rushYdsPer: 10,
  rushTd: 6,
});

export function scoreProjection(
  projection: PlayerProjection,
  settings: ScoringSettings
): number {
  const annualized = annualizePlayerProjection(projection);

  let totalScore = 0;

  if (annualized.pass) {
    totalScore += annualized.pass.yds / settings.passYdsPer;
    totalScore += annualized.pass.tds * settings.passTd;
  }

  if (annualized.recv) {
    totalScore += annualized.recv.rec * settings.rec;
    totalScore += annualized.recv.yds / settings.recvYdsPer;
    totalScore += annualized.recv.tds * settings.recvTd;
  }

  if (annualized.rush) {
    totalScore += annualized.rush.yds / settings.rushYdsPer;
    totalScore += annualized.rush.tds * settings.rushTd;
  }

  return Number(totalScore.toFixed(2)); // Round to 2 decimal places
}
