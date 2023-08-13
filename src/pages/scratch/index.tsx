import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { PassSeasonData } from '@/models/PlayerSeason';
import { AppDispatch, AppState, AppThunk, useAppDispatch } from '@/store';
import { loadPlayerProjections } from '@/store/playerProjectionSlice';

export default () => {
  const dispatch = useAppDispatch();
  const projectionStatus = useSelector<AppState, string>(
    (state) => state.playerProjections.status
  );
  const projections = useSelector<AppState, { [key: string]: PassSeasonData }>(
    (state) => state.playerProjections.projections
  );

  useEffect(() => {
    if (projectionStatus === 'idle') {
      dispatch(loadPlayerProjections());
    }
  }, [projectionStatus, dispatch]);
  return <div className={'text-white'}>{JSON.stringify(projections)}</div>;
};
