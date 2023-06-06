import * as React from 'react';

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
        <html lang="en">
            <body>
                <ThemeProvider>
                    <Nav>{children}</Nav>
                </ThemeProvider>
            </body>
        </html>
    );
}
