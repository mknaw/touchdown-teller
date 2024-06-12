import { SyntheticEvent } from 'react';

import _ from 'lodash';

import Stack from '@mui/material/Stack';

import LabeledSlider from '@/components/LabeledSlider';
import { lastYear } from '@/constants';
import { PlayerSeason, SliderMarks } from '@/types';

function makeMarks(
  value: number,
  labelFn: (value: number) => string
): SliderMarks {
  const label = `${lastYear}: ${labelFn(value)}`;
  return [
    {
      label,
      value,
    },
  ];
}

type PlayerStatSliderPanelProps<T> = {
  season: T;
  pastSeason: T | undefined;
  setSeason: (stats: T) => void;
  persistSeason: (stats: T, field: keyof T) => void;
};

export default function PlayerStatSliderPanel<T extends PlayerSeason>({
  season,
  pastSeason,
  setSeason,
  persistSeason,
}: PlayerStatSliderPanelProps<T>) {
  // TODO this I think is also doable if you annotate as `keyof T` among keys
  // which are numbers...
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const makeNewStats = (field: keyof T, value: any): T => {
    const cloned = _.cloneDeep(season);
    if (field in cloned) {
      cloned[field] = value;
    }
    return cloned;
  };

  const onChange =
    (field: keyof T, persist: boolean) =>
    (
      _event: Event | SyntheticEvent<Element, Event>,
      value: number | number[]
    ) => {
      if (typeof value === 'number') {
        if (persist) {
          persistSeason(makeNewStats(field, value), field);
        } else {
          setSeason(makeNewStats(field, value));
        }
      }
    };

  const getValue = (field: keyof T): number => {
    if (field in season) {
      const value = season[field as keyof typeof season];
      if (typeof value === 'number') {
        return value;
      }
    }
    return 0;
  };

  const mkLabel = (
    field: keyof T,
    label: string,
    isPercentField: boolean
  ): string =>
    `${label}: ${getValue(field).toFixed(1)}${isPercentField ? '%' : ''}`;

  const getCommonProps = (field: keyof T) => {
    return {
      value: getValue(field),
      onChange: onChange(field, false),
      onChangeCommitted: onChange(field, true),
      step: 0.1,
    };
  };

  // TODO these marks don't look good when they're on the far end -
  // like 0 tds, 17 games played ...
  let sliders;
  if ('ypa' in season) {
    // Appease the type-checker...
    sliders = (
      <>
        {/*
        <LabeledSlider
          min={1}
          max={17}
          marks={ps && makeMarks(ps.gp, (v) => v.toFixed(0))}
          {...getCommonProps('gp')}
        />
        */}
        <LabeledSlider
          min={15}
          max={50}
          marks={makeMarks(season.att, (v) => v.toFixed(1))}
          label={mkLabel('att' as keyof T, 'Attempts per Game', false)}
          {...getCommonProps('att' as keyof T)}
        />
        <LabeledSlider
          min={20}
          max={75}
          marks={makeMarks(season.cmp, (v) => `${v.toFixed(1)}%`)}
          label={mkLabel('cmp' as keyof T, 'Completion Percentage', true)}
          {...getCommonProps('cmp' as keyof T)}
        />
        <LabeledSlider
          min={1}
          max={15}
          marks={makeMarks(season.ypa, (v) => v.toFixed(1))}
          label={mkLabel('ypa' as keyof T, 'Yards per Attempt', false)}
          {...getCommonProps('ypa' as keyof T)}
        />
        <LabeledSlider
          min={0}
          max={20}
          marks={makeMarks(season.tdp, (v) => `${v.toFixed(1)}%`)}
          label={mkLabel('tdp' as keyof T, 'Touchdown Percentage', true)}
          {...getCommonProps('tdp' as keyof T)}
        />
      </>
    );
  } else if ('tgt' in season) {
    sliders = (
      <>
        {/*
        <LabeledSlider
          min={1}
          max={17}
          marks={ps && makeMarks(ps.gp, (v) => v.toFixed(0))}
          {...getCommonProps('gp')}
        />
        */}
        <LabeledSlider
          min={0}
          max={15}
          marks={makeMarks(season.tgt, (v) => v.toFixed(0))}
          label={mkLabel('tgt' as keyof T, 'Targets per Game', false)}
          {...getCommonProps('tgt' as keyof T)}
        />
        <LabeledSlider
          min={0}
          max={100}
          marks={makeMarks(season.rec, (v) => `${v.toFixed(1)}%`)}
          label={mkLabel('rec' as keyof T, 'Reception Percentage', true)}
          {...getCommonProps('rec' as keyof T)}
        />
        <LabeledSlider
          min={0}
          max={20}
          marks={makeMarks(season.ypr, (v) => v.toFixed(1))}
          label={mkLabel('ypr' as keyof T, 'Yards per Reception', false)}
          {...getCommonProps('ypr' as keyof T)}
        />
        <LabeledSlider
          min={0}
          max={15}
          marks={makeMarks(season.tdp, (v) => `${v.toFixed(1)}%`)}
          label={mkLabel('tdp' as keyof T, 'Touchdown Percentage', true)}
          {...getCommonProps('tdp')}
        />
      </>
    );
  } else {
    sliders = (
      <>
        {/*
        <LabeledSlider
          min={1}
          max={17}
          marks={ps && makeMarks(ps.gp, (v) => v.toFixed(0))}
          {...getCommonProps('gp')}
        />
        */}
        <LabeledSlider
          min={0}
          max={25}
          marks={makeMarks(season.att, (v) => v.toFixed(0))}
          label={mkLabel('att' as keyof T, 'Carries per Game', false)}
          {...getCommonProps('att' as keyof T)}
        />
        <LabeledSlider
          min={1}
          max={7}
          marks={makeMarks(season.ypc, (v) => v.toFixed(1))}
          // TODO kinda inconsistent with "attempts" before but "carries" here.
          label={mkLabel('ypc' as keyof T, 'Yards per Carry', false)}
          {...getCommonProps('ypc' as keyof T)}
        />
        <LabeledSlider
          min={0}
          max={20}
          marks={makeMarks(season.tdp, (v) => `${v.toFixed(1)}%`)}
          label={mkLabel('tdp' as keyof T, 'Touchdown Percentage', true)}
          {...getCommonProps('tdp' as keyof T)}
        />
      </>
    );
  }

  return <Stack>{sliders}</Stack>;
}
