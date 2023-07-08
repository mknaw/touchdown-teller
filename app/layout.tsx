import * as React from 'react';

import ThemeProvider from './ThemeProvider';
import './globals.css';

import { mainFont } from 'app/theme/fonts';

export const metadata = {
  title: 'Touchdown Teller',
};

// TODO probably want to put some semblance of a `Nav` here,
// but not yet sure how to do it with dynamic header
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' className={mainFont.className}>
      <body className={'overflow-clip'}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
