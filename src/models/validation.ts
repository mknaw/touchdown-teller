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
  AggregatePlayerProjections,
  AnnualizedPassSeason,
  AnnualizedRecvSeason,
  AnnualizedRushSeason,
  PlayerProjection,
  PlayerProjections,
  annualizePlayerProjection,
} from '@/models/PlayerSeason';
import { TeamSeason } from '@/models/TeamSeason';
import { AppState } from '@/store';
import { setValidationErrors } from '@/store/appStateSlice';
import {
  PlayerProjectionUpdate,
  pluralizeUpdate,
  setPlayerProjections,
} from '@/store/playerProjectionSlice';
import { setTeamProjection } from '@/store/teamProjectionSlice';
import { nestedNumericMap, subtractObjects } from '@/utils';

export type Inequality = {
  lhs: (string | number)[];
  rhs: string | number;
};

export type InequalityCtx = { [key: string]: any };

export function solveInequality(
  { lhs, rhs }: Inequality,
  context: InequalityCtx
): number {
  let unknown: string | null = null;
  let product = 1;

  let val = _.isNumber(rhs) ? rhs : context[rhs];
  if (val === undefined) {
    throw new Error("Can't resolve rhs");
  }

  for (const term of lhs) {
    if (typeof term === 'number') {
      product *= term;
      continue;
    }
    const k = _.get(context, term);
    if (_.isNumber(k)) {
      product *= k;
      continue;
    }
    if (unknown !== null) {
      throw new Error(
        'More than one unknown variable in equation: ' +
          term +
          ' ' +
          unknown +
          JSON.stringify(context)
      );
    }
    unknown = term;
  }

  if (unknown === null) {
    throw new Error('No unknown variable in equation: ' + lhs);
  }

  return val / product;
}

export const solveInequalities = (
  inequalities: Inequality[],
  context: InequalityCtx,
  unknown: string
) => {
  const ctx = _.omit(context, unknown);
  return _(inequalities)
    .filter((ineq) => ineq.lhs.includes(unknown))
    .reduce(
      (acc, inequality) => Math.min(acc, solveInequality(inequality, ctx)),
      Infinity
    );
};

export const passInequalities: Inequality[] = [
  // This one's kinda unique in that you can only have 17 games of passing for the whole team.
  { lhs: ['base.gp'], rhs: 'passGp' },
  { lhs: ['pass.att', 'base.gp'], rhs: 'passAtt' },
  { lhs: ['pass.att', 'base.gp', 'pass.ypa'], rhs: 'passYds' },
  { lhs: ['pass.att', 'base.gp', 'pass.cmp', 0.01], rhs: 'passCmp' },
  { lhs: ['pass.att', 'base.gp', 'pass.tdp', 0.01], rhs: 'passTds' },
];

export const recvInequalities: Inequality[] = [
  { lhs: ['recv.tgt', 'base.gp'], rhs: 'passAtt' },
  { lhs: ['recv.tgt', 'base.gp', 'recv.rec', 0.01], rhs: 'passCmp' },
  {
    lhs: ['recv.tgt', 'base.gp', 'recv.rec', 0.01, 'recv.ypr'],
    rhs: 'passYds',
  },
  {
    lhs: ['recv.tgt', 'base.gp', 'recv.rec', 0.01, 'recv.tdp', 0.01],
    rhs: 'passTds',
  },
];

export const rushInequalities: Inequality[] = [
  { lhs: ['rush.att', 'base.gp'], rhs: 'rushAtt' },
  { lhs: ['rush.att', 'base.gp', 'rush.ypc'], rhs: 'rushYds' },
  { lhs: ['rush.att', 'base.gp', 'rush.tdp', 0.01], rhs: 'rushTds' },
];

export const allInequalities = [
  ...passInequalities,
  ...recvInequalities,
  ...rushInequalities,
];

export const aggregatePlayerProjections = (
  projections: PlayerProjections
): AggregatePlayerProjections =>
  _(projections)
    .values()
    .map(annualizePlayerProjection)
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

export const getBudget = (
  playerProjections: AggregatePlayerProjections,
  teamProjection: TeamSeason
): AggregatePlayerProjections => ({
  // TODO could coerce TeamProjection into a nested thing so it looks like playerProjections.
  pass: {
    att: teamProjection.passAtt - (playerProjections.pass?.att || 0),
    cmp: teamProjection.passCmp - (playerProjections.pass?.cmp || 0),
    yds: teamProjection.passYds - (playerProjections.pass?.yds || 0),
    tds: teamProjection.passTds - (playerProjections.pass?.tds || 0),
    gp: gameCount - (playerProjections.pass?.gp || 0),
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
});

export const clampPlayerProjectionUpdate = (
  budget: AggregatePlayerProjections,
  projection: Omit<PlayerProjection, 'id'>,
  update: PlayerProjectionUpdate
): PlayerProjectionUpdate => {
  const ctx = {
    ...projection,
    passGp: budget.pass.gp,
    passAtt: update.statType == 'pass' ? budget.pass.att : budget.recv.tgt,
    passCmp: update.statType == 'pass' ? budget.pass.cmp : budget.recv.rec,
    passYds: update.statType == 'pass' ? budget.pass.yds : budget.recv.yds,
    passTds: update.statType == 'pass' ? budget.pass.tds : budget.recv.tds,
    rushAtt: budget.rush.att,
    rushYds: budget.rush.yds,
    rushTds: budget.rush.tds,
  };

  const inequalities = {
    base: {
      ...(projection?.pass ? passInequalities : []),
      ...(projection?.recv ? recvInequalities : []),
      ...(projection?.rush ? rushInequalities : []),
    },
    pass: passInequalities,
    recv: recvInequalities,
    rush: rushInequalities,
  }[update.statType];

  return {
    ...update,
    value: Math.min(
      update.value,
      solveInequalities(inequalities, ctx, `${update.statType}.${update.stat}`)
    ),
  };
};

const nestedMin = _.partial(nestedNumericMap, (v) => Math.min(v, 0));

// Could do something more sophisticated here, but this gets the point across for now.
export const getPlayerUpdateValidationErrors = (
  clamped: PlayerProjectionUpdate,
  original: PlayerProjectionUpdate
) =>
  _.isEqual(clamped, original)
    ? []
    : ['Player projection limited in accordance with team total.'];

export const playerValidationMiddleware: Middleware =
  (store: MiddlewareAPI) =>
  (next: Dispatch) =>
  (action: PayloadAction<PlayerProjectionUpdate>) => {
    if (action.type != 'playerProjections/persistUpdate/fulfilled') {
      return next(action);
    }

    const state = store.getState() as AppState;
    const { projections: playerProjections } = state.playerProjections;
    const { projection: teamProjection } = state.teamProjection;

    const projection = playerProjections[action.payload.id];

    if (!teamProjection || !projection) {
      return next(action);
    }

    const budget = getBudget(
      aggregatePlayerProjections(_.omit(playerProjections, action.payload.id)),
      teamProjection
    );

    console.log('aggregatePlayerProjections', aggregatePlayerProjections(_.omit(playerProjections, action.payload.id)));
    console.log('teamProjection', teamProjection);
    console.log('budget', budget);
    

    const { payload: update } = action;
    const clamped = clampPlayerProjectionUpdate(budget, projection, update);
    const validationErrors = getPlayerUpdateValidationErrors(clamped, update);

    if (validationErrors.length) {
      store.dispatch(setPlayerProjections(pluralizeUpdate(clamped)));
      store.dispatch(
        setValidationErrors({ player: validationErrors, team: [] })
      );

      const newAction: PayloadAction<PlayerProjectionUpdate> = {
        ...action,
        payload: clamped,
      };
      store.dispatch(newAction);
      return newAction;
    }

    return next(action);
  };

export const asTeamProjectionDelta = (
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
  const pass = budget?.pass
    ? (nestedMin(budget.pass) as AnnualizedPassSeason)
    : undefined;
  const recv = budget?.recv
    ? (nestedMin(budget.recv) as AnnualizedRecvSeason)
    : undefined;
  const rush = budget?.rush
    ? (nestedMin(budget.rush) as AnnualizedRushSeason)
    : undefined;
  return {
    passAtt: Math.min(pass?.att || 0, recv?.tgt || 0),
    passCmp: Math.min(pass?.cmp || 0, recv?.rec || 0),
    passYds: Math.min(pass?.yds || 0, recv?.yds || 0),
    passTds: Math.min(pass?.tds || 0, recv?.tds || 0),
    rushAtt: rush?.att || 0,
    rushYds: rush?.yds || 0,
    rushTds: rush?.tds || 0,
  };
};

// Could do something more sophisticated here, but this gets the point across for now.
export const getTeamValidationErrors = (
  clamped: TeamSeason,
  original: TeamSeason
) =>
  _.isEqual(clamped, original)
    ? []
    : ['Team total limited in accordance with player projection total.'];

export const teamValidationMiddleware: Middleware =
  (store: MiddlewareAPI) => (next: Dispatch) => (action: AnyAction) => {
    if (action.type != 'teamProjection/persist/fulfilled') {
      return next(action);
    }

    const state = store.getState() as AppState;
    const { projections: playerProjections } = state.playerProjections;
    const { projection: teamProjection } = state.teamProjection;

    if (!teamProjection) {
      return next(action);
    }

    const annualizedProjections = aggregatePlayerProjections(playerProjections);
    const budget = getBudget(annualizedProjections, teamProjection);

    const delta = asTeamProjectionDelta(budget);
    const clamped = {
      ...teamProjection,
      ...(subtractObjects(teamProjection, delta) as TeamSeason),
    };

    const validationErrors = getTeamValidationErrors(clamped, teamProjection);
    if (validationErrors.length) {
      store.dispatch(setTeamProjection(clamped));
      store.dispatch(
        setValidationErrors({ player: [], team: validationErrors })
      );

      const newAction: PayloadAction<TeamSeason> = {
        ...action,
        payload: clamped,
      };
      store.dispatch(newAction);
      return newAction;
    }

    return next(action);
  };
