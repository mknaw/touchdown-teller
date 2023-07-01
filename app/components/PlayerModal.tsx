import React, { useEffect, useState } from 'react';

import classNames from 'classnames';
import { useIndexedDBStore } from 'use-indexeddb';

import { Player } from '@prisma/client';

import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import Slider, { SliderProps } from '@mui/material/Slider';
import Typography from '@mui/material/Typography';

import {
  passProjectionKey,
  passShareKey,
  recvProjectionKey,
  recvShareKey,
  rushProjectionKey,
  rushShareKey,
  setupPersistence,
} from 'app/data/persistence';
import { poppins_400 } from 'app/theme/fonts';
import {
  PassProjection,
  RecvProjection,
  RushProjection,
  Share,
  defaultPassProjection,
  defaultRecvProjection,
  defaultRushProjection,
  lastSeason,
} from 'app/types';
import {
  getPassCmp,
  getPassTdp,
  getPassYpa,
  getRecvCmp,
  getRecvTdp,
  getRecvYpr,
  getRushTdp,
  getRushYpc,
} from 'app/utils/stats';

const style = {
  position: 'absolute' as 'absolute',
  top: '33%',
  left: '50%',
  transform: 'translate(-50%, -40%)',
  width: 600,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

type ProjectionSliderProps = { label: string } & SliderProps;

function ProjectionSlider({ label, ...props }: ProjectionSliderProps) {
  return (
    <Box sx={{ width: 1 }}>
      <Typography>{label}</Typography>
      <Slider {...props} />
    </Box>
  );
}

interface PlayerStatPanelProps<T> {
  playerId: number;
  storeKey: string;
  newDefault: (playerId: number) => T;
  stats: Partial<
    Record<keyof T, { getLabel: (projection: T) => string } & SliderProps>
  >;
}

function PlayerStatPanel<T>({
  playerId,
  storeKey,
  newDefault,
  stats,
}: PlayerStatPanelProps<T>) {
  const projectionStore = useIndexedDBStore<T>(storeKey);
  const [projection, setProjection] = useState<T | null>(null);

  useEffect(() => {
    projectionStore.getByID(playerId).then((projection) => {
      if (projection) {
        setProjection(projection);
      } else {
        const newProjection = newDefault(playerId);
        setProjection(newProjection);
        projectionStore.add(newProjection, playerId);
      }
    });
  }, []);

  const onChange =
    (field: keyof T) => (_event: any, value: number | number[]) => {
      if (!!projection && typeof value === 'number') {
        setProjection({
          ...projection,
          [field]: value,
        });
      }
    };

  const persist = () => {
    if (!!projection) {
      projectionStore.update(projection, playerId);
    }
  };

  return (
    projection && (
      <>
        {(
          Object.entries(stats) as [
            keyof T,
            { getLabel: (projection: T) => string } & SliderProps
          ][]
        ).map(([field, { getLabel, ...props }]) => (
          <ProjectionSlider
            key={field as string}
            label={getLabel(projection)}
            value={(projection[field] as number) || 0}
            onChange={onChange(field)}
            onChangeCommitted={persist}
            {...props}
          />
        ))}
      </>
    )
  );
}

type Marks = Array<{ label?: string; value: number }>;

function getMarks<T>(
  season: T,
  valueFn: (season: T) => number,
  labelFn: (value: number) => string
): Marks {
  if (!season) {
    return [];
  }
  const value = valueFn(season);
  const label = labelFn(value);
  return [
    {
      label,
      value,
    },
  ];
}

function getPctMarks<T>(season: T, valueFn: (season: T) => number): Marks {
  return getMarks(
    season,
    valueFn,
    (value) => `${lastSeason}: ${value.toFixed(1)}%`
  );
}

function getScalarMarks<T>(season: T, valueFn: (season: T) => number): Marks {
  return getMarks(
    season,
    valueFn,
    (value) => `${lastSeason}: ${value.toFixed(1)}`
  );
}

interface PlayerModalProps {
  player: Player;
  onClose: () => void;
}

export default function PlayerModal({ player, onClose }: PlayerModalProps) {
  const passShareStore = useIndexedDBStore<Share>(passShareKey);
  const rushShareStore = useIndexedDBStore<Share>(rushShareKey);
  const recvShareStore = useIndexedDBStore<Share>(recvShareKey);

  useEffect(() => {
    setupPersistence().then(() => {
      passShareStore.getByID(player.id).then((share) => setHasPassing(!!share));
      rushShareStore.getByID(player.id).then((share) => setHasRushing(!!share));
      recvShareStore
        .getByID(player.id)
        .then((share) => setHasReceiving(!!share));
    });
  }, []);

  const [hasPassing, setHasPassing] = useState(false);
  const [hasRushing, setHasRushing] = useState(false);
  const [hasReceiving, setHasReceiving] = useState(false);

  const passingSeason =
    hasPassing && player.passing_season ? player.passing_season[0] : null;

  const rushingSeason =
    hasRushing && player.rushing_season ? player.rushing_season[0] : null;

  const receivingSeason =
    hasReceiving && player.receiving_season ? player.receiving_season[0] : null;

  console.log(player);

  return (
    <Modal
      open={true}
      onClose={onClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box sx={style}>
        <Typography
          id="modal-modal-title"
          variant="h6"
          component="h2"
          className={classNames('text-3xl mb-5', poppins_400.className)}
        >
          {`${player.name} (${player.position})`}
        </Typography>
        {hasPassing && (
          <PlayerStatPanel<PassProjection>
            playerId={player.id}
            storeKey={passProjectionKey}
            newDefault={defaultPassProjection}
            stats={{
              cmp: {
                getLabel: (p) => `Completion percentage: ${p.cmp}%`,
                marks: getPctMarks(passingSeason, getPassCmp),
                step: 0.1,
              },
              ypa: {
                getLabel: (p) => `Yards per attempt: ${p.ypa}`,
                marks: getScalarMarks(passingSeason, getPassYpa),
                step: 0.1,
                min: 1,
                max: 15,
              },
              tdp: {
                getLabel: (p) => `Touchdown percentage: ${p.tdp}%`,
                marks: getPctMarks(passingSeason, getPassTdp),
                step: 0.1,
                min: 1,
                max: 15,
              },
            }}
          />
        )}
        {hasRushing && (
          <PlayerStatPanel<RushProjection>
            playerId={player.id}
            storeKey={rushProjectionKey}
            newDefault={defaultRushProjection}
            stats={{
              ypc: {
                getLabel: (p) => `Yards per carry: ${p.ypc}`,
                marks: getScalarMarks(rushingSeason, getRushYpc),
                min: 1,
                max: 15,
              },
              tdp: {
                getLabel: (p) => `Touchdown percentage: ${p.tdp}%`,
                marks: getPctMarks(rushingSeason, getRushTdp),
                step: 0.1,
                min: 0,
                max: 25,
              },
            }}
          />
        )}
        {hasReceiving && (
          <PlayerStatPanel<RecvProjection>
            playerId={player.id}
            storeKey={recvProjectionKey}
            newDefault={defaultRecvProjection}
            stats={{
              cmp: {
                getLabel: (p) => `Completion percentage: ${p.cmp}%`,
                marks: getPctMarks(receivingSeason, getRecvCmp),
                step: 0.5,
              },
              ypr: {
                getLabel: (p) => `Yards per reception: ${p.ypr}`,
                marks: getScalarMarks(receivingSeason, getRecvYpr),
                min: 1,
                max: 15,
                step: 0.1,
              },
              tdp: {
                getLabel: (p) => `Touchdown percentage: ${p.tdp}%`,
                marks: getPctMarks(receivingSeason, getRecvTdp),
                step: 0.1,
                min: 0,
                max: 25,
              },
            }}
          />
        )}
      </Box>
    </Modal>
  );
}