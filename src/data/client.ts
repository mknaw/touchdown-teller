import Dexie, { Table } from 'dexie';
import _ from 'lodash';

import { TeamKey } from '@/constants';
import {
  PassSeason,
  PlayerBaseProjection,
  PlayerProjections,
  RecvSeason,
  RushSeason,
  SeasonTypeMap,
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

export const tables: Record<keyof SeasonTypeMap, Table> = {
  base: db.player,
  pass: db.pass,
  recv: db.recv,
  rush: db.rush,
};

/// Assemble a `{id: {pass: ..., recv: ..., rush: ...}}` object from the IndexedDB.
export const getPlayerProjections = async (
  team: string | undefined = undefined
): Promise<PlayerProjections> => {
  const transform = _.curry(
    <T extends keyof SeasonTypeMap>(
      type: T,
      data: SeasonTypeMap[T][]
    ): {
      [playerId: number]: { [K in T]?: Omit<SeasonTypeMap[T], 'playerId'> };
    } =>
      _(data)
        .keyBy('playerId')
        .mapValues((v) => {
          const { playerId, ...rest } = v;
          return { [type]: rest } as {
            [K in T]: Omit<SeasonTypeMap[T], 'playerId'>;
          };
        })
        .mapKeys((_, k) => parseInt(k))
        .value()
  );

  const fetchData = async (type: keyof SeasonTypeMap) => {
    const table = tables[type];
    const query = team ? table.where({ team }) : table;
    return query.toArray().then(transform(type));
  };

  const types = ['base', 'pass', 'recv', 'rush'] as (keyof SeasonTypeMap)[];
  const projections = await Promise.all(types.map(fetchData));
  return _.merge({}, ...projections) as PlayerProjections;
};

/// Fetch a projection for the given team from the DB.
export const getTeamProjection = async (
  team: TeamKey
): Promise<TeamSeason | undefined> => db.team.get(team);
