import { RefreshCw } from 'lucide-react';

import { Registry } from '@/domains/registries';
import { Select } from '@/ui/components/forms/ReactSelect';
import { FormControl } from '@/ui/components/forms/FormControl';
import { Button } from '@/ui/components/buttons';
import { FormError } from '@/ui/components/forms/FormError';
import { SwitchField } from '@/ui/components/forms/SwitchField';
import { TextTip } from '@/ui/components/feedback/Tip/TextTip';
import { FormSection } from '@/ui/components/forms/FormSection';

interface Props {
  value?: number;
  registries: Registry[];
  onReload?: () => void;
  formInvalid?: boolean;
  errorMessage?: string;
  onChange: (value?: number) => void;
  method?: 'repository' | string;
}

export const REGISTRY_CREDENTIALS_ENABLED = -1;

export function PrivateRegistryFieldset({
  value,
  registries,
  onReload,
  formInvalid,
  errorMessage,
  onChange,
  method,
}: Props) {
  const tooltipMessage =
    'This allows you to provide credentials when using a private registry that requires authentication';

  const isActive = !!value;

  return (
    <FormSection title="Registry">
      <div className="form-group">
        <div className="col-sm-12">
          <SwitchField
            checked={isActive}
            onChange={handleCheckChange}
            tooltip={tooltipMessage}
            label="Use Credentials"
            labelClass="col-sm-3 col-lg-2"
            disabled={formInvalid}
            data-cy="private-registry-use-credentials-switch"
          />
        </div>
      </div>

      {isActive && (
        <>
          {method !== 'repository' && (
            <TextTip color="blue">
              If you make any changes to the image urls in your yaml, please
              reload or select registry manually
            </TextTip>
          )}

          {!errorMessage ? (
            <FormControl label="Registry" inputId="private-registry-selector">
              <div className="flex">
                <Select
                  value={registries.filter((registry) => registry.Id === value)}
                  options={registries}
                  getOptionLabel={(registry) => registry.Name}
                  getOptionValue={(registry) => registry.Id.toString()}
                  onChange={(value) => onChange(value?.Id)}
                  className="w-full"
                  data-cy="private-registry-selector"
                  inputId="private-registry-selector"
                />
                {method !== 'repository' && onReload && (
                  <Button
                    onClick={onReload}
                    title="Reload"
                    icon={RefreshCw}
                    color="light"
                    data-cy="private-registry-reload-button"
                    aria-label="Reload"
                  />
                )}
              </div>
            </FormControl>
          ) : (
            <FormError>{errorMessage}</FormError>
          )}
        </>
      )}
    </FormSection>
  );

  function handleCheckChange(checked: boolean) {
    onChange(checked ? REGISTRY_CREDENTIALS_ENABLED : undefined);
  }
}
