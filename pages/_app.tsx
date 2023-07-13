import ThemeProvider from './ThemeProvider';
import './globals.css';
import { getTeamName } from './utils';
import Nav from '@/pages/nav';
import type { AppProps } from 'next/app';

export default function MyApp({ Component, pageProps }: AppProps) {
  // TODO not really safe to assume this will always be present...
  const { team } = pageProps;
  return (
    <ThemeProvider>
      <Nav header={getTeamName(team.key)}>
        <Component {...pageProps} />
      </Nav>
    </ThemeProvider>
  );
}
