import { notFound } from 'next/navigation';
import {
  EdgeGroupDetailsContent,
  EdgeGroupDetailsHeader,
} from '@console/console/pages/EdgeEntityPages';

export default async function Page({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId: value } = await params;
  const groupId = Number(value);
  if (!Number.isInteger(groupId) || groupId < 1) notFound();
  return (
    <>
      <EdgeGroupDetailsHeader groupId={groupId} />
      <EdgeGroupDetailsContent groupId={groupId} />
    </>
  );
}
