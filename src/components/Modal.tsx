import classNames from 'classnames';

import { Box, Paper, Typography } from '@mui/material';
import Modal, { ModalProps } from '@mui/material/Modal';

type TTModalProps = {
  title?: string;
  classnames?: string;
} & ModalProps;

export default ({
  children,
  title,
  classnames = '',
  ...props
}: TTModalProps) => {
  const boxClassName = classNames('px-10 py-6');
  return (
    <Modal {...props}>
      <Box
        className={
          // TODO can't hardcode in this width...
          classNames(
            'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2/3',
            classnames
          )
        }
      >
        <Paper className={boxClassName}>
          {title && (
            <Typography className={'flex w-full justify-center text-2xl mb-5'}>
              {title}
            </Typography>
          )}
          {children}
        </Paper>
      </Box>
    </Modal>
  );
};
