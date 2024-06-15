import type { PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { Table } from 'dexie';
import _ from 'lodash';

import { StatType } from '@/constants';
import { db, getPlayerProjections } from '@/data/client';
import { PlayerProjection } from '@/models/PlayerSeason';

export type PlayerProjections = {
  [playerId: number]: Partial<PlayerProjection>;
};

export type PlayerProjectionsStore = {
  status: string;
  projections: PlayerProjections;
};

export type UpdatePlayerProjection = {
  playerId: number;
  projection: Partial<PlayerProjection>;
};

const playerProjectionsSlice = createSlice({
  name: 'playerProjections',
  initialState: {
    status: 'idle',
    projections: {},
  } as PlayerProjectionsStore,
  reducers: {
    setPlayerSeason(state, action: PayloadAction<PlayerProjections>) {
      state.projections = _.merge(state.projections, action.payload);
    },
    removePlayerSeason(
      state,
      action: PayloadAction<{ playerId: number; statType: StatType }>
    ) {
      const { playerId, statType } = action.payload;
      state.projections[playerId] = _.omit(
        state.projections[playerId],
        statType
      );
    },
  },
  extraReducers(builder) {
    builder
      .addCase(loadPlayerProjections.pending, (state) => ({
        ...state,
        status: 'loading',
      }))
      .addCase(loadPlayerProjections.fulfilled, (state, action) => ({
        ...state,
        status: 'succeeded',
        projections: action.payload,
      }))
      .addCase(loadPlayerProjections.rejected, (state) => ({
        ...state,
        status: 'failed',
      }));
  },
});

export const { setPlayerSeason } = playerProjectionsSlice.actions;
export default playerProjectionsSlice;

export const loadPlayerProjections = createAsyncThunk(
  'playerProjections/load',
  async (team: string | undefined = undefined) => {
    return await getPlayerProjections(team);
  }
);

const tables: Partial<Record<keyof PlayerProjection, Table>> = {
  pass: db.pass,
  recv: db.recv,
  rush: db.rush,
};

export const persistPlayerProjections = createAsyncThunk(
  'playerProjectionss/persist',
  async (projections: PlayerProjections, thunkAPI) => {
    // TODO switch to a Promise.all
    for (const [playerId, projection] of Object.entries(projections)) {
      thunkAPI.dispatch(setPlayerSeason({ [playerId]: projection }));
      // TODO probably some nicer lodash way to do this
      const keys: (keyof PlayerProjection)[] = ['pass', 'recv', 'rush'];
      for (const key of keys) {
        if (!!projection[key]) {
          await (tables[key] as Table).put(
            { playerId, ...projection[key] },
            playerId
          );
        }
      }
    }
  }
);

export const deletePlayerSeason = createAsyncThunk(
  'playerProjectionss/persist',
  async (
    { playerId, statType }: { playerId: number; statType: StatType },
    thunkAPI
  ) => {
    thunkAPI.dispatch(
      playerProjectionsSlice.actions.removePlayerSeason({ playerId, statType })
    );

    await (tables[statType] as Table).where('id').equals(playerId).delete();
  }
);
