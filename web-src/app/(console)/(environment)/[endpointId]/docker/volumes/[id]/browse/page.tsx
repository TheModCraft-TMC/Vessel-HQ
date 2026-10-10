'use client';

import { VolumeBrowserContent } from '@app/_components/platform/docker/volumes/BrowseView';

import { VolumeBrowserHeader } from './VolumeBrowserHeader';

export default function Page() {
  return (
    <>
      <VolumeBrowserHeader />
      <VolumeBrowserContent />
    </>
  );
}
