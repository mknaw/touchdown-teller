import { createSlice } from '@reduxjs/toolkit';

type AppState = {
  isTeamPassSeasonModalOpen: boolean;
};

const initialAppState = {
  isTeamPassSeasonModalOpen: false,
} as AppState;

const appStateSlice = createSlice({
  name: 'appState',
  initialState: initialAppState,
  reducers: {
    toggleTeamPassSeasonModal(state) {
      state.isTeamPassSeasonModalOpen = !state.isTeamPassSeasonModalOpen;
    },
  },
});

export const { toggleTeamPassSeasonModal } = appStateSlice.actions;
export default appStateSlice;
