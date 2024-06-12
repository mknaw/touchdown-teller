import type { PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { db } from '@/data/client';
import { PassSeason } from '@/models/PlayerSeason';

type PlayerProjections = { [key: string]: PassSeason };

type playerProjectionsStore = {
  status: string;
  projections: PlayerProjections;
};

const playerProjectionsSlice = createSlice({
  name: 'playerProjections',
  initialState: {
    status: 'idle',
    projections: {},
  } as playerProjectionsStore,
  reducers: {
    setPlayerSeason(state, action: PayloadAction<PassSeason>) {
      const passSeason = action.payload;
      state.projections[`${passSeason.playerId}`] = passSeason;
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
    const projections = await db.pass.toArray();
    return projections.reduce((acc, projection) => {
      acc[projection.playerId] = projection;
      return acc;
    }, {} as PlayerProjections);
  }
);
