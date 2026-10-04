import { notFound } from 'next/navigation';
import {
  SourceDetailsContent,
  SourceDetailsHeader,
} from '@console/console/pages/SourceDetailsPage';

export default async function SourcePage({
  params,
}: {
  params: Promise<{ sourceId: string }>;
}) {
  const { sourceId: value } = await params;
  const sourceId = Number(value);
  if (!Number.isInteger(sourceId) || sourceId < 1) notFound();

  return (
    <>
      <SourceDetailsHeader sourceId={sourceId} />
      <SourceDetailsContent sourceId={sourceId} />
    </>
  );
}
