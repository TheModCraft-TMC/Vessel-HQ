import { notFound } from 'next/navigation';
import {
  UpdateScheduleDetailsContent,
  UpdateScheduleDetailsHeader,
} from '@console/console/pages/UpdateScheduleEditorPages';

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: value } = await params;
  const scheduleId = Number(value);
  if (!Number.isInteger(scheduleId) || scheduleId < 1) notFound();
  return (
    <>
      <UpdateScheduleDetailsHeader scheduleId={scheduleId} />
      <UpdateScheduleDetailsContent scheduleId={scheduleId} />
    </>
  );
}
