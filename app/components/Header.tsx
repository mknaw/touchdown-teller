import classNames from 'classnames';

import { poppins_400 } from 'app/theme/fonts';
import { TeamKey } from 'app/types';
import { getTeamName } from 'app/utils';

export default function Header({ team }: { team: TeamKey }) {
  const className = classNames(
    'w-full flex justify-center text-5xl font-semibold p-4',
    poppins_400.className
  );
  return <h1 className={className}>{getTeamName(team)}</h1>;
}
