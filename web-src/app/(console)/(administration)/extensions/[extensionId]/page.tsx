import { notFound } from 'next/navigation';

import { NativeExtensionPreview } from '@/core/native-extensions';
import { ExtensionDetailsView } from '@/domains/extensions/views/ExtensionDetailsView/ExtensionDetailsView';
import { PageHeader } from '@/ui/layouts/view-layout';

export default async function ExtensionPreviewPage({
  params,
}: {
  params: Promise<{ extensionId: string }>;
}) {
  const { extensionId } = await params;
  if (
    !/^[a-z0-9][a-z0-9.-]{1,126}[a-z0-9]$/.test(extensionId) ||
    extensionId.includes('..')
  ) {
    notFound();
  }
  return (
    <>
      <PageHeader title="Extensions" breadcrumbs="Native extensions" />
      <ExtensionDetailsView extensionId={extensionId}>
        <NativeExtensionPreview extensionId={extensionId} />
      </ExtensionDetailsView>
    </>
  );
}
