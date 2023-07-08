'use client';

import { useState } from 'react';

import {
  PassStats,
  RecvStats,
  RushStats,
  StatType,
  TeamWithExtras,
} from '@/app/types';
import Mock from 'app/components/Mock';

type TeamPageProps = {
  team: TeamWithExtras;
};

export default function TeamPage({ team }: TeamPageProps) {
  const [statType, setStatType] = useState<StatType>(StatType.PASS);
  // TODO seems a little repetitive ...
  switch (statType) {
  case StatType.PASS:
    return (
      <Mock<PassStats>
        team={team}
        statType={statType}
        setStatType={setStatType}
        constructor={PassStats}
        toStoreData={(s: PassStats) => s.toStoreData()}
      />
    );
  case StatType.RECV:
    return (
      <Mock<RecvStats>
        team={team}
        statType={statType}
        setStatType={setStatType}
        constructor={RecvStats}
        toStoreData={(s: RecvStats) => s.toStoreData()}
      />
    );
  default: // Rushing
    return (
      <Mock<RushStats>
        team={team}
        statType={statType}
        setStatType={setStatType}
        constructor={RushStats}
        toStoreData={(s: RushStats) => s.toStoreData()}
      />
    );
  }
}
