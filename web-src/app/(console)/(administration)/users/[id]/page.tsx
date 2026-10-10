import { notFound } from 'next/navigation';

import {
  UserDetailsContent,
  UserDetailsHeader,
} from '@app/_components/pages/UserDetailsPage';

export default async function UserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = Number(id);
  if (!Number.isInteger(userId) || userId < 1) notFound();

  return (
    <>
      <UserDetailsHeader userId={userId} />
      <UserDetailsContent userId={userId} />
    </>
  );
}
