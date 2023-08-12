import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import { StatType } from '@/constants';

type Settings = {
  statType: StatType;
};

const initialSettings = { statType: StatType.PASS } as Settings;

const settingsSlice = createSlice({
  name: 'settings',
  initialState: initialSettings,
  reducers: {
    setStatType(state, action: PayloadAction<StatType>) {
      state.statType = action.payload;
    },
  },
});

export const { setStatType } = settingsSlice.actions;
export default settingsSlice;
