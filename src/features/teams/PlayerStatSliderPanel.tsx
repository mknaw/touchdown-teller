import { useSelector } from 'react-redux';

import _ from 'lodash';

import Stack from '@mui/material/Stack';

import StatSlider from '@/components/StatSlider';
import { StatType } from '@/constants';
import {
  PassSeason,
  PlayerProjection,
  PlayerProjections,
  RecvSeason,
  RushSeason,
} from '@/models/PlayerSeason';
import { AppState, useAppDispatch } from '@/store';
import {
  PlayerProjectionUpdate,
  PlayerProjectionsStore,
  persistUpdate,
  setPlayerProjections,
} from '@/store/playerProjectionSlice';

// TODO don't really need another implementation of this...
type StatTypes = 'base' | 'pass' | 'recv' | 'rush';
type StatForType<T extends StatTypes> = T extends 'base'
  ? 'gp'
  : T extends 'pass'
  ? keyof PassSeason
  : T extends 'recv'
  ? keyof RecvSeason
  : T extends 'rush'
  ? keyof RushSeason
  : never;

export default function PlayerStatSliderPanel({
  statType,
  playerId,
  lastSeasons,
}: {
  statType: StatType;
  playerId: number;
  lastSeasons: PlayerProjections;
}) {
  const dispatch = useAppDispatch();

  const { projections } = useSelector<AppState, PlayerProjectionsStore>(
    (state) => state.playerProjections
  );

  // TODO name this something better, but whatever
  let p = projections[playerId];

  if (!p) {
    return null;
  }

  const projection = { id: playerId, ...p } as PlayerProjection;

  const lastSeason = { id: playerId, ...lastSeasons[playerId] };

  // TODO should we assert that the `playerId` is in `projections`? & rescue if not?

  const commonSliderProps = {
    current: projection,
    set: (v: PlayerProjection) =>
      dispatch(setPlayerProjections({ [playerId]: v })),
    previous: lastSeason,
  };

  // It was clean just a moment ago... and now I've made it nasty again...
  function persist<T extends StatTypes>(
    statType: T,
    stat: StatForType<T>
  ): (p: PlayerProjection) => void {
    const fn = (v: PlayerProjection) => {
      const value = _.get(v, `${statType}.${stat}`);
      if (value === undefined) return;
      dispatch(
        persistUpdate({
          id: v.id,
          value,
          statType,
          stat,
        } as PlayerProjectionUpdate)
      );
    };
    return fn;
  }

  // TODO these marks don't look good when they're on the far end -
  // like 0 tds, 17 games played ...
  const sliders = {
    [StatType.PASS]: (
      <>
        <StatSlider
          label={'Games Played'}
          path={'base.gp'}
          min={0}
          max={17}
          step={0.1}
          decimalPlacesMark={0}
          persist={persist('base', 'gp')}
          {...commonSliderProps}
        />
        <StatSlider
          label={'Attempts per Game'}
          path={'pass.att'}
          min={15}
          max={50}
          step={0.1}
          persist={persist('pass', 'att')}
          {...commonSliderProps}
        />
        <StatSlider
          label={'Completion Percentage'}
          path={'pass.cmp'}
          min={20}
          max={75}
          step={0.1}
          persist={persist('pass', 'cmp')}
          {...commonSliderProps}
        />
        <StatSlider
          label={'Yards per Attempt'}
          path={'pass.ypa'}
          min={1}
          max={15}
          step={0.1}
          persist={persist('pass', 'ypa')}
          {...commonSliderProps}
        />
        <StatSlider
          label={'Touchdowns per Attempt'}
          path={'pass.tdp'}
          min={0}
          max={20}
          step={0.1}
          persist={persist('pass', 'tdp')}
          {...commonSliderProps}
        />
      </>
    ),
    [StatType.RECV]: (
      <>
        <StatSlider
          label={'Games Played'}
          path={'base.gp'}
          min={1}
          max={17}
          step={0.1}
          decimalPlacesMark={0}
          persist={persist('base', 'gp')}
          {...commonSliderProps}
        />
        <StatSlider
          label={'Targets per Game'}
          path={'recv.tgt'}
          min={0}
          max={15}
          step={0.1}
          persist={persist('recv', 'tgt')}
          {...commonSliderProps}
        />
        <StatSlider
          label={'Reception Percentage'}
          path={'recv.rec'}
          min={0}
          max={100}
          step={0.1}
          persist={persist('recv', 'rec')}
          {...commonSliderProps}
        />
        <StatSlider
          label={'Yards per Reception'}
          path={'recv.ypr'}
          min={0}
          max={20}
          step={0.1}
          persist={persist('recv', 'ypr')}
          {...commonSliderProps}
        />
        <StatSlider
          label={'Touchdown Percentage'}
          path={'recv.tdp'}
          min={0}
          max={15}
          step={0.1}
          persist={persist('recv', 'tdp')}
          {...commonSliderProps}
        />
      </>
    ),
    [StatType.RUSH]: (
      <>
        <StatSlider
          label={'Games Played'}
          path={'base.gp'}
          min={1}
          max={17}
          step={0.1}
          decimalPlacesMark={0}
          persist={persist('base', 'gp')}
          {...commonSliderProps}
        />
        <StatSlider
          label={'Carries per Game'}
          path={'rush.att'}
          min={0}
          max={25}
          step={0.1}
          persist={persist('rush', 'att')}
          {...commonSliderProps}
        />
        <StatSlider
          label={'Yards per Carry'}
          path={'rush.ypc'}
          min={1}
          max={7}
          step={0.1}
          persist={persist('rush', 'ypc')}
          {...commonSliderProps}
        />
        <StatSlider
          label={'Touchdown Percentage'}
          path={'rush.tdp'}
          min={0}
          max={20}
          step={0.1}
          persist={persist('rush', 'tdp')}
          {...commonSliderProps}
        />
      </>
    ),
  }[statType];

  return <Stack>{sliders}</Stack>;
}
