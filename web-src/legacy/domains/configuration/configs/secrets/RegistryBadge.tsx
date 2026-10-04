import { useCurrentUser } from '@/react/hooks/useUser';
import { useRegistry } from '@/domains/registries';
import { Badge } from '@/ui/components/status/Badge';
import { Link } from '@/ui/components/links/Link';
import { InlineLoader } from '@/ui/components/feedback/InlineLoader/InlineLoader';
import { Tooltip } from '@/ui/components/feedback/Tip/Tooltip';

type Props = {
  registryId: number;
  children?: React.ReactNode;
  dataCy?: string;
};

export function RegistryBadge({ registryId, children, dataCy }: Props) {
  const registryQuery = useRegistry(registryId, false);
  const { isPureAdmin } = useCurrentUser();

  if (registryQuery.isLoading) {
    return <InlineLoader>Loading registry...</InlineLoader>;
  }

  if (registryQuery.isError || !registryQuery.data) {
    return (
      <Badge type="warn">
        Registry not found
        <Tooltip message="The registry associated with this secret could not be found. It may have been deleted." />
      </Badge>
    );
  }

  const { Name } = registryQuery.data;

  return (
    <Badge type="muted" data-cy={dataCy}>
      {isPureAdmin ? (
        <Link
          to="/registries/:id"
          params={{ id: registryId }}
          className="!text-inherit"
          data-cy={dataCy ? `${dataCy}-link` : 'registry-badge-link'}
        >
          {Name}
        </Link>
      ) : (
        Name
      )}
      {children}
    </Badge>
  );
}
