// TODO maybe this should move to the `/models/` directory
import {
  AnyAction,
  Dispatch,
  Middleware,
  MiddlewareAPI,
  PayloadAction,
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
import { setTeamProjection } from '@/store/teamProjectionSlice';
import { PlayerSeason } from '@/types';
import {
  addObjects,
  nestedNumericAssociation,
  nestedNumericMap,
  subtractObjects,
} from '@/utils';

export type Projection = {
  teamSeason: TeamSeason;
  passSeasons: PassSeason[];
  recvSeasons: RecvSeason[];
  rushSeasons: RushSeason[];
};

type AggregatePlayerProjections = {
  pass: AnnualizedPassSeason;
  recv: AnnualizedRecvSeason;
  rush: AnnualizedRushSeason;
};

const emptyPassSeason = {
  att: 0,
  cmp: 0,
  yds: 0,
  tds: 0,
};

const emptyRecvSeason = {
  tgt: 0,
  rec: 0,
  yds: 0,
  tds: 0,
};

const emptyRushSeason = {
  att: 0,
  ypc: 0,
  tds: 0,
};

const annualizePlayerProjections = (
  projections: PlayerProjections
): AggregatePlayerProjections =>
  _(projections)
    .values()
    .map((p) => ({
      pass: p?.pass ? annualizePassSeason(p.pass, p.base.gp) : emptyPassSeason,
      recv: p?.recv ? annualizeRecvSeason(p.recv, p.base.gp) : emptyRecvSeason,
      rush: p?.rush ? annualizeRushSeason(p.rush, p.base.gp) : emptyRushSeason,
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

// Returns an array of keys where the value is negative.
const getNegativeStats = (aggregate: { [key: string]: number }): string[] =>
  _(aggregate)
    .pickBy((v) => v < 0)
    .keys()
    .value();

function getBudget(
  playerProjections: AggregatePlayerProjections,
  teamProjection: TeamSeason
): AggregatePlayerProjections {
  return {
    // TODO could coerce TeamProjection into a nested thing so it looks like playerProjections.
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

const clampNestedNumeric = _.partial(nestedNumericMap, (v) => Math.min(v, 0));

const asTeamSeasonDelta = (
  budget: AggregatePlayerProjections
): Pick<
  TeamSeason,
  | 'passAtt'
  | 'passCmp'
  | 'passYds'
  | 'passTds'
  | 'rushAtt'
  | 'rushYds'
  | 'rushTds'
> => {
  const pass = clampNestedNumeric(budget.pass) as AnnualizedPassSeason;
  const recv = clampNestedNumeric(budget.recv) as AnnualizedRecvSeason;
  const rush = clampNestedNumeric(budget.rush) as AnnualizedRushSeason;
  return {
    passAtt: Math.min(pass.att, recv.tgt),
    passCmp: Math.min(pass.cmp, recv.rec),
    passYds: Math.min(pass.yds, recv.yds),
    passTds: Math.min(pass.tds, recv.yds),
    rushAtt: rush.att,
    rushYds: rush.yds,
    rushTds: rush.tds,
  };
};

export const validationMiddleware: Middleware =
  (store: MiddlewareAPI) => (next: Dispatch) => (action: AnyAction) => {
    if (!action.type.includes('persist/fulfilled')) {
      // Only interested in actions that we think will finalize the state.
      return next(action);
    }

    const state = store.getState() as AppState;

    // TODO check for error statuses?

    const { projections: playerProjections } = state.playerProjections;
    const annualizedProjections = annualizePlayerProjections(playerProjections);
    const { projection: teamProjection } = state.teamProjection;
    if (!teamProjection) {
      return next(action);
    }

    const budget = getBudget(annualizedProjections, teamProjection);

    switch (action.type) {
      case 'playerProjections/persist/fulfilled':
        console.log('its a player projection');
        break;
      case 'teamProjection/persist/fulfilled':
        const delta = asTeamSeasonDelta(budget);

        const clamped = {
          ...teamProjection,
          ...(subtractObjects(teamProjection, delta) as TeamSeason),
        };

        // TODO This is inefficient because we do the whole subtraction and equality
        // thing here a second time, even though we already did it the first time around.
        // It is just a quick hack, can fix it later.
        if (!_.isEqual(clamped, teamProjection)) {
          store.dispatch(setTeamProjection(clamped));

          const prevAction = action as PayloadAction<TeamSeason>;
          const newAction: PayloadAction<TeamSeason> = {
            ...prevAction,
            payload: clamped,
          };
          store.dispatch(newAction);
          return newAction;
        }
    }

    return next(action);
  };
