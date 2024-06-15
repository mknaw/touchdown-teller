import { useSelector } from 'react-redux';

import _ from 'lodash';

import Stack from '@mui/material/Stack';

import LabeledSlider, { LabeledSliderProps } from '@/components/LabeledSlider';
import { StatType, lastYear } from '@/constants';
import { LastSeason } from '@/models/PlayerSeason';
import { AppState, useAppDispatch } from '@/store';
import {
  PlayerProjectionsStore,
  persistPlayerProjections,
  setPlayerSeason,
} from '@/store/playerProjectionSlice';
import { SliderMarks } from '@/types';

function makeMarks(
  value: number | undefined,
  labelFn: (value: number) => string
): SliderMarks {
  if (value === undefined) return [];
  const label = `${lastYear}: ${labelFn(value)}`;
  return [
    {
      label,
      value,
    },
  ];
}

const StatSlider = ({
  playerId,
  path,
  label,
  lastSeason,
  decimalPlaces = 0,
  ...props
}: Exclude<LabeledSliderProps, 'value'> & {
  playerId: number;
  path: string;
  lastSeason?: LastSeason;
  decimalPlaces?: number;
}) => {
  const dispatch = useAppDispatch();

  const { projections } = useSelector<AppState, PlayerProjectionsStore>(
    (state) => state.playerProjections
  );
  const projection = projections[playerId];

  if (!projection) {
    // Shouldn't happen.
    return null;
  }

  const onChange = (persist: boolean, field: string, value: any) => {
    const updated = {
      [playerId]: _.set(_.cloneDeep(projections[playerId]), field, value),
    };
    persist
      ? dispatch(persistPlayerProjections(updated))
      : dispatch(setPlayerSeason(updated));
  };

  const value = _.get(projection, path) as number;

  const isPercent = label.toLowerCase().includes('percent');

  return (
    <LabeledSlider
      value={value}
      onChange={(_, v) => onChange(false, path, v)}
      onChangeCommitted={(_, v) => onChange(true, path, v)}
      marks={makeMarks(lastSeason && _.get(lastSeason, path), (v) =>
        v.toFixed(decimalPlaces)
      )}
      label={`${label}: ${value}${isPercent ? '%' : ''}`}
      {...props}
    />
  );
};

export default function PlayerStatSliderPanel({
  statType,
  playerId,
  lastSeason,
}: {
  statType: StatType;
  playerId: number;
  lastSeason?: LastSeason;
}) {
  const commonProps = {
    playerId,
    lastSeason,
  };
  // TODO these marks don't look good when they're on the far end -
  // like 0 tds, 17 games played ...
  const sliders = {
    // Appease the type-checker...
    [StatType.PASS]: (
      <>
        <StatSlider
          label={'Games Played'}
          path={'base.gp'}
          min={1}
          max={17}
          step={0.1}
          {...commonProps}
        />
        <StatSlider
          label={'Attempts per Game'}
          path={'pass.att'}
          min={15}
          max={50}
          step={0.1}
          {...commonProps}
        />
        <StatSlider
          label={'Completion Percentage'}
          path={'pass.cmp'}
          min={20}
          max={75}
          step={0.1}
          {...commonProps}
        />
        <StatSlider
          label={'Yards per Attempt'}
          path={'pass.ypa'}
          min={1}
          max={15}
          step={0.1}
          {...commonProps}
        />
        <StatSlider
          label={'Touchdown Percentage'}
          path={'pass.tdp'}
          min={0}
          max={20}
          step={0.1}
          {...commonProps}
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
          {...commonProps}
        />
        <StatSlider
          label={'Targets per Game'}
          path={'recv.tgt'}
          min={0}
          max={15}
          step={0.1}
          {...commonProps}
        />
        <StatSlider
          label={'Reception Percentage'}
          path={'recv.rec'}
          min={0}
          max={100}
          step={0.1}
          {...commonProps}
        />
        <StatSlider
          label={'Yards per Reception'}
          path={'recv.ypr'}
          min={0}
          max={20}
          {...commonProps}
        />
        <StatSlider
          label={'Touchdown Percentage'}
          path={'recv.tdp'}
          min={0}
          max={15}
          {...commonProps}
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
          {...commonProps}
        />
        <StatSlider
          label={'Carries per Game'}
          path={'rush.att'}
          min={0}
          max={25}
          step={0.1}
          {...commonProps}
        />
        <StatSlider
          label={'Yards per Carry'}
          path={'rush.ypc'}
          min={1}
          max={7}
          step={0.1}
          {...commonProps}
        />
        <StatSlider
          label={'Touchdown Percentage'}
          path={'rush.tdp'}
          min={0}
          max={20}
          {...commonProps}
        />
      </>
    ),
  }[statType];

  return <Stack>{sliders}</Stack>;
}
