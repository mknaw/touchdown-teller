import { useEffect, useState } from 'react';

import classNames from 'classnames';
import { useIndexedDBStore } from 'use-indexeddb';

import { Player, Team } from '@prisma/client';

import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { setupPersistence } from 'app/data/persistence';
import { titleFont } from 'app/theme/fonts';
import { Position, Share, TeamKey, lastSeason } from 'app/types';

interface PlayerPoolProps {
  players: Player[];
  addPlayerShare: (playerId: number) => void;
}

const PlayerPool = ({ players, addPlayerShare }: PlayerPoolProps) => {
  const handleChange = (event: SelectChangeEvent) => {
    const value = event.target.value as string;
    if (value) {
      const playerId = parseInt(event.target.value as string);
      addPlayerShare(playerId);
    }
  };

  return (
    <Select sx={{ width: 1 }} value={''} onChange={handleChange}>
      {players.map((player) => (
        <MenuItem
          key={player.id}
          value={player.id}
        >{`${player.name} (${player.position})`}</MenuItem>
      ))}
    </Select>
  );
};

function shareValueText(value: number) {
  return `${Math.floor(value)}%`;
}

interface ShareSliderProps {
  share: number;
  player: Player;
  attempts: number;
  onChange: (value: number) => void;
  onChangeCommitted: (value: number) => void;
  onRemove: () => void;
  setPlayerId: (playerId: number | null) => void;
  lastSeasonShare: number | undefined;
}

const ShareSlider = ({
  share,
  player,
  attempts,
  onChange,
  onChangeCommitted,
  onRemove,
  setPlayerId,
  lastSeasonShare,
}: ShareSliderProps) => {
  const playerAttempts = Math.floor(attempts * (share / 100));
  const marks = lastSeasonShare
    ? [
      {
        label: `${lastSeason}: ${(100 * lastSeasonShare).toFixed(1)}%`,
        value: 100 * lastSeasonShare,
      },
    ]
    : undefined;
  return (
    <Stack justifyContent='center' className={'w-full pb-5'}>
      <Typography
        onClick={() => setPlayerId(player.id)}
        sx={{ cursor: 'pointer' }}
      >
        {`${player.name} (${player.position}): ${playerAttempts}`}
      </Typography>
      <Stack direction='row' alignItems='center' sx={{ width: 1 }}>
        <Slider
          value={share || 0}
          marks={marks}
          step={1}
          onChange={(_, value) => onChange(value as number)}
          onChangeCommitted={(_, value) => onChangeCommitted(value as number)}
          valueLabelDisplay='auto'
          getAriaValueText={shareValueText}
          valueLabelFormat={shareValueText}
          sx={{
            // TODO should be getting these from theme!
            '& .MuiSlider-rail': {
              backgroundImage: 'linear-gradient(.25turn, #504a6f, #716b90)',
            },
            '& .MuiSlider-track': {
              backgroundImage: 'linear-gradient(.25turn, #504a6f, #716b90)',
            },
            '& .MuiSlider-thumb': {
              '&:hover': {
                boxShadow: '0 0 20px 8px white',
              },
              '&.Mui-focusVisible': {
                boxShadow: '0 0 8px white',
              },
            },
          }}
        />
        <IconButton aria-label='delete' color='primary' onClick={onRemove}>
          <RemoveCircleIcon />
        </IconButton>
      </Stack>
    </Stack>
  );
};

interface SharePanelProps {
  team: Team;
  label: string;
  attempts: number;
  players: Map<number, Player>;
  positions: Position[];
  storageKey: string; // TODO should be a type or enum.
  lastSeasonShares: Map<number, number>;
  setPlayerId: (playerId: number | null) => void;
}

export default function SharePanel({
  team,
  label,
  attempts,
  players,
  positions,
  storageKey,
  lastSeasonShares,
  setPlayerId,
}: SharePanelProps) {
  const playerStore = useIndexedDBStore<Share>(storageKey);

  useEffect(() => {
    setupPersistence().then(() => {
      playerStore.getManyByKey('team', team.key).then((data) => {
        let shares = new Map(data.map((p) => [p.id, p.share]));
        shares = balance(shares);
        setShares(shares);
      });
    });
  }, [players, playerStore]);

  const [shares, setShares] = useState<Map<number, number>>(new Map());

  const balance = (s: Map<number, number>) => {
    const valueSum = sumValues(s);
    if (valueSum > 100) {
      const scale = 100 / valueSum;
      for (const [key, value] of s) {
        s.set(key, value * scale);
      }
    }
    return s;
  };

  const sumValues = (s: Map<number, number>) =>
    [...s.values()].reduce((sum, v) => sum + v, 0);

  const addPlayerShare = (id: number) => {
    const newShares = new Map(shares);
    newShares.set(id, 0);
    setShares(newShares);
    playerStore.add({ id, team: team.key as TeamKey, share: 0 }, id);
  };

  const setPlayerShare = (id: number, share: number) => {
    const newShares = new Map(shares);
    newShares.set(id, share);
    const valueSum = sumValues(newShares);
    if (valueSum > 100) {
      const scale = (100 - share) / (valueSum - share);
      for (const [key, value] of newShares) {
        if (key != id) {
          newShares.set(key, value * scale);
        }
      }
    }
    setShares(newShares);
  };

  const persistPlayerShare = (id: number, share: number) => {
    const newShares = new Map(shares);
    newShares.set(id, share);
    setShares(newShares);
    playerStore.update({ id, team: team.key as TeamKey, share }, id);
  };

  const removePlayerShare = (id: number) => {
    const newShares = new Map(shares);
    newShares.delete(id);
    setShares(newShares);
    playerStore.deleteByID(id);
  };

  const sortPlayers = (a: Player, b: Player) => {
    const positionCmp =
      positions.indexOf(a.position as Position) -
      positions.indexOf(b.position as Position);
    const adpCmp = a.adp - b.adp;
    return positionCmp || adpCmp;
  };

  const selectablePlayers = Array.from(players.values())
    .filter(
      (p) => !shares.has(p.id) && positions.includes(p.position as Position)
    )
    .sort(sortPlayers);

  const remaining = 100 - sumValues(shares);
  const remainingAttempts = Math.floor(attempts * (remaining / 100));

  return (
    <Stack sx={{ height: 1 }}>
      <Box className={'mb-4'}>
        <Typography className={classNames('text-xl', titleFont.className)}>
          {`Projected ${label} Attempts: ${attempts.toFixed()}`}
        </Typography>
      </Box>
      {shares.size > 0 && (
        <Stack sx={{ width: 1 }}>
          {[...shares.entries()]
            .sort((a, b) => {
              const playerA = players.get(a[0])!;
              const playerB = players.get(b[0])!;
              return sortPlayers(playerA, playerB);
            })
            .map(([id, share]) => (
              <ShareSlider
                key={id}
                player={players.get(id)!}
                share={share}
                attempts={attempts}
                onChange={(value) => setPlayerShare(id, value)}
                onChangeCommitted={(value) => persistPlayerShare(id, value)}
                onRemove={() => removePlayerShare(id)}
                setPlayerId={setPlayerId}
                lastSeasonShare={lastSeasonShares.get(id)}
              />
            ))}
        </Stack>
      )}
      <Box>
        <Typography>{`Remaining: ${remainingAttempts}`}</Typography>
        <Slider
          sx={{
            cursor: 'default',
            '& .MuiSlider-thumb': {
              display: 'none',
            },
          }}
          value={remaining}
        />
      </Box>
      {selectablePlayers.length > 0 && (
        <PlayerPool
          players={selectablePlayers}
          addPlayerShare={addPlayerShare}
        />
      )}
    </Stack>
  );
}
