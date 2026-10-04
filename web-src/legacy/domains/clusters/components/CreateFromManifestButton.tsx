import { usePathname } from 'next/navigation';
import { Plus } from 'lucide-react';

import { AutomationTestingProps } from '@/types';
import { MenuButton, MenuButtonLink } from '@/ui/components/buttons/MenuButton';
import { Icon } from '@/ui/components/icons/Icon';

export function CreateFromManifestButton({
  params = {},
  'data-cy': dataCy,
}: { params?: object } & AutomationTestingProps) {
  const pathname = usePathname();
  return (
    <MenuButton
      items={[
        <MenuButtonLink
          key="manifest"
          to="/:endpointId/kubernetes/deploy"
          params={{
            referrer: pathname,
            ...params,
          }}
          label="Create from manifest"
          data-cy={`${dataCy}-manifest`}
        >
          Manifest
        </MenuButtonLink>,
        <MenuButtonLink
          key="helm"
          to="/:endpointId/kubernetes/helm"
          params={{
            referrer: pathname,
            ...params,
          }}
          label="Create from Helm chart"
          data-cy={`${dataCy}-helm`}
        >
          Helm chart
        </MenuButtonLink>,
      ]}
      data-cy={dataCy}
    >
      <Icon icon={Plus} size="xs" />
      Create from code
    </MenuButton>
  );
}
