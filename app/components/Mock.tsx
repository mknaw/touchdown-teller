'use client';

import { useState } from 'react';

//import { lastSeason } from '../types';
import ClickAwayListener from '@mui/base/ClickAwayListener';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Popover from '@mui/material/Popover';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';

import Card from 'app/components/Card';
import DoughnutChart from 'app/components/DoughnutChart';
import HorizontalChart from 'app/components/HorizontalChart';

function PlayerPassingPanel() {
  return (
    <Stack>
      <Box>
        <Typography>Games played</Typography>
        <Slider />
      </Box>
      <Box>
        <Typography>Targets per game</Typography>
        <Slider />
      </Box>
      <Box>
        <Typography>Completion percentage</Typography>
        <Slider />
      </Box>
      <Box>
        <Typography>Yards per reception</Typography>
        <Slider />
      </Box>
      <Box>
        <Typography>Touchdown percentage</Typography>
        <Slider />
      </Box>
    </Stack>
  );
}

function PlayerPanel({
  name,
  expanded,
  setExpanded,
}: {
  name: string;
  expanded: boolean;
  setExpanded: (name: string) => void;
}) {
  return (
    <Stack className={'w-full mb-5'}>
      {/* TODO elevation, hover styles */}
      <Accordion
        expanded={expanded}
        onChange={(_, e) => setExpanded(e ? name : '')}
        className={'px-3'}
      >
        <AccordionSummary>
          <Box className={'w-full'}>
            <Typography className={'text-xl'}>{`${name} (QB)`}</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <PlayerPassingPanel />
        </AccordionDetails>
      </Accordion>
    </Stack>
  );
}

function DoughnutCard() {
  return (
    <div className={'flex h-full justify-center'}>
      <div className={'flex w-full justify-center'}>
        <DoughnutChart />
      </div>
    </div>
  );
}

function Doughnutz({ stat }: { stat: string }) {
  return (
    <>
      <Typography className={'text-xl w-full text-center'}>{stat}</Typography>
      <DoughnutCard />
    </>
  );
}

export default function Mock() {
  const [expandedPlayer, setExpandedPlayer] = useState('');
  const spacing = 4;

  return (
    <div className={'flex h-body pb-5'}>
      <Grid
        container
        alignItems='stretch'
        justifyContent='stretch'
        spacing={spacing}
      >
        <Grid item xs={6}>
          <Card className={'h-full flex-col justify-stretch relative'}>
            {['Steve Foo', 'Joe Bar', 'Don Baz'].map((player) => (
              <PlayerPanel
                key={player}
                name={player}
                expanded={player == expandedPlayer}
                setExpanded={setExpandedPlayer}
              />
            ))}
            <div className={'absolute bottom-5 left-5'}>
              <ToggleButtonGroup
                color='primary'
                value={'passing'}
                exclusive
                //onChange={handleChange}
                aria-label='Platform'
              >
                <ToggleButton value='passing'>Passing</ToggleButton>
                <ToggleButton value='receiving'>Receiving</ToggleButton>
                <ToggleButton value='rushing'>Rushing</ToggleButton>
              </ToggleButtonGroup>
            </div>
            <div className={'absolute bottom-5 right-5'}>
              <MouseOverPopover />
            </div>
          </Card>
        </Grid>
        <Grid container direction={'column'} item xs={6} spacing={spacing}>
          <Grid item xs={4}>
            <Card className={'h-full'}>
              <Typography className={'text-xl w-full text-center'}>
                HorizontalChart
              </Typography>
              <div className={'h-10 relative bg-red-500'}>
                <HorizontalChart />
              </div>
            </Card>
          </Grid>
          {[0, 1].map((i) => (
            <Grid key={i} container item xs={4} spacing={spacing}>
              {[0, 1].map((j) => (
                <Grid key={j} item xs={6}>
                  <Card className={'h-full'}>
                    <div className={'h-full relative'}>
                      <Doughnutz stat={'2022 Target Share'} />
                    </div>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ))}
        </Grid>
      </Grid>
    </div>
  );
}

function MouseOverPopover() {
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
        <Fab color='primary' onClick={handlePopoverOpen} className={'z-20'}>
          <AddCircleIcon />
        </Fab>
        <Popover
          id='mouse-over-popover'
          sx={{
            pointerEvents: 'none',
          }}
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
        >
          <List>
            <ListItem>
              <Typography>Dickhead Jones</Typography>
            </ListItem>
            <ListItem>
              <Typography>Alabama Pete</Typography>
            </ListItem>
            <ListItem>
              <Typography>Dave Fuck</Typography>
            </ListItem>
          </List>
        </Popover>
      </div>
    </ClickAwayListener>
  );
}
