import { createSlice } from '@reduxjs/toolkit';

export enum TeamSeasonsModalType {
  Pass = 'pass',
  Rush = 'rush',
}

export type TeamSeasonsModalState = {
  open: boolean;
  type: TeamSeasonsModalType;
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
    // TODO unused, but maybe I'll use it later to set past years..
    // toggleTeamSeasonsModalYear(state) {
    //   state.teamSeasonsModalState.year =
    //     state.teamSeasonsModalState.year == null ? lastYear : null;
    // },
  },
});

export const {
  toggleTeamPassSeasonsModal,
  toggleTeamRushSeasonsModal,
  toggleTeamSeasonsModal,
} = appStateSlice.actions;
export default appStateSlice;
