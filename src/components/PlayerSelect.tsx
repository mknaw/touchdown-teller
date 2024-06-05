import _ from 'lodash';

import { Player } from '@prisma/client';

import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';

export default function PlayerSelect({
  selectedPlayer,
  setSelectedPlayer,
  stattedPlayers,
  setIsAddPlayerOpen,
}: {
  selectedPlayer: Player | undefined;
  setSelectedPlayer: (p: Player | undefined) => void;
  stattedPlayers: Player[];
  setIsAddPlayerOpen: (isOpen: boolean) => void;
}) {
  return (
    <Select
      className={'w-full text-center text-2xl mb-8'}
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
      <MenuItem value={''} onClick={() => setIsAddPlayerOpen(true)}>
        Add Player
      </MenuItem>
    </Select>
  );
}
