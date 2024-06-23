import type { PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import _ from 'lodash';

import { TeamKey } from '@/constants';
import { db, getTeamProjection } from '@/data/client';
import { TeamSeason } from '@/models/TeamSeason';

export type TeamProjectionStore = {
  status: string;
  projection: TeamSeason | undefined;
};

const teamProjectionSlice = createSlice({
  name: 'teamProjection',
  initialState: {
    status: 'idle',
    projection: undefined,
  } as TeamProjectionStore,
  reducers: {
    setTeamProjection(state, action: PayloadAction<Partial<TeamSeason>>) {
      state.projection = _.merge(state.projection, action.payload);
    },
  },
  extraReducers(builder) {
    builder
      .addCase(loadTeamProjection.pending, (state) => ({
        ...state,
        status: 'loading',
      }))
      .addCase(loadTeamProjection.fulfilled, (state, action) => ({
        ...state,
        status: 'succeeded',
        projection: action.payload,
      }))
      .addCase(loadTeamProjection.rejected, (state) => ({
        ...state,
        status: 'failed',
      }))
      .addCase(persistTeamProjection.pending, (state) => ({
        ...state,
        status: 'saving',
      }))
      .addCase(persistTeamProjection.fulfilled, (state) => ({
        ...state,
        status: 'succeeded',
      }))
      .addCase(persistTeamProjection.rejected, (state) => ({
        ...state,
        status: 'failed',
      }));
  },
});

export const { setTeamProjection } = teamProjectionSlice.actions;
export default teamProjectionSlice;

export const loadTeamProjection = createAsyncThunk(
  'teamProjection/load',
  async (team: TeamKey) => {
    return await getTeamProjection(team);
  }
);

export const persistTeamProjection = createAsyncThunk(
  'teamProjection/persist',
  async (projection: TeamSeason, thunkAPI) => {
    // TODO kinda torn on whether this should be exposed in a different file,
    // or if literally this should be the only way to interact with the IndexedDB.
    // Maybe this should be the only way.

    // TODO why are these "out of line keys"? I would have expected teamName to work.
    thunkAPI.dispatch(setTeamProjection(projection));
    return await db.team.put(projection, projection.teamName);
  }
);
