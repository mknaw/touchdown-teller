'use client';

import * as React from 'react';

import ThemeProvider from '@/pages/ThemeProvider';

export default function Template({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
