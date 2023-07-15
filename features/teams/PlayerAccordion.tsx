import { SyntheticEvent } from 'react';

import {
  PassStats,
  PlayerStats,
  PlayerWithExtras,
  RecvStats,
  SliderMarks,
  lastSeason,
} from '@/types';
import _ from 'lodash';

import DeleteIcon from '@mui/icons-material/Delete';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Icon } from '@mui/material';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Slider, { SliderProps } from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

function getMarks<T>(
  season: T,
  valueFn: (season: T) => number,
  labelFn: (value: number) => string
): SliderMarks {
  if (!season) {
    return [];
  }
  const value = valueFn(season);
  const label = `${lastSeason}: ${labelFn(value)}`;
  return [
    {
      label,
      value,
    },
  ];
}

type StatSliderProps = { label: string } & SliderProps;

function StatSlider({ label, ...props }: StatSliderProps) {
  return (
    <Box sx={{ width: 1 }}>
      <Typography>{label}</Typography>
      <Slider {...props} />
    </Box>
  );
}

type StatSliderPanelProps<T> = {
  player: PlayerWithExtras;
  stats: T;
  setStats: (stats: T) => void;
  persistStats: (stats: T) => void;
};

function StatSliderPanel<T extends PlayerStats>({
  player,
  stats,
  setStats,
  persistStats,
}: StatSliderPanelProps<T>) {
  // TODO this I think is also doable if you annotate as `keyof T` among keys
  // which are numbers...
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const makeNewStats = (field: string, value: any): T => {
    const cloned = _.cloneDeep(stats);
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
            persistStats(makeNewStats(field, value));
          } else {
            setStats(makeNewStats(field, value));
          }
        }
      };

  const getValue = (field: string) => {
    if (field in stats) {
      const value = stats[field as keyof typeof stats];
      if (typeof value === 'number') {
        return value;
      }
    }
    return 0;
  };

  const getCommonProps = (field: string) => {
    const value = getValue(field);
    const pct = stats.isPercentField(field) ? '%' : '';
    const label = `${stats.labelFor(field)}: ${value.toFixed(1)}${pct}`;
    return {
      value,
      label,
      onChange: onChange(field, false),
      onChangeCommitted: onChange(field, true),
      step: 0.1,
    };
  };

  let sliders;
  if (stats instanceof PassStats) {
    const season = player.passingSeasons[0];
    sliders = (
      <>
        <StatSlider
          min={1}
          max={17}
          marks={
            season &&
            getMarks(
              season,
              (s) => s.games,
              (v) => v.toFixed(0)
            )
          }
          {...getCommonProps('gp')}
        />
        <StatSlider
          min={15}
          max={50}
          marks={
            season &&
            getMarks(
              season,
              (s) => s.att / s.games,
              (v) => v.toFixed(1)
            )
          }
          {...getCommonProps('att')}
        />
        <StatSlider
          min={20}
          max={75}
          marks={
            season &&
            getMarks(
              season,
              (s) => 100 * (s.cmp / s.att),
              (v) => `${v.toFixed(1)}%`
            )
          }
          {...getCommonProps('cmp')}
        />
        <StatSlider
          min={1}
          max={15}
          marks={
            season &&
            getMarks(
              season,
              (s) => s.yds / s.att,
              (v) => v.toFixed(1)
            )
          }
          {...getCommonProps('ypa')}
        />
        <StatSlider
          min={0}
          max={15}
          marks={
            season &&
            getMarks(
              season,
              (s) => 100 * (s.td / s.att),
              (v) => `${v.toFixed(1)}%`
            )
          }
          {...getCommonProps('tdp')}
        />
      </>
    );
  } else if (stats instanceof RecvStats) {
    sliders = (
      <>
        <StatSlider min={1} max={17} {...getCommonProps('gp')} />
        <StatSlider {...getCommonProps('tgt')} />
        <StatSlider {...getCommonProps('rec')} />
        <StatSlider {...getCommonProps('ypr')} />
        <StatSlider {...getCommonProps('tdp')} />
      </>
    );
  } else {
    sliders = (
      <>
        <StatSlider min={1} max={17} {...getCommonProps('gp')} />
        <StatSlider {...getCommonProps('att')} />
        <StatSlider {...getCommonProps('ypc')} />
        <StatSlider {...getCommonProps('tdp')} />
      </>
    );
  }

  return <Stack>{sliders}</Stack>;
}

export default function PlayerAccordion<T extends PlayerStats>({
  player,
  stats,
  setStats,
  persistStats,
  expanded,
  setExpanded,
  onDelete,
}: {
  player: PlayerWithExtras;
  stats: T;
  setStats: (stats: T) => void;
  persistStats: (stats: T) => void;
  expanded: boolean;
  setExpanded: (playerId: number | null) => void;
  onDelete: (playerId: number) => void;
}) {
  if (stats instanceof PassStats) {
    console.log(stats.cmp);
  }
  return (
    <Stack className={'w-full mb-5'}>
      {/* TODO elevation, hover styles */}
      <Accordion
        expanded={expanded}
        onChange={(_, e) => setExpanded(e ? player.id : null)}
        className={'px-3'}
      >
        <AccordionSummary>
          <Box className={'w-full flex justify-space items-center'}>
            <Typography
              className={'text-xl'}
            >{`${player.name} (${player.position})`}</Typography>
          </Box>
          <Icon className={'align-baseline'}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </Icon>
        </AccordionSummary>
        <AccordionDetails>
          <StatSliderPanel
            player={player}
            stats={stats}
            setStats={setStats}
            persistStats={persistStats}
          />
          <Box className={'flex justify-end'}>
            <IconButton onClick={() => onDelete(player.id)}>
              <DeleteIcon />
            </IconButton>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Stack>
  );
}
