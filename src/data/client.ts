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
import { TeamSeasonData } from '@/models/TeamSeason';

export class TouchdownTellerDatabase extends Dexie {
  public team!: Table<TeamSeasonData, TeamKey>;
  public player!: Table<PlayerBaseProjection, TeamKey>;
  public pass!: Table<PassSeason, number>;
  public recv!: Table<RecvSeason, number>;
  public rush!: Table<RushSeason, number>;

  public constructor() {
    super('touchdown-teller');
    this.version(1).stores({
      team: '',
      player: '',
      pass: ',team',
      recv: ',team',
      rush: ',team',
    });
  }
}

export const db = new TouchdownTellerDatabase();

/// Assemble a `{id: {pass: ..., recv: ..., rush: ...}}` object from the IndexedDB.
export const getPlayerProjections = async (): Promise<{
  [id: number]: Partial<PlayerProjection>;
}> => {
  interface hasPlayerIdAndName {
    // TODO `?`s to keep the `delete` bit legal, but tbh it's kinda gross
    playerId?: number;
    name?: string;
    team?: string;
  }

  const transform = _.curry((type: string, data: hasPlayerIdAndName[]) =>
    _(data)
      .keyBy('playerId')
      .mapValues((v) => {
        delete v.playerId;
        delete v.name;
        delete v.team;
        return v;
      })
      .mapValues((v) => ({
        [type]: v,
      }))
      .value()
  );

  return _.merge(
    ...(await Promise.all([
      db.pass.toArray().then(transform('pass')),
      db.recv.toArray().then(transform('recv')),
      db.rush.toArray().then(transform('rush')),
    ]))
  );
};
