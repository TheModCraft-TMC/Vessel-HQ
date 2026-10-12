'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useLayoutSystem } from '@console/layout/LayoutContext';

const BuildInfoDialog = dynamic(() =>
  import('./BuildInfoDialog').then((module) => module.BuildInfoDialog)
);

export function BuildInfoButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { status, version } = useLayoutSystem();

  if (!status || !version) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        data-cy="portainerSidebar-versionNumber"
        className="btn-none hover:underline"
        onClick={() => setIsOpen(true)}
        title="About Vessel HQ"
      >
        {version.ServerVersion}
      </button>
      {isOpen && <BuildInfoDialog onClose={() => setIsOpen(false)} />}
    </>
  );
}
