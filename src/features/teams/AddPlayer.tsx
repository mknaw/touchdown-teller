import { Player } from '@prisma/client';

import { ClickAwayListener } from '@mui/base/ClickAwayListener';
import { Typography } from '@mui/material';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';

import Card from '@/components/Card';

export default function AddPlayer({
  players,
  addPlayer,
  isOpen,
  setIsOpen,
}: {
  players: Player[];
  addPlayer: (player: Player) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}) {
  if (isOpen) {
    return (
      // TODO probably should save this backdrop incantation somewhere ...
      // TODO maybe the blur should be over everything? not just that one panel?
      <div
        className={
          'absolute z-50 inset-0 backdrop-blur-sm backdrop-brightness-[.35] backdrop-saturate-[.25]'
        }
      >
        <ClickAwayListener onClickAway={() => setIsOpen(false)}>
          <div>
            <Card className={'absolute z-50 inset-16 p-8'}>
              <Typography variant='h5'>Add Player</Typography>
              {/* TODO might want to make this scrollable or rearrange, for extreme cases */}
              <List className={'relative'}>
                {players.map((player) => (
                  <ListItem key={player.id} className={'py-0'}>
                    <ListItemButton
                      className={'py-0'}
                      onClick={() => {
                        addPlayer(player);
                        setIsOpen(false);
                      }}
                    >
                      <ListItemText>
                        {`${player.name} (${player.position})`}
                      </ListItemText>
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Card>
          </div>
        </ClickAwayListener>
      </div>
    );
  }
  return null;
}
