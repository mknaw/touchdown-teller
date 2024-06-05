import { Head, Html, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang='en'>
      <Head />
      <body className={'lg:overflow-y-clip overflow-x-clip'}>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
