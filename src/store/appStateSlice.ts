import { createSlice } from '@reduxjs/toolkit';

import { lastYear } from '@/constants';

export enum TeamSeasonsModalType {
  Pass = 'pass',
  Rush = 'rush',
}

export type TeamSeasonsModalState = {
  open: boolean;
  type: TeamSeasonsModalType;
  // TODO really shouldn't be just any number...
  year: number | null;
};

const initialTeamSeasonsModalState = {
  open: false,
  type: TeamSeasonsModalType.Pass,
  year: null,
} as TeamSeasonsModalState;

type AppState = {
  teamSeasonsModalState: TeamSeasonsModalState;
};

const initialAppState = {
  teamSeasonsModalState: initialTeamSeasonsModalState,
} as AppState;

const appStateSlice = createSlice({
  name: 'appState',
  initialState: initialAppState,
  reducers: {
    toggleTeamSeasonsModal(state) {
      state.teamSeasonsModalState.open = !state.teamSeasonsModalState.open;
    },
    toggleTeamPassSeasonsModal(state) {
      state.teamSeasonsModalState.open = true;
      state.teamSeasonsModalState.type = TeamSeasonsModalType.Pass;
    },
    toggleTeamRushSeasonsModal(state) {
      state.teamSeasonsModalState.open = true;
      state.teamSeasonsModalState.type = TeamSeasonsModalType.Rush;
    },
    toggleTeamSeasonsModalYear(state) {
      state.teamSeasonsModalState.year =
        state.teamSeasonsModalState.year == null ? lastYear : null;
    },
  },
});

export const {
  toggleTeamPassSeasonsModal,
  toggleTeamRushSeasonsModal,
  toggleTeamSeasonsModalYear,
  toggleTeamSeasonsModal,
} = appStateSlice.actions;
export default appStateSlice;
