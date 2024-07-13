import Dexie, { Table } from 'dexie';
import _ from 'lodash';

import { TeamKey } from '@/constants';
import {
  PassSeason,
  PlayerBaseProjection,
  PlayerProjections,
  RecvSeason,
  RushSeason,
} from '@/models/PlayerSeason';
import { Ranking } from '@/models/Ranking';
import {
  ScoringSettings,
  mkDefaultScoringSettings,
} from '@/models/ScoringSettings';
import { TeamSeason } from '@/models/TeamSeason';

interface SeasonKeyData {
  playerId: number;
  team: TeamKey;
}

export class TouchdownTellerDatabase extends Dexie {
  public team!: Table<TeamSeason, TeamKey>;
  public player!: Table<PlayerBaseProjection, TeamKey>;
  public pass!: Table<PassSeason & SeasonKeyData, number>;
  public recv!: Table<RecvSeason & SeasonKeyData, number>;
  public rush!: Table<RushSeason & SeasonKeyData, number>;
  public ranking!: Table<Ranking, number>;

  public scoringSettings!: Table<ScoringSettings, number>;

  public constructor() {
    super('touchdown-teller');
    this.version(1).stores({
      team: '',
      player: ',team',
      pass: ',team',
      recv: ',team',
      rush: ',team',
      ranking: 'playerId,rank',
      scoringSettings: '',
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

// TODO see if it makes sense to even have another one of these... kind of confusing
type SeasonTypeMap = {
  base: PlayerBaseProjection & SeasonKeyData;
  pass: PassSeason & SeasonKeyData;
  recv: RecvSeason & SeasonKeyData;
  rush: RushSeason & SeasonKeyData;
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
        .mapValues((season) => {
          const { playerId, ...rest } = season;
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

/// Fetch the scoring settings from the DB.
export const getScoringSettings = async (): Promise<ScoringSettings> => {
  let scoringSettings = await db.scoringSettings.get(1);
  if (scoringSettings) {
    return scoringSettings;
  }

  scoringSettings = mkDefaultScoringSettings();
  await db.scoringSettings.add(scoringSettings, 1);
  return scoringSettings;
};

/// Update the scoring settings in the DB.
export const updateScoringSettings = async (
  scoringSettings: ScoringSettings
): Promise<void> => {
  await db.scoringSettings.update(1, scoringSettings);
};
