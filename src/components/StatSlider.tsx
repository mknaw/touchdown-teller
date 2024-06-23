import _ from 'lodash';

import LabeledSlider, { LabeledSliderProps } from '@/components/LabeledSlider';
import { lastYear } from '@/constants';
import { SliderMarks } from '@/types';

const getDecimalPlaces = (num: number) => {
  if (!isFinite(num)) return 0; // Handle non-finite numbers
  if (Math.floor(num) === num) return 0; // Handle integers

  const numStr = num.toString();
  const parts = numStr.split('.');
  return parts.length > 1 ? parts[1].length : 0;
};

const makeMarks = (
  value: number | undefined,
  labelFn: (value: number) => string
): SliderMarks => {
  if (value === undefined) return [];
  const label = `${lastYear}: ${labelFn(value)}`;
  return [
    {
      label,
      value,
    },
  ];
};

// Slider with some common features to "stats" of players and teams.
export default function StatSlider<T extends object>({
  current,
  path,
  persist,
  set,
  label,
  previous,
  step,
  decimalPlacesMark,
  ...props
}: Exclude<LabeledSliderProps, 'value'> & {
  current: T;
  path: string;
  persist: (mutated: T) => any;
  set: (mutated: T) => any;
  step: number;
  previous?: T;
  decimalPlacesMark?: number;
}) {
  const onChange = (shouldPersist: boolean, value: any) => {
    const mutated = _.cloneDeep(current);
    _.set(mutated, path, value);
    shouldPersist ? persist(mutated) : set(mutated);
  };

  const value = _.get(current, path) as number;

  const isPercent = label.toLowerCase().includes('percent');
  const decimalPlaces = getDecimalPlaces(step);

  return (
    <LabeledSlider
      value={value}
      onChange={(_, v) => onChange(false, v)}
      onChangeCommitted={(_, v) => onChange(true, v)}
      label={`${label}: ${value.toFixed(decimalPlaces)}${isPercent ? '%' : ''}`}
      marks={makeMarks(previous && _.get(previous, path), (v) =>
        v.toFixed(
          decimalPlacesMark === undefined ? decimalPlaces : decimalPlacesMark
        )
      )}
      step={step}
      {...props}
    />
  );
}
