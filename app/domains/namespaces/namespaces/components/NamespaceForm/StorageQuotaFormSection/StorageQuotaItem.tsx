import { Database } from 'lucide-react';

import { StorageClass } from '@/domains/environments';
import { FeatureId } from '@/react/portainer/feature-flags/enums';
import { Authorized } from '@/react/hooks/useUser';
import { Icon } from '@/ui/components/icons/Icon';
import { FormSectionTitle } from '@/ui/components/forms/FormSectionTitle';
import { SwitchField } from '@/ui/components/forms/SwitchField';

type Props = {
  storageClass: StorageClass;
};

export function StorageQuotaItem({ storageClass }: Props) {
  return (
    <div key={storageClass.Name}>
      <FormSectionTitle>
        <div className="vertical-center text-muted inline-flex gap-1 align-top">
          <Icon icon={Database} className="!mt-0.5 flex-none" />
          <span>{storageClass.Name}</span>
        </div>
      </FormSectionTitle>
      <hr className="mb-0 mt-2 w-full" />
      <Authorized authorizations={['K8sResourcePoolDetailsW']}>
        <div className="form-group mb-4">
          <div className="col-sm-12">
            <SwitchField
              data-cy="k8sNamespaceEdit-storageClassQuota"
              disabled
              label="Enable quota"
              labelClass="col-sm-3 col-lg-2"
              fieldClass="pt-2"
              checked={false}
              onChange={() => {}}
              featureId={FeatureId.K8S_RESOURCE_POOL_STORAGE_QUOTA}
            />
          </div>
        </div>
      </Authorized>
    </div>
  );
}
