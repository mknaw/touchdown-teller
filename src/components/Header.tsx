'use client';

import classNames from 'classnames';

import MenuIcon from '@mui/icons-material/Menu';
import Fab from '@mui/material/Fab';

import { TeamKey } from '@/constants';
import { titleFont } from '@/styles/fonts';
import { getTeamName } from '@/utils';

export default function Header({ team }: { team: TeamKey }) {
  const className = classNames(
    'h-header w-full flex justify-center align-center text-5xl font-semibold relative',
    titleFont.className
  );
  return (
    <div className={className}>
      {/* TODO dont think this is the way to ensure its aligned with content under */}
      <Fab
        color='primary'
        className={'absolute top-1/2 left-8 -translate-y-1/2'}
      >
        <MenuIcon />
      </Fab>
      <h1 className={'flex items-center'}>{getTeamName(team)}</h1>
    </div>
  );
}
