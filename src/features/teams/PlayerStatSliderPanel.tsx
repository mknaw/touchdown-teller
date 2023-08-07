import { SyntheticEvent } from 'react';

import _ from 'lodash';

import Stack from '@mui/material/Stack';

import LabeledSlider from '@/components/LabeledSlider';
import { lastYear } from '@/constants';
import { PassSeason, RecvSeason, RushSeason } from '@/models/PlayerSeason';
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

  const getValue = (field: keyof T) => {
    if (field in season) {
      const value = season[field as keyof typeof season];
      if (typeof value === 'number') {
        return value;
      }
    }
    return 0;
  };

  const getCommonProps = (field: keyof T) => {
    const value = getValue(field);
    const pct = season.isPercentField(field as string) ? '%' : '';
    const label = `${season.labelFor(field as string)}: ${value.toFixed(
      1
    )}${pct}`;
    return {
      value,
      label,
      onChange: onChange(field, false),
      onChangeCommitted: onChange(field, true),
      step: 0.1,
    };
  };

  // TODO these marks don't look good when they're on the far end -
  // like 0 tds, 17 games played ...
  let sliders;
  if (season instanceof PassSeason) {
    // Appease the type-checker...
    const ps = pastSeason as PassSeason;
    sliders = (
      <>
        <LabeledSlider
          min={1}
          max={17}
          marks={ps && makeMarks(ps.gp, (v) => v.toFixed(0))}
          {...getCommonProps('gp')}
        />
        <LabeledSlider
          min={15}
          max={50}
          marks={ps && makeMarks(ps.att, (v) => v.toFixed(1))}
          {...getCommonProps('att' as keyof T)}
        />
        <LabeledSlider
          min={20}
          max={75}
          marks={ps && makeMarks(ps.cmp, (v) => `${v.toFixed(1)}%`)}
          {...getCommonProps('cmp' as keyof T)}
        />
        <LabeledSlider
          min={1}
          max={15}
          marks={ps && makeMarks(ps.ypa, (v) => v.toFixed(1))}
          {...getCommonProps('ypa' as keyof T)}
        />
        <LabeledSlider
          min={0}
          max={15}
          marks={ps && makeMarks(ps.tdp, (v) => `${v.toFixed(1)}%`)}
          {...getCommonProps('tdp' as keyof T)}
        />
      </>
    );
  } else if (season instanceof RecvSeason) {
    const ps = pastSeason as RecvSeason;
    sliders = (
      <>
        <LabeledSlider
          min={1}
          max={17}
          marks={ps && makeMarks(ps.gp, (v) => v.toFixed(0))}
          {...getCommonProps('gp')}
        />
        <LabeledSlider
          min={0}
          max={15}
          marks={ps && makeMarks(ps.tgt, (v) => v.toFixed(0))}
          {...getCommonProps('tgt' as keyof T)}
        />
        <LabeledSlider
          min={0}
          max={100}
          marks={ps && makeMarks(ps.rec, (v) => `${v.toFixed(1)}%`)}
          {...getCommonProps('rec' as keyof T)}
        />
        <LabeledSlider
          min={0}
          max={20}
          marks={ps && makeMarks(ps.ypr, (v) => v.toFixed(1))}
          {...getCommonProps('ypr' as keyof T)}
        />
        <LabeledSlider
          min={0}
          max={15}
          marks={ps && makeMarks(ps.tdp, (v) => `${v.toFixed(1)}%`)}
          {...getCommonProps('tdp')}
        />
      </>
    );
  } else {
    const ps = pastSeason as RushSeason;
    sliders = (
      <>
        <LabeledSlider
          min={1}
          max={17}
          marks={ps && makeMarks(ps.gp, (v) => v.toFixed(0))}
          {...getCommonProps('gp')}
        />
        <LabeledSlider
          min={0}
          max={25}
          marks={ps && makeMarks(ps.att, (v) => v.toFixed(0))}
          {...getCommonProps('att' as keyof T)}
        />
        <LabeledSlider
          min={1}
          max={7}
          marks={ps && makeMarks(ps.ypc, (v) => v.toFixed(1))}
          {...getCommonProps('ypc' as keyof T)}
        />
        <LabeledSlider
          min={0}
          max={100}
          marks={ps && makeMarks(ps.tdp, (v) => `${v.toFixed(1)}%`)}
          {...getCommonProps('tdp' as keyof T)}
        />
      </>
    );
  }

  return <Stack>{sliders}</Stack>;
}
