'use client';

import React, { ReactNode, useState } from 'react';

import classNames from 'classnames';
import Link from 'next/link';

import MenuIcon from '@mui/icons-material/Menu';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Fade from '@mui/material/Fade';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';

import { titleFont } from 'app/theme/fonts';
import { TeamKey } from 'app/types';
import { getTeamName } from 'app/utils';

type DrawerProps = {
  isDrawerOpen: boolean;
  setDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

type HeaderProps = { header: string };

function HeaderBar({
  isDrawerOpen,
  setDrawerOpen,
  header,
}: DrawerProps & HeaderProps) {
  return (
    <Box className={'h-header grow relative flex items-center'}>
      <AppBar position='static' color='transparent' className={'shadow-none'}>
        <Toolbar className={'p-0'}>
          <IconButton
            onClick={() => setDrawerOpen(!isDrawerOpen)}
            size='large'
            aria-label='menu'
            className={
              'absolute top-1/2 -translate-y-1/2 z-40 text-color-white'
            }
          >
            <MenuIcon />
          </IconButton>
          <HeaderTitle header={header} />
        </Toolbar>
      </AppBar>
    </Box>
  );
}

function HeaderTitle({ header }: HeaderProps) {
  const className = classNames(
    'grow text-center text-5xl text-white font-semibold',
    titleFont.className
  );
  return (
    <Typography variant='h6' component='div' className={className}>
      {header}
    </Typography>
  );
}

// TODO probably SideDrawer can be in a layout and only need dynamic header?
function SideDrawer({
  isDrawerOpen: isOpen,
  setDrawerOpen: setIsOpen,
}: DrawerProps) {
  const drawer = (
    <Fade in={isOpen}>
      <div
        className={classNames(
          'absolute flex w-screen h-screen z-40',
          'backdrop-blur-sm backdrop-brightness-[.35] backdrop-saturate-[.25]',
          !isOpen && 'opacity-0'
        )}
      >
        <div className={'w-1/3 h-screen bg-red-500 pt-12'}>
          <List className={'flex-col h-full justify-space mt-5'}>
            {Object.keys(TeamKey).map((key) => (
              <ListItem
                key={key}
                disablePadding
                sx={{ display: 'block' }}
                onClick={() => setIsOpen(false)}
              >
                <Link href={`/teams/${key}`}>
                  <ListItemButton
                    sx={{
                      px: 3,
                      py: 0,
                      my: 0,
                    }}
                  >
                    <ListItemText
                      primary={getTeamName(key as TeamKey)}
                      className={'my-0 pl-2'}
                    />
                  </ListItemButton>
                </Link>
              </ListItem>
            ))}
          </List>
        </div>
        <div
          className={'w-full h-full z-40'}
          onClick={() => setIsOpen(false)}
        ></div>
      </div>
    </Fade>
  );
  return drawer;
}

export default function Nav({
  children,
  header,
}: {
  children: ReactNode;
  header: string;
}) {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  return (
    <>
      <SideDrawer isDrawerOpen={isDrawerOpen} setDrawerOpen={setDrawerOpen} />
      <main className='w-full flex h-screen flex-col justify-stretch px-5 overflow-clip'>
        <HeaderBar
          isDrawerOpen={isDrawerOpen}
          setDrawerOpen={setDrawerOpen}
          header={header}
        />
        <div className={'h-body'}>{children}</div>
      </main>
    </>
  );
}
