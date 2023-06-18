'use client';

import * as React from 'react';

import { createTheme, ThemeOptions, ThemeProvider } from '@mui/material/styles';
import { Poppins } from "next/font/google";

const poppins = Poppins({
    subsets: ['latin'],
    weight: '200',
    display: 'swap',
});

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
            fontFamily: poppins.style.fontFamily,
            fontSize: 15,
        },
    });

    return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
