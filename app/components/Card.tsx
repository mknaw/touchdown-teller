import classNames from 'classnames';

import Paper from '@mui/material/Paper';

export default function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Paper variant='outlined' className={classNames(className, 'p-5')}>
      {/* TODO maybe should _actually_ use `Card` here, but who knows */}
      {children}
    </Paper>
  );
}
