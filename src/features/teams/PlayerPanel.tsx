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
import { Position, StatType, TeamKey } from '@/constants';
import AddPlayer from '@/features/teams/AddPlayer';
import PlayerStatSliderPanel from '@/features/teams/PlayerStatSliderPanel';
import {
  PlayerProjections,
  annualizePassSeason,
  annualizeRecvSeason,
  annualizeRushSeason,
  extractSeasons,
  mkDefaultBase,
  mkDefaultPassSeason,
  mkDefaultRecvSeason,
  mkDefaultRushSeason,
} from '@/models/PlayerSeason';
import { useAppDispatch } from '@/store';
import {
  deletePlayerSeason,
  persistPlayerProjection,
} from '@/store/playerProjectionSlice';
import { setStatType } from '@/store/settingsSlice';
import { PlayerSeason, TeamWithExtras } from '@/types';
import { toEnumValue } from '@/utils';

function SeasonSummary({ gp, season }: { gp: number; season: PlayerSeason }) {
  const labelledStats: string[] = [];
  // TODO maybe try a tagged enum thing.
  if ('ypa' in season) {
    const annualized = annualizePassSeason(season, gp);
    labelledStats.push(
      `${annualized.att.toFixed(0)} attempts`,
      `${annualized.yds.toFixed(0)} yards`,
      `${annualized.tds.toFixed(0)} TDs`
    );
  } else if ('tgt' in season) {
    const annualized = annualizeRecvSeason(season, gp);
    labelledStats.push(
      `${annualized.tgt.toFixed(0)} targets`,
      `${annualized.rec.toFixed(0)} receptions`,
      `${annualized.yds.toFixed(0)} yards`,
      `${annualized.tds.toFixed(0)} TDs`
    );
  } else {
    const annualized = annualizeRushSeason(season, gp);
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
  setSelectedPlayer, // TODO even this may be better thrown in redux...
}: {
  statType: StatType;
  setSelectedPlayer: (p: Player | undefined) => void;
}) => {
  const dispatch = useDispatch();

  const onChange = (statType: StatType) => {
    dispatch(setStatType(statType));
    setSelectedPlayer(undefined);
  };

  return (
    <ToggleButtonGroup
      color='primary'
      value={statType}
      exclusive
      onChange={(_e, v) => v && onChange(v)}
    >
      <ToggleButton value={StatType.PASS}>Passing</ToggleButton>
      <ToggleButton value={StatType.RECV}>Receiving</ToggleButton>
      <ToggleButton value={StatType.RUSH}>Rushing</ToggleButton>
    </ToggleButtonGroup>
  );
};

export default function PlayerPanel({
  team,
  statType,
  selectedPlayer,
  setSelectedPlayer,
  relevantPositions,
  projections,
  lastSeasons,
}: {
  team: TeamWithExtras;
  statType: StatType;
  selectedPlayer: Player | undefined;
  setSelectedPlayer: (p: Player | undefined) => void;
  relevantPositions: Position[];
  projections: PlayerProjections;
  lastSeasons: PlayerProjections;
}) {
  const dispatch = useAppDispatch();

  const mkDefault = {
    [StatType.PASS]: mkDefaultPassSeason,
    [StatType.RECV]: mkDefaultRecvSeason,
    [StatType.RUSH]: mkDefaultRushSeason,
  }[statType];

  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState<boolean>(false);

  const relevantPlayers = team.players
    .filter((player) => relevantPositions.includes(player.position as Position))
    .sort((a, b) => {
      const positionCmp =
        relevantPositions.indexOf(a.position as Position) -
        relevantPositions.indexOf(b.position as Position);
      const adpCmp = (a.adp || 10000) - (b.adp || 10000);
      return positionCmp || adpCmp;
    });

  const seasons = extractSeasons(statType, projections);

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
    const lastSeason = lastSeasons[player.id];
    let base =
      projections[player.id]?.base ??
      lastSeason?.base ??
      mkDefaultBase(player, team.key as TeamKey);
    // TODO this is not very elegant...
    _.set(base, 'team', toEnumValue(TeamKey, player.teamName as string));
    //  TOOD would be better to explicitly `pick` the keys of `season`.
    // TODO why did we even need `team.key` here...? Indexing I guess?
    let season =
      _.cloneDeep(lastSeason?.[statType]) ??
      mkDefault(player, team.key as TeamKey);
    // TODO !!!
    // season = ensureValid(season, projection);
    // Presumably could not have been null to get this far.
    // TODO still probably could do better to handle mid season switches...
    // and / or reseting the client DB if a player changes teams...
    _.set(season, 'team', toEnumValue(TeamKey, player.teamName as string));

    dispatch(
      persistPlayerProjection({
        id: player.id,
        base,
        [statType]: season,
      })
    ).then(() => setSelectedPlayer(player));
  };

  const onDeleteIconClick = () => {
    dispatch(
      deletePlayerSeason({ playerId: selectedPlayer!.id, statType })
    ).then(() => setSelectedPlayer(undefined));
  };

  const projection = selectedPlayer && projections[selectedPlayer.id];
  // TODO SeasonSummary also should just take `projection`.
  const base = projection?.base;
  const season = projection?.[statType];

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
          {selectedPlayer && base && season && (
            <>
              <Paper className={'p-8'}>
                <PlayerStatSliderPanel
                  statType={statType}
                  playerId={selectedPlayer.id}
                  lastSeasons={lastSeasons}
                />
                {/* TODO style this better */}
                <div className={'flex w-full justify-center items-center pt-5'}>
                  {/* TODO kind of silly to pass it playerId given it's not really needed */}
                  {/* but was momentarily expedient from a TS perspective. */}
                  <SeasonSummary
                    gp={base.gp}
                    season={{ playerId: selectedPlayer.id, ...season }}
                  />
                  <IconButton
                    onClick={onDeleteIconClick}
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
          setSelectedPlayer={setSelectedPlayer}
        />
      </div>
    </div>
  );
}
