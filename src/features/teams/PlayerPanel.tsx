import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import _ from 'lodash';

import { Player } from '@prisma/client';

import DeleteIcon from '@mui/icons-material/Delete';
import { IconButton, Paper } from '@mui/material';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';

import PlayerSelect from '@/components/PlayerSelect';
import { Position, StatType } from '@/constants';
import AddPlayer from '@/features/teams/AddPlayer';
import PlayerStatSliderPanel from '@/features/teams/PlayerStatSliderPanel';
import { PassSeason, RecvSeason, RushSeason } from '@/models/PlayerSeason';
import { setStatType } from '@/store/settingsSlice';
import { IdMap, PlayerSeason, TeamWithExtras } from '@/types';

function SeasonSummary<T extends PlayerSeason>({ season }: { season: T }) {
  const labelledStats: string[] = [];
  if (season instanceof PassSeason) {
    const annualized = season.annualize();
    labelledStats.push(
      `${annualized.att.toFixed(0)} attempts`,
      `${annualized.yds.toFixed(0)} yards`,
      `${annualized.tds.toFixed(0)} TDs`
    );
  } else if (season instanceof RecvSeason) {
    const annualized = season.annualize();
    labelledStats.push(
      `${annualized.tgt.toFixed(0)} targets`,
      `${annualized.rec.toFixed(0)} receptions`,
      `${annualized.yds.toFixed(0)} yards`,
      `${annualized.tds.toFixed(0)} TDs`
    );
  } else if (season instanceof RushSeason) {
    const annualized = season.annualize();
    labelledStats.push(
      `${annualized.att.toFixed(0)} carries`,
      `${annualized.yds.toFixed(0)} yards`,
      `${annualized.tds.toFixed(0)} TDs`
    );
  }
  return <Typography>{labelledStats.join(' / ')}</Typography>;
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

type PlayerPanelProps<T extends PlayerSeason> = {
  team: TeamWithExtras;
  statType: StatType;
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
  const dispatch = useDispatch();
  const onStatTypeChange = (statType: StatType) => {
    dispatch(setStatType(statType));
    setSelectedPlayer(undefined);
  };

  const [isAddPlayerOpen, setIsAddPlayerOpen] =
    useState<boolean>(false);

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
    <div className={'flex h-full flex-col justify-between gap-5'}>
      {/* TODO would be nice here to preload some by default... */}
      {/* Maybe at least everyone whose ADP is <=100 */}
      {stattedPlayers.length ? (
        <div>
          <PlayerSelect
            selectedPlayer={selectedPlayer}
            setSelectedPlayer={setSelectedPlayer}
            stattedPlayers={stattedPlayers}
            setIsAddPlayerOpen={setIsAddPlayerOpen}
          />
          {season && (
            <>
              <Paper className={'p-8'}>
                <PlayerStatSliderPanel
                  season={season}
                  pastSeason={pastSeasons.get(selectedPlayer.id)}
                  setSeason={updateSeason}
                  persistSeason={persistSeason}
                />
                {/* TODO style this better */}
                <div className={'flex w-full justify-center items-center pt-5'}>
                  <SeasonSummary season={season} />
                  <IconButton
                    onClick={() => {
                      deleteSeason(selectedPlayer.id);
                      setSelectedPlayer(undefined);
                    }}
                    sx={{
                      // Nasty hack since I haven't reconciled tailwind properly
                      position: 'absolute',
                    }}
                    className={'right-0 -translate-x-full'}
                  >
                    <DeleteIcon />
                  </IconButton>
                </div>
              </Paper>
            </>
          )}
        </div>
      ) : (
        <div className={'flex w-full-col justify-center items-center py-5'}>
          <Typography
            variant='h5'
            onClick={() => setIsAddPlayerOpen(true)}
            className={'cursor-pointer'}
          >
            Add player
          </Typography>
        </div>
      )}

      <AddPlayer
        players={nonStattedPlayers}
        addPlayer={addPlayer}
        isOpen={isAddPlayerOpen}
        setIsOpen={setIsAddPlayerOpen}
      />

      <div className={'flex flex-row justify-start'}>
        <StatTypeToggleButton
          statType={statType}
          setStatType={onStatTypeChange}
        />
      </div>
    </div>
  );
}
