import { Authorized } from '@/react/hooks/useUser';
import { AddButton as BaseAddButton } from '@/ui/components/buttons';

export function AddButton() {
  return (
    <Authorized authorizations="OperationPortainerRegistryCreate" adminOnlyCE>
      <BaseAddButton data-cy="registry-addRegistryButton" to="/registries/new">
        Add registry
      </BaseAddButton>
    </Authorized>
  );
}
