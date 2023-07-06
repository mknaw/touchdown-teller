import * as React from 'react';

import ThemeProvider from './ThemeProvider';
import './globals.css';
import Nav from './nav';

import { mainFont } from 'app/theme/fonts';

export const metadata = {
  title: 'Touchdown Teller',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' className={mainFont.className}>
      <body>
        <ThemeProvider>
          <Nav>{children}</Nav>
        </ThemeProvider>
      </body>
    </html>
  );
}
