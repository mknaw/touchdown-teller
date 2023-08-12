import classNames from 'classnames';

import { Box, Paper, Typography } from '@mui/material';
import Modal, { ModalProps } from '@mui/material/Modal';

type TTModalProps = {
  title?: string;
} & ModalProps;

export default ({ children, title, ...props }: TTModalProps) => {
  const boxClassName = classNames('px-10 py-6');
  return (
    <Modal {...props}>
      <Box className={'absolute top-1/4 left-1/2 -translate-x-1/2 w-1/2'}>
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
