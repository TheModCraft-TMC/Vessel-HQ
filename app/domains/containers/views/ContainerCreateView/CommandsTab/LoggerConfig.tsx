import { FormikErrors } from 'formik';
import { array, object, SchemaOf, string } from 'yup';
import _ from 'lodash';

import { useLoggingPlugins } from '@/domains/containers/hooks/useLoggingPlugins';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { usePodmanCapabilities } from '@/providers/infrastructure/podman';
import { FormControl } from '@/ui/components/forms/FormControl';
import { FormSection } from '@/ui/components/forms/FormSection';
import { InputGroup } from '@/ui/components/forms/InputGroup';
import { InputList, ItemProps } from '@/ui/components/forms/InputList';
import { PortainerSelect } from '@/ui/components/forms/PortainerSelect';
import { TextTip } from '@/ui/components/feedback/Tip/TextTip';
import { FormError } from '@/ui/components/forms/FormError';

export interface LogConfig {
  type: string;
  options: Array<{ option: string; value: string }>;
}

export function LoggerConfig({
  value,
  onChange,
  apiVersion,
  errors,
}: {
  value: LogConfig;
  onChange: (value: LogConfig) => void;
  apiVersion: number;
  errors?: FormikErrors<LogConfig>;
}) {
  const envId = useEnvironmentId();
  const podmanCapabilities = usePodmanCapabilities(envId);
  const isSystem = apiVersion < 1.25;
  const pluginsQuery = useLoggingPlugins(envId, isSystem, podmanCapabilities);

  if (!pluginsQuery.data) {
    return null;
  }

  const isDisabled = !value.type || value.type === 'none';

  const pluginOptions = [
    { label: 'Default logging driver', value: '' },
    ...pluginsQuery.data.map((p) => ({ label: p, value: p })),
    { label: 'none', value: 'none' },
  ];

  return (
    <FormSection title="Logging">
      <FormControl label="Driver">
        <PortainerSelect
          value={value.type}
          onChange={(type) => onChange({ ...value, type: type || '' })}
          options={pluginOptions}
          data-cy="docker-logging-driver-selector"
        />
      </FormControl>

      <TextTip color="blue">
        Logging driver that will override the default docker daemon driver.
        Select Default logging driver if you don&apos;t want to override it.
        Supported logging drivers can be found{' '}
        <a
          href="https://docs.docker.com/engine/logging/configure/#supported-logging-drivers"
          target="_blank"
          rel="noreferrer"
        >
          in the Docker documentation
        </a>
        .
      </TextTip>

      <InputList
        tooltip={
          isDisabled
            ? 'Add button is disabled unless a driver other than none or default is selected. Options are specific to the selected driver, refer to the driver documentation.'
            : ''
        }
        label="Options"
        onChange={(options) => handleChange({ options })}
        value={value.options}
        item={Item}
        itemBuilder={() => ({ option: '', value: '' })}
        disabled={isDisabled}
        errors={errors?.options}
        data-cy="docker-logging-options"
      />
    </FormSection>
  );

  function handleChange(partial: Partial<LogConfig>) {
    onChange({ ...value, ...partial });
  }
}

function Item({
  item: { option, value },
  onChange,
  error,
  index,
}: ItemProps<{ option: string; value: string }>) {
  return (
    <div>
      <div className="flex w-full gap-4">
        <InputGroup className="w-1/2">
          <InputGroup.Addon>option</InputGroup.Addon>
          <InputGroup.Input
            value={option}
            onChange={(e) => handleChange({ option: e.target.value })}
            placeholder="e.g. FOO"
            data-cy={`docker-logging-option_${index}`}
          />
        </InputGroup>
        <InputGroup className="w-1/2">
          <InputGroup.Addon>value</InputGroup.Addon>
          <InputGroup.Input
            value={value}
            onChange={(e) => handleChange({ value: e.target.value })}
            placeholder="e.g bar"
            data-cy={`docker-logging-value_${index}`}
          />
        </InputGroup>
      </div>
      {error && <FormError>{_.first(Object.values(error))}</FormError>}
    </div>
  );

  function handleChange(partial: Partial<{ option: string; value: string }>) {
    onChange({ option, value, ...partial });
  }
}

export function validation(): SchemaOf<LogConfig> {
  return object({
    options: array().of(
      object({
        option: string().required('Option is required'),
        value: string().required('Value is required'),
      })
    ),
    type: string().default(''),
  });
}
