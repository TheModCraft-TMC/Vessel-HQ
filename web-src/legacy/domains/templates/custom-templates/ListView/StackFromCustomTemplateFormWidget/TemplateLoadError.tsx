import { UserId } from '@/domains/users';
import { useCurrentUser, useIsEdgeAdmin } from '@/react/hooks/useUser';
import { CustomTemplate } from '@/domains/templates';
import { Link } from '@/ui/components/links/Link';
import { FormError } from '@/ui/components/forms/FormError';

export function TemplateLoadError({
  templateId,
  creatorId,
}: {
  templateId: CustomTemplate['Id'];
  creatorId: UserId;
}) {
  const { user } = useCurrentUser();
  const isEdgeAdminQuery = useIsEdgeAdmin();

  if (isEdgeAdminQuery.isLoading) {
    return null;
  }

  const isAdminOrWriter = isEdgeAdminQuery.isAdmin || user.Id === creatorId;

  return (
    <FormError>
      {isAdminOrWriter ? (
        <>
          Custom template could not be loaded, please{' '}
          <Link
            to="./:id"
            params={{ id: templateId }}
            data-cy="edit-custom-template-link"
          >
            click here
          </Link>{' '}
          for configuration
        </>
      ) : (
        <>
          Custom template could not be loaded, please contact your
          administrator.
        </>
      )}
    </FormError>
  );
}
