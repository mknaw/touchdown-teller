import type { PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { Table } from 'dexie';
import _ from 'lodash';

import { StatType } from '@/constants';
import { getPlayerProjections, tables } from '@/data/client';
import {
  PassSeason,
  PlayerBaseProjection,
  PlayerProjection,
  PlayerProjections,
  RecvSeason,
  RushSeason,
  SeasonTypeMap,
} from '@/models/PlayerSeason';

export type PlayerProjectionsStore = {
  status: string;
  projections: PlayerProjections;
};

export type PlayerProjectionUpdate = {
  id: number;
  value: number;
} & (
    | {
      statType: 'base';
      stat: 'gp';
    }
    | {
      statType: 'pass';
      stat: keyof PassSeason;
    }
    | {
      statType: 'recv';
      stat: keyof RecvSeason;
    }
    | {
      statType: 'rush';
      stat: keyof RushSeason;
    }
  );

// Don't really ~love~ the WET nature of this type, but whatever, not the biggest issue rn.
type PlayerProjectionUpdates = {
  [id: number]: Partial<{
    base: Partial<PlayerBaseProjection>;
    pass: Partial<PassSeason>;
    recv: Partial<RecvSeason>;
    rush: Partial<RushSeason>;
  }>;
};

// Convert between `PlayerProjectionUpdate` and `PlayerProjectionUpdates` types.
export const pluralizeUpdate = ({
  id,
  statType,
  stat,
  value,
}: PlayerProjectionUpdate): PlayerProjectionUpdates => {
  return {
    [id]: {
      [statType]: {
        [stat]: value,
      },
    },
  };
};

const playerProjectionsSlice = createSlice({
  name: 'playerProjections',
  initialState: {
    status: 'idle',
    projections: {},
  } as PlayerProjectionsStore,
  reducers: {
    updateStat(state, action: PayloadAction<PlayerProjectionUpdate>) {
      playerProjectionsSlice.caseReducers.setPlayerProjections(state, {
        type: 'playerProjections/setPlayerProjections',
        payload: pluralizeUpdate(action.payload),
      });
    },
    setPlayerProjections(
      state,
      action: PayloadAction<PlayerProjectionUpdates>
    ) {
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

export const { updateStat, setPlayerProjections, removePlayerSeason } =
  playerProjectionsSlice.actions;
export default playerProjectionsSlice;

export const loadPlayerProjections = createAsyncThunk<
  PlayerProjections,
  string | undefined
>('playerProjections/load', async (team: string | undefined = undefined) => {
  return await getPlayerProjections(team);
});

export const persistUpdate = createAsyncThunk(
  'playerProjections/persistUpdate',
  async (update: PlayerProjectionUpdate, thunkAPI) => {
    const { id, statType, stat, value } = update;
    thunkAPI.dispatch(setPlayerProjections(pluralizeUpdate(update)));
    await (tables[statType] as Table).update(id, { [stat]: value });
    return update;
  }
);

// TODO given that now this is only used for creating new players, maybe can simplify it..
export const persistPlayerProjection = createAsyncThunk(
  'playerProjections/persist',
  async (projection: PlayerProjection, thunkAPI) => {
    thunkAPI.dispatch(setPlayerProjections({ [projection.id]: projection }));

    const team = projection.base.team;
    const keys: (keyof SeasonTypeMap)[] = ['base', 'pass', 'recv', 'rush'];
    for (const key of keys) {
      if (projection[key]) {
        const stat = projection[key];
        await (tables[key] as Table).put(
          { playerId: projection.id, team, ...stat },
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
