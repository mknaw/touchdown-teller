import React, { useEffect, useState } from 'react';

import { Player } from '@prisma/client';
import { useIndexedDBStore } from 'use-indexeddb';

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
import {
  PassProjection,
  RecvProjection,
  RushProjection,
  Share,
  defaultPassProjection,
  defaultRecvProjection,
  defaultRushProjection,
} from 'app/types';

const style = {
  position: 'absolute' as 'absolute',
  top: '33%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
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

interface ProjectionPanelProps<T> {
  playerId: number;
  storeKey: string;
  newDefault: (playerId: number) => T;
  stats: Partial<
    Record<keyof T, { getLabel: (projection: T) => string } & SliderProps>
  >;
}

// TODO probably should call this something else...
function ProjectionPanel<T>({
  playerId,
  storeKey,
  newDefault,
  stats,
}: ProjectionPanelProps<T>) {
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

  // Name font too small
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
          sx={{ fontWeight: 'bold' }}
        >
          {`${player.name} (${player.position})`}
        </Typography>
        {hasPassing && (
          <ProjectionPanel<PassProjection>
            playerId={player.id}
            storeKey={passProjectionKey}
            newDefault={defaultPassProjection}
            stats={{
              cmp: {
                getLabel: (p) => `Completion percentage: ${p.cmp}%`,
                step: 0.1,
              },
              ypa: {
                getLabel: (p) => `Yards per attempt: ${p.ypa}`,
                min: 1,
                max: 15,
                step: 0.1,
              },
              tdp: {
                getLabel: (p) => `Touchdown percentage: ${p.tdp}%`,
                step: 0.1,
              },
            }}
          />
        )}
        {hasRushing && (
          <ProjectionPanel<RushProjection>
            playerId={player.id}
            storeKey={rushProjectionKey}
            newDefault={defaultRushProjection}
            stats={{
              ypc: {
                getLabel: (p) => `Yards per carry: ${p.ypc}`,
                min: 1,
                max: 15,
              },
              tdp: {
                getLabel: (p) => `Touchdown percentage: ${p.tdp}%`,
                step: 0.1,
                min: 0,
                max: 25,
              },
            }}
          />
        )}
        {hasReceiving && (
          <ProjectionPanel<RecvProjection>
            playerId={player.id}
            storeKey={recvProjectionKey}
            newDefault={defaultRecvProjection}
            stats={{
              cmp: {
                getLabel: (p) => `Completion percentage: ${p.cmp}%`,
                step: 0.5,
              },
              ypr: {
                getLabel: (p) => `Yards per reception: ${p.ypr}`,
                min: 1,
                max: 15,
                step: 0.1,
              },
              tdp: {
                getLabel: (p) => `Touchdown percentage: ${p.tdp}%`,
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
