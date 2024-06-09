'use client';

import React, { ReactNode, useState } from 'react';

import classNames from 'classnames';
import Link from 'next/link';

import MenuIcon from '@mui/icons-material/Menu';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Fade from '@mui/material/Fade';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Toolbar from '@mui/material/Toolbar';

import { TeamKey } from '@/constants';
import { titleFont } from '@/styles/fonts';
import { getTeamName } from '@/utils';

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
            sx={{
              // Nasty hack since I haven't reconciled tailwind properly
              position: 'absolute',
            }}
            className={'top-1/2 -translate-y-1/2 z-40 text-color-white'}
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
  return <h6 className={className}>{header}</h6>;
}

// TODO probably SideDrawer can be in a layout and only need dynamic header?
function SideDrawer({
  isDrawerOpen,
  setDrawerOpen,
}: DrawerProps) {
  const NavItem = ({
    key,
    primary,
    href,
  }: {
    key: string;
    primary: string;
    href: string;
  }) => (
    <ListItem
      key={key}
      disablePadding
      sx={{ display: 'block' }}
      onClick={() => setDrawerOpen(false)}
    >
      <Link href={href}>
        <ListItemButton
          sx={{
            px: 3,
            py: 0,
            my: 0,
          }}
        >
          <ListItemText
            primary={primary}
            primaryTypographyProps={{ variant: 'h6' }}
            className={'my-0 pl-2'}
          />
        </ListItemButton>
      </Link>
    </ListItem>
  );

  const drawer = (
    <Fade in={isDrawerOpen}>
      <div
        className={classNames(
          'absolute flex w-screen h-screen z-40',
          'backdrop-blur-sm backdrop-brightness-[.35] backdrop-saturate-[.25]',
          !isDrawerOpen && 'opacity-0'
        )}
      >
        <div className={'w-1/3 h-screen bg-red-500 overflow-y-auto'}>
          <List
            className={'mt-0 pt-0 top-header'}
            sx={{
              // TODO remove when I fix the tailwind interop
              display: 'flex',
              flexDirection: 'column',
              height: 1,
              width: 1,
              justifyContent: 'space-between',
            }}
          >
            <NavItem key={'home'} primary={'Home'} href={'/'} />
            <Divider />
            {Object.keys(TeamKey).map((key) => (
              <NavItem
                key={key}
                primary={getTeamName(key as TeamKey)}
                href={`/teams/${key}`}
              />
            ))}
          </List>
        </div>
        <div
          className={'w-full h-full z-40'}
          onClick={() => setDrawerOpen(false)}
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
      <main className='w-full flex h-screen flex-col justify-stretch px-5'>
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
