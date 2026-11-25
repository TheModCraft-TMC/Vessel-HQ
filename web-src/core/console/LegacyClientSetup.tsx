'use client';

import { useEffect } from 'react';

import { RequestProgress } from './RequestProgress/RequestProgress';

export function LegacyClientSetup() {
  useEffect(() => {
    void import('@/shared/assets/css/colors');
  }, []);

  return <RequestProgress />;
}
