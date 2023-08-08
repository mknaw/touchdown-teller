import { Action, ThunkAction, configureStore } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import { enableMapSet } from 'immer';
import { createWrapper } from 'next-redux-wrapper';
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistReducer,
  persistStore,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import { StatType } from '@/constants';

type SettingsState = {
  statType: StatType;
};

const initialSettingsState = { statType: StatType.PASS } as SettingsState;

const settingsSlice = createSlice({
  name: 'settings',
  initialState: initialSettingsState,
  reducers: {
    setStatType(state, action: PayloadAction<StatType>) {
      state.statType = action.payload;
    },
  },
});

const makeStore = () => {
  enableMapSet();
  // const isServer = typeof window === 'undefined';
  // if (isServer) {
  //   return configureStore({
  //     reducer: {
  //       [settingsSlice.name]: settingsSlice.reducer,
  //     },
  //     devTools: true,
  //   });
  // } else {
  const persistConfig = {
    key: 'nextjs',
    storage,
  };

  const persistedReducer = persistReducer(persistConfig, settingsSlice.reducer);
  const store = configureStore({
    reducer: {
      [settingsSlice.name]: persistedReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
      }),
    devTools: true,
  });

  persistStore(store);

  return store;
  // }
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
