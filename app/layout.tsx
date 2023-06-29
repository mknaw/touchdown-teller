import * as React from 'react';

import ThemeProvider from './ThemeProvider';
import './globals.css';
import Nav from './nav';

import { poppins } from 'app/theme/fonts';

export const metadata = {
  title: 'Projector',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={poppins.className}>
      <body>
        <ThemeProvider>
          <Nav>{children}</Nav>
        </ThemeProvider>
      </body>
    </html>
  );
}
