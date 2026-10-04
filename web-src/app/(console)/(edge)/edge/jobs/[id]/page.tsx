import { notFound } from 'next/navigation';
import {
  EdgeJobDetailsContent,
  EdgeJobDetailsHeader,
} from '@console/console/pages/EdgeEntityPages';

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: value } = await params;
  const jobId = Number(value);
  if (!Number.isInteger(jobId) || jobId < 1) notFound();
  return (
    <>
      <EdgeJobDetailsHeader jobId={jobId} />
      <EdgeJobDetailsContent jobId={jobId} />
    </>
  );
}
