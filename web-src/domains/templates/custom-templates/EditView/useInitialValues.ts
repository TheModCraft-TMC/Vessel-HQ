import { parseAccessControlFormData } from '@/domains/access-control';
import { useCurrentUser, useIsEdgeAdmin } from '@/core/session/useUser';
import { toGitFormModel } from '@/domains/gitops';
import { ResourceControlViewModel } from '@/domains/access-control';

import { CustomTemplate, getTemplateSourceId } from '../types';

import { FormValues } from './types';

export function useInitialValues({
  template,
  templateFile,
  isEdge,
}: {
  template: CustomTemplate;
  templateFile: string | undefined;
  isEdge: boolean;
}): FormValues | undefined {
  const { user } = useCurrentUser();

  const isAdminQuery = useIsEdgeAdmin();

  if (isAdminQuery.isLoading) {
    return undefined;
  }

  return {
    Title: template.Title,
    FileContent: templateFile || '',
    Type: template.Type,
    Platform: template.Platform,
    Description: template.Description,
    Note: template.Note,
    Logo: template.Logo,
    Variables: template.Variables,
    Git: template.GitConfig
      ? toGitFormModel(getTemplateSourceId(template), template.GitConfig)
      : undefined,
    AccessControl:
      !isEdge && template.ResourceControl
        ? parseAccessControlFormData(
            isAdminQuery.isAdmin,
            user.Id,
            new ResourceControlViewModel(template.ResourceControl)
          )
        : undefined,
    EdgeSettings: template.EdgeSettings,
  };
}
