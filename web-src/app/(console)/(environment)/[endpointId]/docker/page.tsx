import { redirect } from 'next/navigation';

export default async function Page({
  params,
}: {
  params: Promise<{ endpointId: string }>;
}) {
  const { endpointId } = await params;
  redirect(`/${endpointId}/docker/dashboard`);
}
