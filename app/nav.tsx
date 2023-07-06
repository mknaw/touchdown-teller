'use client';

import { ReactNode } from 'react';

import classNames from 'classnames';

import MenuIcon from '@mui/icons-material/Menu';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';

import { titleFont } from 'app/theme/fonts';

function HeaderTitle() {
  const className = classNames(
    'grow text-center text-5xl text-white font-semibold',
    titleFont.className
  );
  return (
    <Typography variant='h6' component='div' className={className}>
      Atlanta Falcons
    </Typography>
  );
}

export default function Nav({ children }: { children: ReactNode }) {
  return (
    <main className='w-full flex h-screen flex-col justify-stretch px-10'>
      <Box className={'h-header grow relative flex items-center'}>
        <AppBar position='static' color='transparent' className={'shadow-none'}>
          <Toolbar className={'p-0'}>
            <IconButton
              size='large'
              color='#fff'
              aria-label='menu'
              className={'absolute top-1/2 -translate-y-1/2'}
              onClick={() => console.log('clicked')}
            >
              <MenuIcon />
            </IconButton>
            <HeaderTitle />
          </Toolbar>
        </AppBar>
      </Box>
      <div className={'h-body'}>{children}</div>
    </main>
  );
}
