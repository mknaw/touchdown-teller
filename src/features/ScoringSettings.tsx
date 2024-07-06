import React, { useEffect, useState } from 'react';

import NumberInput from '@/components/NumberInput';
import { getScoringSettings, updateScoringSettings } from '@/data/client';
import type { ScoringSettings } from '@/models/ScoringSettings';

export default function ScoringSettings() {
  const [scoringSettings, setScoringSettings] =
    useState<ScoringSettings | null>(null);

  useEffect(() => {
    async function fetch() {
      const fetchedSettings = await getScoringSettings();
      setScoringSettings(fetchedSettings);
    }
    fetch();
  }, []);

  useEffect(() => {
    const persistData = async () => {
      if (scoringSettings) {
        try {
          await updateScoringSettings(scoringSettings);
        } catch (error) {
          console.error('Failed to persist settings:', error);
        }
      }
    };

    persistData();
  }, [scoringSettings]);

  const handleInputChange = (
    _e:
      | React.FocusEvent<HTMLInputElement>
      | React.PointerEvent
      | React.KeyboardEvent,
    newValue: number | null,
    name: keyof ScoringSettings
  ) => {
    if (newValue === null) {
      return;
    }
    setScoringSettings((prevSettings) =>
      prevSettings
        ? {
            ...prevSettings,
            [name]: newValue,
          }
        : prevSettings
    );
  };

  const InputRow = ({
    label,
    name,
  }: {
    label: string;
    name: keyof ScoringSettings;
  }) =>
    scoringSettings && (
      <div className='flex flex-row w-full justify-stretch'>
        <label className={'w-full'}>{`${label}:`}</label>
        <NumberInput
          value={scoringSettings[name]}
          onChange={(event, newValue) =>
            handleInputChange(event, newValue, name)
          }
          aria-label={label}
        />
      </div>
    );

  return (
    <div>
      <InputRow label='Passing yards per point' name='passYdsPer' />
      <InputRow label='Points per passing touchdown' name='passTd' />
      <InputRow label='Points per reception' name='rec' />
      <InputRow label='Receiving yards per point' name='recvYdsPer' />
      <InputRow label='Points per receiving touchdown' name='recvTd' />
      <InputRow label='Rushing yards per point' name='rushYdsPer' />
      <InputRow label='Points per rushing touchdown' name='rushTd' />
    </div>
  );
}
