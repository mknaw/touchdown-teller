'use client';

import { useState } from 'react';

import _ from 'lodash';

import { Paper } from '@mui/material';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import Card from '@/components/Card';
import { Position, StatType } from '@/constants';
import AddPlayer from '@/features/teams/AddPlayer';
import { StatSliderPanel } from '@/features/teams/PlayerAccordion';
import { IdMap, PlayerSeason, PlayerWithExtras, TeamWithExtras } from '@/types';

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
  relevantPositions: Position[];
  seasons: IdMap<T>;
  initSeason: (player: PlayerWithExtras) => void;
  updateSeason: (season: T) => void;
  persistSeason: (season: T) => void;
  deleteSeason: (playerId: number) => void;
};

export default function PlayerPanel<T extends PlayerSeason>({
  team,
  statType,
  setStatType,
  relevantPositions,
  seasons,
  initSeason,
  updateSeason,
  persistSeason,
  deleteSeason,
}: PlayerPanelProps<T>) {
  const relevantPlayers = team.players.filter((player) =>
    relevantPositions.includes(player.position as Position)
  );
  let [stattedPlayers, nonStattedPlayers]: [
    stattedPlayers: PlayerWithExtras[],
    nonStattedPlayers: PlayerWithExtras[]
  ] = _.partition(relevantPlayers, (player: PlayerWithExtras) =>
    seasons.has(player.id)
  );
  stattedPlayers = stattedPlayers.sort((a, b) => a.adp - b.adp);
  //
  // TODO figure out how to initialize...
  // TODO here the redux would be good to pull up the last one
  const [selectedPlayer, setSelectedPlayer] = useState<
    PlayerWithExtras | undefined
  >(undefined);

  nonStattedPlayers = nonStattedPlayers.sort((a, b) => {
    const positionCmp =
      relevantPositions.indexOf(a.position as Position) -
      relevantPositions.indexOf(b.position as Position);
    const adpCmp = a.adp - b.adp;
    return positionCmp || adpCmp;
  });

  const addPlayer = (player: PlayerWithExtras) => {
    initSeason(player);
    setSelectedPlayer(player);
  };

  const season = selectedPlayer && seasons.get(selectedPlayer.id);

  return (
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
          <StatSliderPanel
            player={selectedPlayer}
            season={season}
            setSeason={updateSeason}
            persistSeason={persistSeason}
          />
        </Paper>
      )}
      {/* TODO would be nice here to preload some by default... */}
      {/* Maybe at least everyone whose ADP is <=100 */}
      {/* TODO double check these are ordered by ADP */}
      {/* stattedPlayers.map((player) => {
        const season = seasons.get(player.id);
        return (
          season && (
            <PlayerAccordion<T>
              key={player.id}
              player={player}
              season={season}
              setSeason={updateSeason}
              persistSeason={persistSeason}
              expanded={player.id == expandedPlayer}
              setExpanded={setExpandedPlayer}
              onDelete={deleteSeason}
            />
          )
        );
      }) */}
      <div className={'absolute bottom-5 left-5'}>
        <StatTypeToggleButton statType={statType} setStatType={setStatType} />
      </div>
      <div className={'absolute bottom-5 right-5'}>
        <AddPlayer players={nonStattedPlayers} addPlayer={addPlayer} />
      </div>
    </>
  );
}
