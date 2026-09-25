import { FormikErrors } from 'formik';
import { MultiValue } from 'react-select';

import { Registry } from '@/domains/registries';
import { useEnvironmentRegistries } from '@/react/portainer/environments/queries/useEnvironmentRegistries';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { InlineLoader } from '@/ui/components/feedback/InlineLoader';
import { FormControl } from '@/ui/components/forms/FormControl';
import { FormSection } from '@/ui/components/forms/FormSection';
import { TextTip } from '@/ui/components/feedback/Tip/TextTip';

import { RegistriesSelector } from './RegistriesSelector';

type Props = {
  values: MultiValue<Registry>;
  onChange: (value: MultiValue<Registry>) => void;
  errors?: string | string[] | FormikErrors<Registry>[];
  isEditingDisabled: boolean;
};

export function RegistriesFormSection({
  values,
  onChange,
  errors,
  isEditingDisabled,
}: Props) {
  const environmentId = useEnvironmentId();
  const registriesQuery = useEnvironmentRegistries(environmentId, {
    hideDefault: true,
  });
  return (
    <FormSection title="Registries">
      {!isEditingDisabled && (
        <TextTip color="blue" className="mb-2">
          Define which registries can be used by users who have access to this
          namespace.
        </TextTip>
      )}
      <FormControl
        inputId="registries"
        label={isEditingDisabled ? 'Selected registries' : 'Select registries'}
        errors={typeof errors === 'string' ? errors : undefined}
      >
        {registriesQuery.isLoading && (
          <InlineLoader>Loading registries...</InlineLoader>
        )}
        {registriesQuery.data && (
          <RegistriesSelector
            value={values}
            onChange={(registries) => onChange(registries)}
            options={registriesQuery.data}
            inputId="registries"
            isEditingDisabled={isEditingDisabled}
          />
        )}
      </FormControl>
    </FormSection>
  );
}
