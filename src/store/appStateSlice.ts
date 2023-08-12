import { createSlice } from '@reduxjs/toolkit';

type AppState = {
  isTeamPassSeasonsModalOpen: boolean;
  isTeamRushSeasonsModalOpen: boolean;
};

const initialAppState = {
  isTeamPassSeasonsModalOpen: false,
  isTeamRushSeasonsModalOpen: false,
} as AppState;

const appStateSlice = createSlice({
  name: 'appState',
  initialState: initialAppState,
  reducers: {
    toggleTeamPassSeasonsModal(state) {
      state.isTeamPassSeasonsModalOpen = !state.isTeamPassSeasonsModalOpen;
    },
    toggleTeamRushSeasonsModal(state) {
      state.isTeamRushSeasonsModalOpen = !state.isTeamRushSeasonsModalOpen;
    },
  },
});

export const { toggleTeamPassSeasonsModal, toggleTeamRushSeasonsModal } =
  appStateSlice.actions;
export default appStateSlice;
