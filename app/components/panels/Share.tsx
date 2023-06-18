import { useEffect, useState } from 'react';
import { Player } from '@prisma/client';
import { useIndexedDBStore } from 'use-indexeddb';

import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Slider from '@mui/material/Slider';
import Typography from '@mui/material/Typography';

import { setupPersistence } from 'app/data/persistence';
import { Share, Position, TeamKey } from 'app/types';

interface AddPlayerButtonProps {
    players: Player[];
    addPlayerShare: (playerId: number) => void;
}

const AddPlayerButton = ({ players, addPlayerShare }: AddPlayerButtonProps) => {
    const [selected, setSelected] = useState<string>('');

    const handleChange = (event: SelectChangeEvent) => {
        setSelected(event.target.value as string);
    };

    const addPlayer = () => selected && addPlayerShare(parseInt(selected));

    return (
        <Stack direction="row" alignItems="center" sx={{ width: 1 }}>
            <Select sx={{ width: 1 }} value={selected} onChange={handleChange}>
                {players.map(player => (
                    <MenuItem
                        key={player.id}
                        value={player.id}
                    >{`${player.name} (${player.position})`}</MenuItem>
                ))}
            </Select>
            <Box>
                <IconButton
                    aria-label="add"
                    color="primary"
                    onClick={addPlayer}
                >
                    <AddCircleIcon />
                </IconButton>
            </Box>
        </Stack>
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
}

const ShareSlider = ({
    share,
    player,
    attempts,
    onChange,
    onChangeCommitted,
    onRemove,
    setPlayerId,
}: ShareSliderProps) => {
    const playerAttempts = Math.floor(attempts * (share / 100));
    return (
        <Stack justifyContent="center" sx={{ width: 1 }}>
            <Typography
                onClick={() => setPlayerId(player.id)}
                sx={{ cursor: 'pointer' }}
            >
                {`${player.name} (${player.position}): ${playerAttempts}`}
            </Typography>
            <Stack direction="row" alignItems="center" sx={{ width: 1 }}>
                <Slider
                    value={share || 0}
                    step={1}
                    onChange={(_, value) => onChange(value as number)}
                    onChangeCommitted={(_, value) =>
                        onChangeCommitted(value as number)
                    }
                    valueLabelDisplay="auto"
                    getAriaValueText={shareValueText}
                    valueLabelFormat={shareValueText}
                />
                <IconButton
                    aria-label="delete"
                    color="primary"
                    onClick={onRemove}
                >
                    <RemoveCircleIcon />
                </IconButton>
            </Stack>
        </Stack>
    );
};

interface SharePanelProps {
    team: TeamKey;
    label: string;
    attempts: number;
    players: Map<number, Player>;
    positions: Position[];
    storageKey: string; // TODO should be a type or enum.
    setPlayerId: (playerId: number | null) => void;
}

export default function SharePanel({
    team,
    label,
    attempts,
    players,
    positions,
    storageKey,
    setPlayerId,
}: SharePanelProps) {
    const playerStore = useIndexedDBStore<Share>(storageKey);

    useEffect(() => {
        setupPersistence().then(() => {
            playerStore.getManyByKey('team', team).then(data => {
                let shares = new Map(data.map(p => [p.id, p.share]));
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
            for (let [key, value] of s) {
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
        playerStore.add({ id, team, share: 0 }, id).catch(_ => {});
    };

    const setPlayerShare = (id: number, share: number) => {
        const newShares = new Map(shares);
        newShares.set(id, share);
        const valueSum = sumValues(newShares);
        if (valueSum > 100) {
            const scale = (100 - share) / (valueSum - share);
            for (let [key, value] of newShares) {
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
        playerStore.update({ id, team, share }, id);
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
            p => !shares.has(p.id) && positions.includes(p.position as Position)
        )
        .sort(sortPlayers);

    const remaining = 100 - sumValues(shares);
    const remainingAttempts = Math.floor(attempts * (remaining / 100));

    return (
        <Stack sx={{ height: 1 }}>
            <Box className={'mb-4'}>
                <Typography className={'text-xl font-semibold'}>
                    {`Projected ${label} Attempts: ${attempts}`}
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
                                onChange={value => setPlayerShare(id, value)}
                                onChangeCommitted={value =>
                                    persistPlayerShare(id, value)
                                }
                                onRemove={() => removePlayerShare(id)}
                                setPlayerId={setPlayerId}
                            />
                        ))}
                </Stack>
            )}
            <Box>
                <Typography>{`Remaining: ${remainingAttempts}`}</Typography>
                <Slider value={remaining} />
            </Box>
            {selectablePlayers.length > 0 && (
                <AddPlayerButton
                    players={selectablePlayers}
                    addPlayerShare={addPlayerShare}
                />
            )}
        </Stack>
    );
}
