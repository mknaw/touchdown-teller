import { FC } from 'react';
import { Provider } from 'react-redux';

import ThemeProvider from './ThemeProvider';
import './globals.css';
import type { AppProps } from 'next/app';

import Nav from '@/pages/nav';
import { wrapper } from '@/store';

const TouchdownTeller: FC<AppProps> = ({ Component, ...rest }) => {
  const { store, props } = wrapper.useWrappedStore(rest);
  const { pageProps } = props;
  return (
    <Provider store={store}>
      <ThemeProvider>
        <Nav header={pageProps.title || 'Touchdown Teller'}>
          <Component {...pageProps} />
        </Nav>
      </ThemeProvider>
    </Provider>
  );
};

export default TouchdownTeller;
