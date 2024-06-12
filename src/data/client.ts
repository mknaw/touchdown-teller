import Dexie, { Table } from 'dexie';

import { TeamKey } from '@/constants';
import {
  PassSeason,
  PlayerBaseProjection,
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
