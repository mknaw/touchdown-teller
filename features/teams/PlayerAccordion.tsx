import { SyntheticEvent } from 'react';

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
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import LabeledSlider from '@/components/LabeledSlider';
import { lastYear } from '@/constants';
import { PassSeason, RecvSeason } from '@/models/PlayerSeason';
import { PlayerSeason, PlayerWithExtras, SliderMarks } from '@/types';

function getMarks<T>(
  season: T,
  valueFn: (season: T) => number,
  labelFn: (value: number) => string
): SliderMarks {
  if (!season) {
    return [];
  }
  const value = valueFn(season);
  const label = `${lastYear}: ${labelFn(value)}`;
  return [
    {
      label,
      value,
    },
  ];
}

type StatSliderPanelProps<T> = {
  player: PlayerWithExtras;
  season: T;
  setSeason: (stats: T) => void;
  persistSeason: (stats: T) => void;
};

function StatSliderPanel<T extends PlayerSeason>({
  player,
  season,
  setSeason,
  persistSeason,
}: StatSliderPanelProps<T>) {
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

  // TODO these marks don't look correct when they're on the far end - like 0 tds
  let sliders;
  if (season instanceof PassSeason) {
    const lastSeason = player.passSeasons[0];
    sliders = (
      <>
        <LabeledSlider
          min={1}
          max={17}
          marks={
            lastSeason &&
            getMarks(
              lastSeason,
              (s) => s.games,
              (v) => v.toFixed(0)
            )
          }
          {...getCommonProps('gp')}
        />
        <LabeledSlider
          min={15}
          max={50}
          marks={
            lastSeason &&
            getMarks(
              lastSeason,
              (s) => s.att / s.games,
              (v) => v.toFixed(1)
            )
          }
          {...getCommonProps('att')}
        />
        <LabeledSlider
          min={20}
          max={75}
          marks={
            lastSeason &&
            getMarks(
              lastSeason,
              (s) => 100 * (s.cmp / s.att),
              (v) => `${v.toFixed(1)}%`
            )
          }
          {...getCommonProps('cmp')}
        />
        <LabeledSlider
          min={1}
          max={15}
          marks={
            lastSeason &&
            getMarks(
              lastSeason,
              (s) => s.yds / s.att,
              (v) => v.toFixed(1)
            )
          }
          {...getCommonProps('ypa')}
        />
        <LabeledSlider
          min={0}
          max={15}
          marks={
            lastSeason &&
            getMarks(
              lastSeason,
              (s) => 100 * (s.tds / s.att),
              (v) => `${v.toFixed(1)}%`
            )
          }
          {...getCommonProps('tdp')}
        />
      </>
    );
  } else if (season instanceof RecvSeason) {
    const lastSeason = player.recvSeasons[0];
    sliders = (
      <>
        <LabeledSlider
          min={1}
          max={17}
          marks={
            lastSeason &&
            getMarks(
              lastSeason,
              (s) => s.games,
              (v) => v.toFixed(0)
            )
          }
          {...getCommonProps('gp')}
        />
        <LabeledSlider
          min={0}
          max={15}
          marks={
            lastSeason &&
            getMarks(
              lastSeason,
              (s) => s.tgt / s.games,
              (v) => v.toFixed(1)
            )
          }
          {...getCommonProps('tgt')}
        />
        <LabeledSlider
          min={0}
          max={100}
          marks={
            lastSeason &&
            getMarks(
              lastSeason,
              (s) => 100 * (s.rec / s.tgt),
              (v) => v.toFixed(1)
            )
          }
          {...getCommonProps('rec')}
        />
        <LabeledSlider
          min={0}
          max={20}
          marks={
            lastSeason &&
            getMarks(
              lastSeason,
              (s) => s.yds / s.rec,
              (v) => v.toFixed(1)
            )
          }
          {...getCommonProps('ypr')}
        />
        <LabeledSlider
          min={0}
          max={15}
          marks={
            lastSeason &&
            getMarks(
              lastSeason,
              (s) => 100 * (s.tds / s.rec),
              (v) => v.toFixed(1)
            )
          }
          {...getCommonProps('tdp')}
        />
      </>
    );
  } else {
    const lastSeason = player.rushSeasons[0];
    sliders = (
      <>
        <LabeledSlider
          min={1}
          max={17}
          marks={
            lastSeason &&
            getMarks(
              lastSeason,
              (s) => s.games,
              (v) => v.toFixed(0)
            )
          }
          {...getCommonProps('gp')}
        />
        <LabeledSlider
          min={0}
          max={25}
          marks={
            lastSeason &&
            getMarks(
              lastSeason,
              (s) => s.att / s.games,
              (v) => v.toFixed(1)
            )
          }
          {...getCommonProps('att')}
        />
        <LabeledSlider
          min={1}
          max={7}
          marks={
            lastSeason &&
            getMarks(
              lastSeason,
              (s) => s.yds / s.att,
              (v) => v.toFixed(1)
            )
          }
          {...getCommonProps('ypc')}
        />
        <LabeledSlider
          min={0}
          max={100}
          marks={
            lastSeason &&
            getMarks(
              lastSeason,
              (s) => 100 * (s.tds / s.att),
              (v) => v.toFixed(1)
            )
          }
          {...getCommonProps('tdp')}
        />
      </>
    );
  }

  return <Stack>{sliders}</Stack>;
}

export default function PlayerAccordion<T extends PlayerSeason>({
  player,
  season,
  setSeason,
  persistSeason,
  expanded,
  setExpanded,
  onDelete,
}: {
  player: PlayerWithExtras;
  season: T;
  setSeason: (stats: T) => void;
  persistSeason: (stats: T) => void;
  expanded: boolean;
  setExpanded: (playerId: number | null) => void;
  onDelete: (playerId: number) => void;
}) {
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
          <Icon>
            {expanded ? (
              <ExpandLessIcon className={'align-baseline'} />
            ) : (
              <ExpandMoreIcon className={'align-baseline'} />
            )}
          </Icon>
        </AccordionSummary>
        <AccordionDetails>
          <StatSliderPanel
            player={player}
            season={season}
            setSeason={setSeason}
            persistSeason={persistSeason}
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
