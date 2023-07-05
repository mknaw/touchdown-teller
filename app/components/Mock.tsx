'use client';

import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';

import Card from 'app/components/Card';
import DoughnutChart from 'app/components/DoughnutChart';

function PlayerPassingPanel() {
  return (
    <Stack>
      <Box>
        <Typography>Yards per attempt</Typography>
        <Slider />
      </Box>
      <Box>
        <Typography>Completion percentage</Typography>
        <Slider />
      </Box>
      <Box>
        <Typography>Touchdown percentage</Typography>
        <Slider />
      </Box>
    </Stack>
  );
}

function PlayerPanel({ name }: { name: string }) {
  return (
    <Stack className={'w-full mb-5'}>
      <Accordion>
        <AccordionSummary>
          <Box className={'w-full'}>
            <Typography className={'text-xl'}>{name}</Typography>
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
      <div className={'flex w-1/3 justify-center'}>
        <DoughnutChart />
      </div>
    </div>
  );
}

export default function Mock() {
  return (
    <div className={'flex h-full mx-5 pb-5'}>
      <Grid container alignItems='stretch' justifyContent='stretch' spacing={3}>
        <Grid item xs={6}>
          <Card>
            <PlayerPanel name={'Steve Foo'} />
            <PlayerPanel name={'Joe Bar'} />
            <PlayerPanel name={'Don Baz'} />
          </Card>
        </Grid>
        <Grid item xs={6}>
          <Grid container direction='column' spacing={3}>
            <Grid item xs={5}>
              <Card>
                <Typography className={'text-xl w-full text-center'}>
                  Projected Passing Yards
                </Typography>
                <DoughnutCard />
              </Card>
            </Grid>
            <Grid item xs={5}>
              <Card>
                <Typography className={'text-xl w-full text-center'}>
                  2022 Passing Yards
                </Typography>
                <DoughnutCard />
              </Card>
            </Grid>
            <Grid item xs={2}>
              <div className={'flex justify-end'}>
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
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </div>
  );
}
