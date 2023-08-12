import {
  Action,
  ThunkAction,
  configureStore,
  createStore,
} from '@reduxjs/toolkit';
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

import appStateSlice from '@/store/appStateSlice';
import settingsSlice from '@/store/settingsSlice';

const makeStore = () => {
  const persistConfig = {
    key: 'nextjs',
    storage,
    whitelist: [settingsSlice.name],
  };

  const persistedReducer = persistCombineReducers(persistConfig, {
    [settingsSlice.name]: settingsSlice.reducer,
    [appStateSlice.name]: appStateSlice.reducer,
  });
  const store = createStore(persistedReducer);
  // reducer: {
  //   [settingsSlice.name]: persistedReducer,
  // },
  // middleware: (getDefaultMiddleware) =>
  //   getDefaultMiddleware({
  //     serializableCheck: {
  //       ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
  //     },
  //   }),
  // devTools: true,
  // });

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

export const settingsAction = settingsSlice.actions.setStatType;

export const wrapper = createWrapper<AppStore>(makeStore);
