import { useState } from 'react';

import { Player } from '@prisma/client';

import ClickAwayListener from '@mui/base/ClickAwayListener';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import Fab from '@mui/material/Fab';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Popover from '@mui/material/Popover';

export default function AddPlayer({
  players,
  addPlayer,
}: {
  players: Player[];
  addPlayer: (player: Player) => void;
}) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handlePopoverOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  return (
    <ClickAwayListener onClickAway={handlePopoverClose}>
      <div>
        <Fab
          color='primary'
          onClick={handlePopoverOpen}
          sx={{ backgroundColor: 'transparent', zIndex: 20 }}
        >
          <AddCircleIcon />
        </Fab>
        {/* TODO might want to make this scrollable or rearrange, for extreme cases */}
        <Popover
          id='mouse-over-popover'
          open={open}
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          onClose={handlePopoverClose}
          disableRestoreFocus
          className={'-translate-y-5'}
        >
          <List>
            {players.map((player) => (
              <ListItem key={player.id} className={'py-0'}>
                <ListItemButton
                  className={'py-0'}
                  onClick={() => {
                    addPlayer(player);
                    handlePopoverClose();
                  }}
                >
                  <ListItemText>
                    {`${player.name} (${player.position})`}
                  </ListItemText>
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Popover>
      </div>
    </ClickAwayListener>
  );
}
