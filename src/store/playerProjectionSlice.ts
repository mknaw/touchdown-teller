import type { PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import _ from 'lodash';

import { getPlayerProjections } from '@/data/client';
import { PlayerProjection } from '@/models/PlayerSeason';

export type PlayerProjections = { [playerId: number]: Partial<PlayerProjection> };

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
  },
  extraReducers(builder) {
    builder
      .addCase(loadPlayerProjections.pending, (state, action) => {
        state.status = 'loading';
      })
      .addCase(loadPlayerProjections.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // Add any fetched posts to the array
        state.projections = action.payload;
      })
      .addCase(loadPlayerProjections.rejected, (state, action) => {
        state.status = 'failed';
      });
  },
});

export const { setPlayerSeason } = playerProjectionsSlice.actions;
export default playerProjectionsSlice;

export const loadPlayerProjections = createAsyncThunk(
  'playerProjections/load',
  async () => {
    return await getPlayerProjections();
  }
);
