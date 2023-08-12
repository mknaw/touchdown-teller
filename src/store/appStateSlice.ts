import { createSlice } from '@reduxjs/toolkit';

type AppState = {
  isTeamPassSeasonsModalOpen: boolean;
};

const initialAppState = {
  isTeamPassSeasonsModalOpen: false,
} as AppState;

const appStateSlice = createSlice({
  name: 'appState',
  initialState: initialAppState,
  reducers: {
    toggleTeamPassSeasonsModal(state) {
      state.isTeamPassSeasonsModalOpen = !state.isTeamPassSeasonsModalOpen;
    },
  },
});

export const { toggleTeamPassSeasonsModal } = appStateSlice.actions;
export default appStateSlice;
