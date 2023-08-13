import Dexie, { Table } from 'dexie';

import { TeamKey } from '@/constants';
import {
  PassSeasonData,
  RecvSeasonData,
  RushSeasonData,
} from '@/models/PlayerSeason';
import { TeamSeasonData } from '@/models/TeamSeason';

export const teamStoreKey = 'team';
export enum StorageKey {
  PASS = 'pass',
  RECV = 'recv',
  RUSH = 'rush',
}

export class TouchdownTellerDatabase extends Dexie {
  public team!: Table<TeamSeasonData, TeamKey>;
  public pass!: Table<PassSeasonData, number>;
  public recv!: Table<RecvSeasonData, number>;
  public rush!: Table<RushSeasonData, number>;

  public constructor() {
    super('touchdown-teller');
    this.version(1).stores({
      team: '',
      pass: ',team',
      recv: ',team',
      rush: ',team',
    });
  }
}

export const db = new TouchdownTellerDatabase();
