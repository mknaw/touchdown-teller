import { useDispatch } from 'react-redux';

import { Action, ThunkAction, configureStore } from '@reduxjs/toolkit';
import { createWrapper } from 'next-redux-wrapper';
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistStore,
} from 'redux-persist';
import { persistCombineReducers } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import {
  playerValidationMiddleware,
  teamValidationMiddleware,
} from '@/models/validation';
import appStateSlice from '@/store/appStateSlice';
import playerProjectionsSlice from '@/store/playerProjectionSlice';
import settingsSlice from '@/store/settingsSlice';
import teamProjectionSlice from '@/store/teamProjectionSlice';

const makeStore = () => {
  const persistConfig = {
    key: 'nextjs',
    storage,
    whitelist: [settingsSlice.name],
  };

  const persistedReducer = persistCombineReducers(persistConfig, {
    [settingsSlice.name]: settingsSlice.reducer,
    [appStateSlice.name]: appStateSlice.reducer,
    [teamProjectionSlice.name]: teamProjectionSlice.reducer,
    [playerProjectionsSlice.name]: playerProjectionsSlice.reducer,
  });

  const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
      })
        .concat(playerValidationMiddleware)
        .concat(teamValidationMiddleware),
    devTools: true,
  });

  persistStore(store);

  return store;
};

export type AppStore = ReturnType<typeof makeStore>;
export type AppState = ReturnType<AppStore['getState']>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  AppState,
  unknown,
  Action
>;
export type AppDispatch = AppStore['dispatch'];
export const useAppDispatch = () => useDispatch<AppDispatch>();

export const settingsAction = settingsSlice.actions.setStatType;

export const wrapper = createWrapper<AppStore>(makeStore);
