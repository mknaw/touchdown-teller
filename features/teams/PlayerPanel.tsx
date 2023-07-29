'use client';

import { useEffect } from 'react';

import _ from 'lodash';

import { Player } from '@prisma/client';

import DeleteIcon from '@mui/icons-material/Delete';
import { IconButton, Paper } from '@mui/material';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';

import { Position, StatType } from '@/constants';
import AddPlayer from '@/features/teams/AddPlayer';
import PlayerStatSliderPanel from '@/features/teams/PlayerStatSliderPanel';
import { IdMap, PlayerSeason, TeamWithExtras } from '@/types';

const StatTypeToggleButton = ({
  statType,
  setStatType,
}: {
  statType: StatType;
  setStatType: (s: StatType) => void;
}) => (
  <ToggleButtonGroup
    color='primary'
    value={statType}
    exclusive
    onChange={(_e, v) => v && setStatType(v)}
  >
    <ToggleButton value={StatType.PASS}>Passing</ToggleButton>
    <ToggleButton value={StatType.RECV}>Receiving</ToggleButton>
    <ToggleButton value={StatType.RUSH}>Rushing</ToggleButton>
  </ToggleButtonGroup>
);

type PlayerPanelProps<T extends PlayerSeason> = {
  team: TeamWithExtras;
  statType: StatType;
  setStatType: (s: StatType) => void;
  selectedPlayer: Player | undefined;
  setSelectedPlayer: (p: Player | undefined) => void;
  relevantPositions: Position[];
  seasons: IdMap<T>;
  pastSeasons: IdMap<T>;
  initSeason: (player: Player) => void;
  updateSeason: (season: T) => void;
  persistSeason: (season: T) => void;
  deleteSeason: (playerId: number) => void;
};

export default function PlayerPanel<T extends PlayerSeason>({
  team,
  statType,
  setStatType,
  selectedPlayer,
  setSelectedPlayer,
  relevantPositions,
  seasons,
  pastSeasons,
  initSeason,
  updateSeason,
  persistSeason,
  deleteSeason,
}: PlayerPanelProps<T>) {
  const relevantPlayers = team.players
    .filter((player) => relevantPositions.includes(player.position as Position))
    .sort((a, b) => {
      const positionCmp =
        relevantPositions.indexOf(a.position as Position) -
        relevantPositions.indexOf(b.position as Position);
      const adpCmp = (a.adp || 10000) - (b.adp || 10000);
      return positionCmp || adpCmp;
    });

  const [stattedPlayers, nonStattedPlayers]: [
    stattedPlayers: Player[],
    nonStattedPlayers: Player[]
  ] = _.partition(relevantPlayers, (player: Player) => seasons.has(player.id));

  // TODO this is broken now
  // Initialize `select` value.
  // TODO here it would be good to pull up last selected from redux.
  useEffect(() => {
    !selectedPlayer &&
      stattedPlayers.length &&
      setSelectedPlayer(stattedPlayers[0]);
  }, [stattedPlayers]);

  const addPlayer = (player: Player) => {
    initSeason(player);
    setSelectedPlayer(player);
  };

  const season = selectedPlayer && seasons.get(selectedPlayer.id);

  return (
    <>
      {/* TODO would be nice here to preload some by default... */}
      {/* Maybe at least everyone whose ADP is <=100 */}
      {stattedPlayers.length ? (
        <>
          <Select
            className={'w-full text-center text-2xl'}
            value={selectedPlayer ? `${selectedPlayer.id}` : ''}
            onChange={(event: SelectChangeEvent) => {
              setSelectedPlayer(
                _.find(stattedPlayers, { id: parseInt(event.target.value) })
              );
            }}
          >
            {stattedPlayers.map((player) => (
              // TODO group by position.
              <MenuItem key={player.id} value={player.id}>
                {`${player.name} (${player.position})`}
              </MenuItem>
            ))}
          </Select>
          {season && (
            <Paper className={'my-8 p-8'}>
              <PlayerStatSliderPanel
                season={season}
                pastSeason={pastSeasons.get(selectedPlayer.id)}
                setSeason={updateSeason}
                persistSeason={persistSeason}
              />
              <div className={'flex justify-end w-full'}>
                <IconButton
                  onClick={() => {
                    deleteSeason(selectedPlayer.id);
                    setSelectedPlayer(undefined);
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </div>
            </Paper>
          )}
        </>
      ) : (
        <Typography>Click to add player (TODO)</Typography>
      )}
      <div className={'absolute bottom-5 left-5'}>
        <StatTypeToggleButton statType={statType} setStatType={setStatType} />
      </div>
      <div className={'absolute bottom-5 right-5'}>
        <AddPlayer players={nonStattedPlayers} addPlayer={addPlayer} />
      </div>
    </>
  );
}
