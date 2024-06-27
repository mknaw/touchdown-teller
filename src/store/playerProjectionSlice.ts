import type { PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { Table } from 'dexie';
import _ from 'lodash';

import { StatType } from '@/constants';
import { getPlayerProjections, tables } from '@/data/client';
import {
  PlayerProjection,
  PlayerProjections,
  SeasonTypeMap,
} from '@/models/PlayerSeason';

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
    setPlayerProjections(state, action: PayloadAction<PlayerProjections>) {
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
      .addCase(loadPlayerProjections.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(loadPlayerProjections.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.projections = action.payload;
      })
      .addCase(loadPlayerProjections.rejected, (state) => {
        state.status = 'failed';
      });
  },
});

export const { setPlayerProjections, removePlayerSeason } =
  playerProjectionsSlice.actions;
export default playerProjectionsSlice;

export const loadPlayerProjections = createAsyncThunk<
  PlayerProjections,
  string | undefined
>('playerProjections/load', async (team: string | undefined = undefined) => {
  return await getPlayerProjections(team);
});

export const persistPlayerProjection = createAsyncThunk(
  'playerProjections/persist',
  async (
    projection: PlayerProjection,
    thunkAPI
  ) => {
      thunkAPI.dispatch(setPlayerProjections({ [projection.id]: projection }));

      const keys: (keyof SeasonTypeMap)[] = ['base', 'pass', 'recv', 'rush'];
      for (const key of keys) {
        if (projection[key]) {
          const stat = projection[key] as Object;
          await (tables[key] as Table).put(
            { playerId: projection.id, ...stat },
            projection.id
          );
        }
      }
    return projection;
  }
);

export const deletePlayerSeason = createAsyncThunk(
  'playerProjections/delete',
  async (
    { playerId, statType }: { playerId: number; statType: StatType },
    thunkAPI
  ) => {
    thunkAPI.dispatch(removePlayerSeason({ playerId, statType }));

    await (tables[statType] as Table).where('id').equals(playerId).delete();
  }
);
