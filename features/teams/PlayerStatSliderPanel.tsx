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
  persistSeason: (stats: T) => void;
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
  const makeNewStats = (field: string, value: any): T => {
    const cloned = _.cloneDeep(season);
    if (field in cloned) {
      // TODO I don't think calling it `as keyof T` is the 100% correct TS way
      // to achieve this, but also not sure how else to do it.
      cloned[field as keyof T] = value;
    }
    return cloned;
  };

  const onChange =
    (field: string, persist: boolean) =>
      (
        _event: Event | SyntheticEvent<Element, Event>,
        value: number | number[]
      ) => {
        if (typeof value === 'number') {
          if (persist) {
            persistSeason(makeNewStats(field, value));
          } else {
            setSeason(makeNewStats(field, value));
          }
        }
      };

  const getValue = (field: string) => {
    if (field in season) {
      const value = season[field as keyof typeof season];
      if (typeof value === 'number') {
        return value;
      }
    }
    return 0;
  };

  const getCommonProps = (field: string) => {
    const value = getValue(field);
    const pct = season.isPercentField(field) ? '%' : '';
    const label = `${season.labelFor(field)}: ${value.toFixed(1)}${pct}`;
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
          {...getCommonProps('att')}
        />
        <LabeledSlider
          min={20}
          max={75}
          marks={ps && makeMarks(ps.cmp, (v) => `${v.toFixed(1)}%`)}
          {...getCommonProps('cmp')}
        />
        <LabeledSlider
          min={1}
          max={15}
          marks={ps && makeMarks(ps.ypa, (v) => v.toFixed(1))}
          {...getCommonProps('ypa')}
        />
        <LabeledSlider
          min={0}
          max={15}
          marks={ps && makeMarks(ps.tdp, (v) => `${v.toFixed(1)}%`)}
          {...getCommonProps('tdp')}
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
          {...getCommonProps('tgt')}
        />
        <LabeledSlider
          min={0}
          max={100}
          marks={ps && makeMarks(ps.rec, (v) => `${v.toFixed(1)}%`)}
          {...getCommonProps('rec')}
        />
        <LabeledSlider
          min={0}
          max={20}
          marks={ps && makeMarks(ps.ypr, (v) => v.toFixed(1))}
          {...getCommonProps('ypr')}
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
          {...getCommonProps('att')}
        />
        <LabeledSlider
          min={1}
          max={7}
          marks={ps && makeMarks(ps.ypc, (v) => v.toFixed(1))}
          {...getCommonProps('ypc')}
        />
        <LabeledSlider
          min={0}
          max={100}
          marks={ps && makeMarks(ps.tdp, (v) => `${v.toFixed(1)}%`)}
          {...getCommonProps('tdp')}
        />
      </>
    );
  }

  return <Stack>{sliders}</Stack>;
}
