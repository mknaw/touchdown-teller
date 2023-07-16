'use client';

import { useState } from 'react';

import _ from 'lodash';

import { Player } from '@prisma/client';

import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { Position, StatType } from '@/constants';
import AddPlayer from '@/features/teams/AddPlayer';
import PlayerAccordion from '@/features/teams/PlayerAccordion';
import { PlayerSeason, PlayerWithExtras, TeamWithExtras } from '@/types';

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

// TODO dedupe
type SeasonMap<T extends PlayerSeason> = Map<number, T>;

type PlayerPanelProps<T extends PlayerSeason> = {
  team: TeamWithExtras;
  statType: StatType;
  setStatType: (s: StatType) => void;
  relevantPositions: Position[];
  seasons: SeasonMap<T>;
  initSeason: (player: Player) => void;
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
  const [expandedPlayer, setExpandedPlayer] = useState<number | null>(null);

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
  nonStattedPlayers = nonStattedPlayers.sort((a, b) => {
    const positionCmp =
      relevantPositions.indexOf(a.position as Position) -
      relevantPositions.indexOf(b.position as Position);
    const adpCmp = a.adp - b.adp;
    return positionCmp || adpCmp;
  });

  return (
    <>
      {/* TODO would be nice here to preload some by default... */}
      {/* Maybe at least everyone whose ADP is <=100 */}
      {/* TODO double check these are ordered by ADP */}
      {stattedPlayers.map((player) => {
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
      })}
      <div className={'absolute bottom-5 left-5'}>
        <StatTypeToggleButton statType={statType} setStatType={setStatType} />
      </div>
      <div className={'absolute bottom-5 right-5'}>
        <AddPlayer players={nonStattedPlayers} addPlayer={initSeason} />
      </div>
    </>
  );
}
