import _ from 'lodash';

import { gameCount } from '@/constants';
import {
  AnnualizedPassSeason,
  AnnualizedRecvSeason,
  AnnualizedRushSeason,
  PassSeason,
  RecvSeason,
  RushSeason,
} from '@/models/PlayerSeason';
import TeamSeason from '@/models/TeamSeason';
import { Projection } from '@/pages/teams/[teamKey]';
import { PlayerSeason } from '@/types';

const getNegativeStats = (season: { [key: string]: number }): string[] =>
  _.keys(_.filter(season, (v) => v < 0));

function getPassBudget(projection: Projection): AnnualizedPassSeason {
  const { teamSeason, passSeasons } = projection;
  const annualized = _.map(passSeasons, (s) => s.annualize());
  return {
    att: teamSeason.passAtt - _.sumBy(annualized, 'att'),
    cmp: teamSeason.passCmp - _.sumBy(annualized, 'cmp'),
    yds: teamSeason.passYds - _.sumBy(annualized, 'yds'),
    tds: teamSeason.passTds - _.sumBy(annualized, 'tds'),
  };
}

function getRecvBudget(projection: Projection): AnnualizedRecvSeason {
  const { teamSeason, passSeasons } = projection;
  const annualized = _.map(passSeasons, (s) => s.annualize());
  return {
    tgt: teamSeason.passAtt - _.sumBy(annualized, 'tgt'),
    rec: teamSeason.passCmp - _.sumBy(annualized, 'rec'),
    yds: teamSeason.passYds - _.sumBy(annualized, 'yds'),
    tds: teamSeason.passTds - _.sumBy(annualized, 'tds'),
  };
}

function getRushBudget(projection: Projection): AnnualizedRushSeason {
  const { teamSeason, rushSeasons } = projection;
  const annualized = _.map(rushSeasons, (s) => s.annualize());
  return {
    att: teamSeason.rushAtt - _.sumBy(annualized, 'att'),
    yds: teamSeason.rushYds - _.sumBy(annualized, 'yds'),
    tds: teamSeason.rushTds - _.sumBy(annualized, 'tds'),
  };
}

export function ensureValid<T extends PlayerSeason>(
  season: T,
  projection: Projection
): T {
  if (season instanceof PassSeason) {
    projection.passSeasons.push(season);
    const remaining = getPassBudget(projection);
    if (getNegativeStats(remaining).length) {
      // TODO would be nicer to not go to 0 but instead adjust `gp`...
      season.gp = 0;
      season.att = 0;
      season.ypa = 0;
      season.tdp = 0;
    }
  } else if (season instanceof RecvSeason) {
    projection.recvSeasons.push(season);
    const remaining = getRecvBudget(projection);
    if (getNegativeStats(remaining).length) {
      season.gp = 0;
      season.tgt = 0;
      season.rec = 0;
      season.ypr = 0;
      season.tdp = 0;
    }
  } else {
    projection.rushSeasons.push(season);
    const remaining = getRushBudget(projection);
    if (getNegativeStats(remaining).length) {
      season.gp = 0;
      season.att = 0;
      season.ypc = 0;
      season.tdp = 0;
    }
  }
  return season;
}

// TODO seems like the kind of thing that warrants unit testing.
export function clampPlayerSeason<T extends PlayerSeason>(
  season: T,
  projection: Projection
): [T, boolean] {
  let valid = true;
  if (season instanceof PassSeason) {
    const remaining = getPassBudget(projection);
    if (!_.isEmpty(getNegativeStats(remaining))) {
      valid = false;
    }
    const gpTotal = _.sumBy(projection.passSeasons, 'gp');
    const remainingGp = gameCount - gpTotal;
    if (remainingGp < 0) {
      valid = false;
      season.gp += remainingGp;
      season.gp = Math.max(season.gp, 0);
    }
    if (remaining.att < 0) {
      season.att += remaining.att / season.gp;
      season.att = Math.max(season.att, 0);
    }
    if (remaining.cmp < 0) {
      season.cmp += (100 * remaining.cmp) / (season.att * season.gp);
      season.cmp = Math.max(season.cmp, 0);
    }
    if (remaining.yds < 0) {
      season.ypa +=
        remaining.yds / (season.att * season.gp * (season.cmp / 100));
      season.ypa = Math.max(season.ypa, 0);
    }
    if (remaining.tds < 0) {
      season.tdp += (100 * remaining.tds) / (season.att * season.gp);
      season.tdp = Math.max(season.tdp, 0);
    }
  } else if (season instanceof RecvSeason) {
    const remaining = getRecvBudget(projection);
    if (!_.isEmpty(getNegativeStats(remaining))) {
      valid = false;
    }
    if (remaining.tgt < 0) {
      season.tgt += remaining.tgt / season.gp;
      season.tgt = Math.max(season.tgt, 0);
    }
    if (remaining.rec < 0) {
      season.rec += (100 * remaining.rec) / (season.gp * season.tgt);
      season.rec = Math.max(season.rec, 0);
    }
    if (remaining.yds < 0) {
      season.ypr +=
        remaining.yds / (season.tgt * (season.rec / 100) * season.gp);
      season.ypr = Math.max(season.ypr, 0);
    }
    if (remaining.tds < 0) {
      season.tdp +=
        (100 * remaining.tds) / (season.tgt * (season.rec / 100) * season.gp);
      season.tdp = Math.max(season.tdp, 0);
    }
  } else if (season instanceof RushSeason) {
    const remaining = getRushBudget(projection);
    if (!_.isEmpty(getNegativeStats(remaining))) {
      valid = false;
    }
    if (remaining.att < 0) {
      season.att += remaining.att / season.gp;
      season.att = Math.max(season.att, 0);
    }
    if (remaining.yds < 0) {
      season.ypc += remaining.yds / (season.att * season.gp);
      season.ypc = Math.max(season.ypc, 0);
    }
    if (remaining.tds < 0) {
      season.tdp += (100 * remaining.tds) / (season.att * season.gp);
      season.tdp = Math.max(season.tdp, 0);
    }
  }
  return [season, valid];
}

export function clampTeamSeason(projection: Projection): [TeamSeason, boolean] {
  const remainingPass = getPassBudget(projection);
  // TODO is it appropriate to ignore `getRecvBudget`?
  const remainingRush = getRushBudget(projection);

  const { teamSeason } = projection;

  if (
    _.isEmpty(getNegativeStats(remainingPass)) &&
    _.isEmpty(getNegativeStats(remainingRush))
  ) {
    return [teamSeason, true];
  }

  teamSeason.passAtt -= Math.min(remainingPass.att, 0);
  teamSeason.passCmp -= Math.min(remainingPass.cmp, 0);
  teamSeason.passYds -= Math.min(remainingPass.yds, 0);
  teamSeason.passTds -= Math.min(remainingPass.tds, 0);
  teamSeason.rushAtt -= Math.min(remainingRush.att, 0);
  teamSeason.rushYds -= Math.min(remainingRush.yds, 0);
  teamSeason.rushTds -= Math.min(remainingRush.tds, 0);

  // TODO probably could have some more descriptive messaging.
  return [teamSeason, false];
}
