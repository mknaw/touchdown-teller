import Dexie, { Table } from 'dexie';
import _ from 'lodash';

import { TeamKey } from '@/constants';
import {
  PassSeason,
  PlayerBaseProjection,
  PlayerProjection,
  RecvSeason,
  RushSeason,
} from '@/models/PlayerSeason';
import { TeamSeason } from '@/models/TeamSeason';

export class TouchdownTellerDatabase extends Dexie {
  public team!: Table<TeamSeason, TeamKey>;
  public player!: Table<PlayerBaseProjection, TeamKey>;
  public pass!: Table<PassSeason, number>;
  public recv!: Table<RecvSeason, number>;
  public rush!: Table<RushSeason, number>;

  public constructor() {
    super('touchdown-teller');
    this.version(1).stores({
      team: '',
      player: ',team',
      pass: ',team',
      recv: ',team',
      rush: ',team',
    });
  }
}

export const db = new TouchdownTellerDatabase();

/// Assemble a `{id: {pass: ..., recv: ..., rush: ...}}` object from the IndexedDB.
export const getPlayerProjections = async (
  team: string | undefined = undefined
): Promise<{
  [id: number]: Partial<PlayerProjection>;
}> => {
  interface hasPlayerIdAndName {
    // TODO `?`s to keep the `delete` bit legal, but tbh it's kinda gross
    playerId?: number;
    team?: string;
  }

  const transform = _.curry((type: string, data: hasPlayerIdAndName[]) =>
    _(data)
      .keyBy('playerId')
      .mapValues((v) => {
        delete v.playerId;
        return v;
      })
      .mapValues((v) => ({
        [type]: v,
      }))
      .value()
  );

  // TODO a little yucky
  if (team) {
    return _.merge(
      ...(await Promise.all([
        db.player.where({ team }).toArray().then(transform('base')),
        db.pass.where({ team }).toArray().then(transform('pass')),
        db.recv.where({ team }).toArray().then(transform('recv')),
        db.rush.where({ team }).toArray().then(transform('rush')),
      ]))
    );
  } else {
    return _.merge(
      ...(await Promise.all([
        db.player.toArray().then(transform('base')),
        db.pass.toArray().then(transform('pass')),
        db.recv.toArray().then(transform('recv')),
        db.rush.toArray().then(transform('rush')),
      ]))
    );
  }
};

/// Fetch a projection for the given team from the DB.
export const getTeamProjection = async (
  team: TeamKey
): Promise<TeamSeason | undefined> => db.team.get(team);
