import { SchemaOf, boolean, mixed, number, object } from 'yup';

import { staggerConfigValidation } from '@/domains/edge';
import { relativePathValidation } from '@/domains/gitops';
import { EdgeTemplateSettings } from '@/domains/templates';
import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';

export function edgeFieldsetValidation(): SchemaOf<EdgeTemplateSettings> {
  if (!isBE) {
    return mixed().default(undefined) as SchemaOf<EdgeTemplateSettings>;
  }

  return object({
    RelativePathSettings: relativePathValidation(),
    PrePullImage: boolean().default(false),
    RetryDeploy: boolean().default(false),
    PrivateRegistryId: number().default(undefined),
    StaggerConfig: staggerConfigValidation(),
  });
}
