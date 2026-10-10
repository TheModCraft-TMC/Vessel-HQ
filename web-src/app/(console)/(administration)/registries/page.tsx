import { RegistriesContent } from '@app/_components/pages/RegistriesPage';
import { PageHeader } from '@/ui/layouts/view-layout';

export default function RegistriesPage() {
  return (
    <>
      <PageHeader title="Registries" breadcrumbs="Registry management" reload />
      <RegistriesContent />
    </>
  );
}
