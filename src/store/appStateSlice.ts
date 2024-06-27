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

export type ValidationErrors = {
  player: string[];
  team: string[];
};

type AppState = {
  teamSeasonsModalState: TeamSeasonsModalState;
  validationErrors: ValidationErrors;
};

const initialValidationErrors = {
  player: [],
  team: [],
};

const initialAppState = {
  teamSeasonsModalState: initialTeamSeasonsModalState,
  validationErrors: initialValidationErrors,
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
    setValidationErrors(state, action) {
      state.validationErrors = action.payload;
    },
    clearValidationErrors(state) {
      state.validationErrors = initialValidationErrors;
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
  setValidationErrors,
  clearValidationErrors,
} = appStateSlice.actions;
export default appStateSlice;
