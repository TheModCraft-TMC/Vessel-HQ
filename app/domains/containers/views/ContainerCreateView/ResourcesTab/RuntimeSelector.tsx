import { useInfo } from '@/domains/containers/hooks/useDockerSystem';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { PortainerSelect } from '@/ui/components/forms/PortainerSelect';

export function RuntimeSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const environmentId = useEnvironmentId();
  const infoQuery = useInfo(environmentId, {
    select: (info) => [
      { label: 'Default', value: '' },
      ...Object.keys(info?.Runtimes || {}).map((runtime) => ({
        label: runtime,
        value: runtime,
      })),
    ],
  });

  return (
    <PortainerSelect
      onChange={onChange}
      value={value}
      options={infoQuery.data || []}
      isLoading={infoQuery.isLoading}
      disabled={infoQuery.isLoading}
      data-cy="docker-runtime-selector"
    />
  );
}
