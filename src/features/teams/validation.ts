// TODO maybe this should move to the `/models/` directory
import {
  AnyAction,
  Dispatch,
  Middleware,
  MiddlewareAPI,
} from '@reduxjs/toolkit';
import _ from 'lodash';

import { gameCount } from '@/constants';
import {
  AnnualizedPassSeason,
  AnnualizedRecvSeason,
  AnnualizedRushSeason,
  PassSeason,
  PlayerProjections,
  RecvSeason,
  RushSeason,
  annualizePassSeason,
  annualizeRecvSeason,
  annualizeRushSeason,
} from '@/models/PlayerSeason';
import { TeamSeason } from '@/models/TeamSeason';
import { AppState } from '@/store';
import { PlayerSeason } from '@/types';

export type Projection = {
  teamSeason: TeamSeason;
  passSeasons: PassSeason[];
  recvSeasons: RecvSeason[];
  rushSeasons: RushSeason[];
};

type AggregatePlayerProjections = {
  pass?: AnnualizedPassSeason;
  recv?: AnnualizedRecvSeason;
  rush?: AnnualizedRushSeason;
};

const annualizePlayerProjections = (
  projections: PlayerProjections
): AggregatePlayerProjections =>
  _(projections)
    .values()
    .map((p) => ({
      pass: p?.pass ? annualizePassSeason(p.pass, p.base.gp) : {},
      recv: p?.recv ? annualizeRecvSeason(p.recv, p.base.gp) : {},
      rush: p?.rush ? annualizeRushSeason(p.rush, p.base.gp) : {},
    }))
    .thru((arr) =>
      _.mergeWith({}, ...arr, (prev: Object, next: Object) =>
        _.mergeWith(
          prev,
          next,
          (a: number | undefined, b: number | undefined) => (a || 0) + (b || 0)
        )
      )
    )
    .value();

const getNegativeStats = (season: { [key: string]: number }): string[] =>
  _.keys(_.filter(season, (v) => v < 0));

function getBudget(
  playerProjections: AggregatePlayerProjections,
  teamProjection: TeamSeason
): AggregatePlayerProjections {
  return {
    pass: {
      att: teamProjection.passAtt - (playerProjections.pass?.att || 0),
      cmp: teamProjection.passCmp - (playerProjections.pass?.cmp || 0),
      yds: teamProjection.passYds - (playerProjections.pass?.yds || 0),
      tds: teamProjection.passTds - (playerProjections.pass?.tds || 0),
    },
    recv: {
      tgt: teamProjection.passAtt - (playerProjections.recv?.tgt || 0),
      rec: teamProjection.passCmp - (playerProjections.recv?.rec || 0),
      yds: teamProjection.passYds - (playerProjections.recv?.yds || 0),
      tds: teamProjection.passTds - (playerProjections.recv?.tds || 0),
    },
    rush: {
      att: teamProjection.rushAtt - (playerProjections.rush?.att || 0),
      yds: teamProjection.rushYds - (playerProjections.rush?.yds || 0),
      tds: teamProjection.rushTds - (playerProjections.rush?.tds || 0),
    },
  };
}

function getPassBudget(projection: Projection): AnnualizedPassSeason {
  const { teamSeason, passSeasons } = projection;
  const annualized = _.map(passSeasons, annualizePassSeason);
  return {
    att: teamSeason.passAtt - _.sumBy(annualized, 'att'),
    cmp: teamSeason.passCmp - _.sumBy(annualized, 'cmp'),
    yds: teamSeason.passYds - _.sumBy(annualized, 'yds'),
    tds: teamSeason.passTds - _.sumBy(annualized, 'tds'),
  };
}

function getRecvBudget(projection: Projection): AnnualizedRecvSeason {
  const { teamSeason, recvSeasons } = projection;

  const annualized = _.map(recvSeasons, annualizeRecvSeason);
  return {
    tgt: teamSeason.passAtt - _.sumBy(annualized, 'tgt'),
    rec: teamSeason.passCmp - _.sumBy(annualized, 'rec'),
    yds: teamSeason.passYds - _.sumBy(annualized, 'yds'),
    tds: teamSeason.passTds - _.sumBy(annualized, 'tds'),
  };
}

function getRushBudget(projection: Projection): AnnualizedRushSeason {
  const { teamSeason, rushSeasons } = projection;
  const annualized = _.map(rushSeasons, annualizeRushSeason);
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
  if ('ypa' in season) {
    projection.passSeasons.push(season);
    const remaining = getPassBudget(projection);
    if (getNegativeStats(remaining).length) {
      // TODO would be nicer to not go to 0 but instead adjust `gp`...
      // season.gp = 0;
      season.att = 0;
      season.ypa = 0;
      season.tdp = 0;
    }
  } else if ('tgt' in season) {
    projection.recvSeasons.push(season);
    const remaining = getRecvBudget(projection);
    if (getNegativeStats(remaining).length) {
      // season.gp = 0;
      season.tgt = 0;
      season.rec = 0;
      season.ypr = 0;
      season.tdp = 0;
    }
  } else {
    projection.rushSeasons.push(season);
    const remaining = getRushBudget(projection);
    if (getNegativeStats(remaining).length) {
      // season.gp = 0;
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
  if ('ypa' in season) {
    const remaining = getPassBudget(projection);
    if (!_.isEmpty(getNegativeStats(remaining))) {
      valid = false;
    }
    const gpTotal = _.sumBy(projection.passSeasons, 'gp');
    const remainingGp = gameCount - gpTotal;
    if (remainingGp < 0) {
      valid = false;
      // season.gp += remainingGp;
      // season.gp = Math.max(season.gp, 0);
    }
    if (remaining.att < 0) {
      // season.att += remaining.att / season.gp;
      season.att = Math.max(season.att, 0);
    }
    if (remaining.cmp < 0) {
      // season.cmp += (100 * remaining.cmp) / (season.att * season.gp);
      season.cmp = Math.max(season.cmp, 0);
    }
    if (remaining.yds < 0) {
      // season.ypa +=
      //   remaining.yds / (season.att * season.gp * (season.cmp / 100));
      season.ypa = Math.max(season.ypa, 0);
    }
    if (remaining.tds < 0) {
      // season.tdp += (100 * remaining.tds) / (season.att * season.gp);
      season.tdp = Math.max(season.tdp, 0);
    }
  } else if ('tgt' in season) {
    const remaining = getRecvBudget(projection);
    if (!_.isEmpty(getNegativeStats(remaining))) {
      valid = false;
    }
    if (remaining.tgt < 0) {
      // season.tgt += remaining.tgt / season.gp;
      season.tgt = Math.max(season.tgt, 0);
    }
    if (remaining.rec < 0) {
      // season.rec += (100 * remaining.rec) / (season.gp * season.tgt);
      season.rec = Math.max(season.rec, 0);
    }
    if (remaining.yds < 0) {
      // season.ypr +=
      //   remaining.yds / (season.tgt * (season.rec / 100) * season.gp);
      season.ypr = Math.max(season.ypr, 0);
    }
    if (remaining.tds < 0) {
      // season.tdp +=
      //   (100 * remaining.tds) / (season.tgt * (season.rec / 100) * season.gp);
      season.tdp = Math.max(season.tdp, 0);
    }
  } else {
    const remaining = getRushBudget(projection);
    if (!_.isEmpty(getNegativeStats(remaining))) {
      valid = false;
    }
    if (remaining.att < 0) {
      // season.att += remaining.att / season.gp;
      season.att = Math.max(season.att, 0);
    }
    if (remaining.yds < 0) {
      // season.ypc += remaining.yds / (season.att * season.gp);
      season.ypc = Math.max(season.ypc, 0);
    }
    if (remaining.tds < 0) {
      // season.tdp += (100 * remaining.tds) / (season.att * season.gp);
      season.tdp = Math.max(season.tdp, 0);
    }
  }
  return [season, valid];
}

export function clampTeamSeason(projection: Projection): [TeamSeason, boolean] {
  const remainingPass = getPassBudget(projection);
  const remainingRecv = getRecvBudget(projection);
  const remainingRush = getRushBudget(projection);

  const { teamSeason } = projection;

  if (
    _.isEmpty(getNegativeStats(remainingPass)) &&
    _.isEmpty(getNegativeStats(remainingRecv)) &&
    _.isEmpty(getNegativeStats(remainingRush))
  ) {
    return [teamSeason, true];
  }

  teamSeason.passAtt -= Math.min(remainingPass.att, remainingRecv.tgt, 0);
  teamSeason.passCmp -= Math.min(remainingPass.cmp, remainingRecv.rec, 0);
  teamSeason.passYds -= Math.min(remainingPass.yds, remainingRecv.yds, 0);
  teamSeason.passTds -= Math.min(remainingPass.tds, remainingRecv.tds, 0);
  teamSeason.rushAtt -= Math.min(remainingRush.att, 0);
  teamSeason.rushYds -= Math.min(remainingRush.yds, 0);
  teamSeason.rushTds -= Math.min(remainingRush.tds, 0);

  // TODO probably could have some more descriptive messaging.
  return [teamSeason, false];
}

export const validationMiddleware: Middleware =
  (store: MiddlewareAPI) => (next: Dispatch) => (action: AnyAction) => {
    const state = store.getState() as AppState;

    if (
      state.playerProjections.status != 'succeeded' ||
      state.teamProjection.status != 'succeeded'
    ) {
      return next(action);
    }

    const { projections: playerProjections } = state.playerProjections;
    const annualizedProjections = annualizePlayerProjections(playerProjections);
    const { projection: teamProjection } = state.teamProjection;
    console.log(annualizedProjections);

    // // List of actions that should trigger validation
    // const actionsToValidate = [
    //   'UPDATE_PLAYER_STATS',
    //   'UPDATE_TEAM_STATS',
    //   'PERSIST_SLIDER_VALUE',
    // ];
    //
    // if (actionsToValidate.includes(action.type)) {
    //   // Run the action first
    //   const result = next(action);
    //
    //   // Then validate the new state
    //   const newState = store.getState();
    //   const validationResult = validateGlobalState(newState);
    //
    //   if (!validationResult.isValid) {
    //     // Dispatch an invalidation action
    //     store.dispatch({
    //       type: 'INVALIDATE_CHANGE',
    //       payload: {
    //         originalAction: action,
    //         error: validationResult.error,
    //       },
    //     });
    //   }
    //
    //   return result;
    // }

    return next(action);
  };
