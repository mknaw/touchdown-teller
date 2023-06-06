
'use client';

import * as React from 'react';

import { createTheme, ThemeOptions, ThemeProvider } from '@mui/material/styles';

export default function Template({ children }: { children: React.ReactNode }) {
    const theme: ThemeOptions = createTheme({
      palette: {
        mode: 'dark',
        primary: {
          main: '#6b9084',
          contrastText: '#f9f4f4',
        },
        secondary: {
          main: '#fbad33',
        },
        background: {
          default: '#0b0c0b',
        },
      },
    });

    return (
        <ThemeProvider theme={theme}>
            {children}
        </ThemeProvider>
    );
}
