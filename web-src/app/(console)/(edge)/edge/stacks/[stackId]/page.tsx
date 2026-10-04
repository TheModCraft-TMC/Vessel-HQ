import { notFound } from 'next/navigation';
import {
  EdgeStackDetailsContent,
  EdgeStackDetailsHeader,
} from '@console/console/pages/EdgeEntityPages';

export default async function Page({
  params,
}: {
  params: Promise<{ stackId: string }>;
}) {
  const { stackId: value } = await params;
  const stackId = Number(value);
  if (!Number.isInteger(stackId) || stackId < 1) notFound();
  return (
    <>
      <EdgeStackDetailsHeader stackId={stackId} />
      <EdgeStackDetailsContent stackId={stackId} />
    </>
  );
}
