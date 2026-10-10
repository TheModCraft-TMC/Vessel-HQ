import { SettingsContent } from '@app/_components/pages/SettingsPage';
import { PageHeader } from '@/ui/layouts/view-layout';

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" breadcrumbs="Settings" reload />
      <SettingsContent />
    </>
  );
}
