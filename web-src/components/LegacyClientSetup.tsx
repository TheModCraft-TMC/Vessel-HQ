'use client';

import { useEffect } from 'react';

export function LegacyClientSetup() {
  useEffect(() => {
    void import('@/assets/css/colors');
  }, []);

  return null;
}
