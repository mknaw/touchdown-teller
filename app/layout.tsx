import * as React from 'react';
import { Poppins } from 'next/font/google';

// If loading a variable font, you don't need to specify the font weight
const inter = Poppins({
    subsets: ['latin'],
    weight: '200',
    display: 'swap',
});

import './globals.css';
import Nav from './nav';
import ThemeProvider from './ThemeProvider';

export const metadata = {
    title: 'Projector',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={inter.className}>
            <body>
                <ThemeProvider>
                    <Nav>{children}</Nav>
                </ThemeProvider>
            </body>
        </html>
    );
}
