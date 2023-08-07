import ThemeProvider from './ThemeProvider';
import './globals.css';
import type { AppProps } from 'next/app';

import Nav from '@/pages/nav';

export default function MyApp({ Component, pageProps }: AppProps) {
  const { title } = pageProps;
  return (
    <ThemeProvider>
      <Nav header={title || 'Touchdown Teller'}>
        <Component {...pageProps} />
      </Nav>
    </ThemeProvider>
  );
}
