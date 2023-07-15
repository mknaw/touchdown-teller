'use client';

import { useEffect, useState } from 'react';

import _ from 'lodash';
import { useIndexedDBStore } from 'use-indexeddb';

import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import AddPlayer from '@/features/teams/AddPlayer';
import PlayerAccordion from '@/features/teams/PlayerAccordion';
import { StorageKey, setupPersistence } from '@/pages/data/persistence';
import {
  PlayerStatConstructable,
  PlayerStatData,
  PlayerStats,
  PlayerWithExtras,
  Position,
  StatType,
  TeamWithExtras,
  createPlayerStats,
} from '@/types';
import { setOnClone } from '@/utils';

function getRelevantPositions(statType: StatType): Position[] {
  switch (statType) {
  case StatType.PASS:
    return [Position.QB];
  case StatType.RECV:
    return [Position.WR, Position.TE, Position.RB];
  default: // Rushing
    return [Position.RB, Position.QB, Position.WR];
  }
}

function getStorageKey(statType: StatType): StorageKey {
  switch (statType) {
  case StatType.PASS:
    return StorageKey.PASS;
  case StatType.RECV:
    return StorageKey.RECV;
  default: // Rushing
    return StorageKey.RUSH;
  }
}

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

type PlayerPanelProps<T extends PlayerStats> = {
  team: TeamWithExtras;
  statType: StatType;
  setStatType: (s: StatType) => void;
  constructor: PlayerStatConstructable<T>;
  toStoreData: (s: T) => PlayerStatData<T>;
};

export default function PlayerPanel<T extends PlayerStats>({
  team,
  statType,
  setStatType,
  constructor,
  toStoreData,
}: PlayerPanelProps<T>) {
  const [expandedPlayer, setExpandedPlayer] = useState<number | null>(null);
  const [stats, setStats] = useState<Map<number, T>>(new Map());

  const storageKey = getStorageKey(statType);
  const playerStore = useIndexedDBStore<PlayerStatData<T>>(storageKey);
  const relevantPositions = getRelevantPositions(statType);
  const relevantPlayers = team.players.filter((player) =>
    relevantPositions.includes(player.position as Position)
  );
  let [stattedPlayers, nonStattedPlayers]: [
    stattedPlayers: PlayerWithExtras[],
    nonStattedPlayers: PlayerWithExtras[]
  ] = _.partition(relevantPlayers, (player: PlayerWithExtras) =>
    stats.has(player.id)
  );
  stattedPlayers = stattedPlayers.sort((a, b) => a.adp - b.adp);
  nonStattedPlayers = nonStattedPlayers.sort((a, b) => {
    const positionCmp =
      relevantPositions.indexOf(a.position as Position) -
      relevantPositions.indexOf(b.position as Position);
    const adpCmp = a.adp - b.adp;
    return positionCmp || adpCmp;
  });

  // TODO wonder if should memoize these instead of refreshing all the time
  // not sure how `setupPersistence` plays into that.
  useEffect(() => {
    setupPersistence().then(() => {
      const promises = relevantPlayers.map((player) =>
        playerStore.getByID(player.id)
      );
      Promise.all(promises).then((data) => {
        data.filter(Boolean).map((d) => createPlayerStats(constructor, d));
        setStats(
          new Map(
            (data.filter((s) => s) as PlayerStatData<T>[])
              .map((d) => createPlayerStats(constructor, d))
              .map((p) => [p.id, p])
          )
        );
      });
    });
  }, [statType]);

  const addPlayer = (playerId: number) => {
    const playerStats = constructor.default(playerId);
    playerStore
      .add(toStoreData(playerStats), playerId)
      // TODO would prefer to render optimistically and resolve failure
      // but that could be more complicated... for later
      .then(() => {
        setStats((stats) => setOnClone(stats, playerId, playerStats));
      })
      .catch(alert);
  };

  const updateStats = (playerStats: T) => {
    setStats((stats) => setOnClone(stats, playerStats.id, playerStats));
  };

  const persistStats = (stats: T) => {
    updateStats(stats);
    playerStore.update(toStoreData(stats), stats.id);
  };

  const deletePlayer = (playerId: number) => {
    setStats((stats) => {
      stats.delete(playerId);
      return stats;
    });
    playerStore.deleteByID(playerId);
  };

  return (
    <>
      {/* TODO would be nice here to preload some by default... */}
      {/* Maybe at least everyone whose ADP is <=100 */}
      {/* TODO double check these are ordered by ADP */}
      {stattedPlayers.map((player) => {
        const playerStats = stats.get(player.id);
        return (
          playerStats && (
            <PlayerAccordion<T>
              key={player.id}
              player={player}
              stats={playerStats}
              setStats={updateStats}
              persistStats={persistStats}
              expanded={player.id == expandedPlayer}
              setExpanded={setExpandedPlayer}
              onDelete={deletePlayer}
            />
          )
        );
      })}
      <div className={'absolute bottom-5 left-5'}>
        <StatTypeToggleButton statType={statType} setStatType={setStatType} />
      </div>
      <div className={'absolute bottom-5 right-5'}>
        <AddPlayer players={nonStattedPlayers} addPlayer={addPlayer} />
      </div>
    </>
  );
}
