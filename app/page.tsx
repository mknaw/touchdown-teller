import { TeamKey } from './types';

import Header from 'app/components/Header';
import Mock from 'app/components/Mock';

export default async function Home() {
  return (
    <main className='w-full flex h-screen flex-col justify-stretch'>
      <Header team={'ATL' as TeamKey} />
      <Mock />
    </main>
  );
}
