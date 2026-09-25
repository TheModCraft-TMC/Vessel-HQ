import { StackType } from '@/domains/stacks/models/types';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useApiVersion } from '@/domains/stacks';
import { SwitchField } from '@/ui/components/forms/SwitchField';
import { FormSection } from '@/ui/components/forms/FormSection';

interface Props {
  stackType: StackType | undefined;
  checked: boolean;
  onChange: (value: boolean) => void;
}

export function PruneField({ stackType, checked, onChange }: Props) {
  const envId = useEnvironmentId();
  const apiVersion = useApiVersion(envId);

  if (
    (stackType !== StackType.DockerSwarm &&
      stackType !== StackType.DockerCompose) ||
    apiVersion < 1.27
  ) {
    return null;
  }

  return (
    <FormSection title="Options">
      <div className="form-group">
        <div className="col-sm-12">
          <SwitchField
            name="prune"
            checked={checked}
            tooltip="Prune services that are no longer referenced."
            labelClass="col-sm-3 col-lg-2"
            label="Prune services"
            onChange={onChange}
            data-cy="stack-prune-services-switch"
          />
        </div>
      </div>
    </FormSection>
  );
}
