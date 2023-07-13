'use client';

import * as React from 'react';

import { mainFont } from '@/pages/theme/fonts';

import { ThemeOptions, ThemeProvider, createTheme } from '@mui/material/styles';

export default function Template({ children }: { children: React.ReactNode }) {
  const theme: ThemeOptions = createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: '#716b90',
        contrastText: '#f9f4f4',
      },
      secondary: {
        main: '#3e385b',
      },
      background: {
        default: '#3e385b',
      },
    },
    typography: {
      fontFamily: mainFont.style.fontFamily,
      fontSize: 15,
    },
  });

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
