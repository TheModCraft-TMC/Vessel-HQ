'use client';

import { useEffect } from 'react';

export function LegacyClientSetup() {
  useEffect(() => {
    void import('@/shared/assets/css/colors');
  }, []);

  return null;
}
