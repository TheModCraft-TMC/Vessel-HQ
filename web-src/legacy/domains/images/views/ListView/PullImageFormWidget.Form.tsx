import { Form, useFormikContext } from 'formik';

import { FormSection } from '@/ui/components/forms/FormSection';
import { FormActions } from '@/ui/components/forms/FormActions';
import { NodeSelector } from '@/react/docker/agent/NodeSelector';

import { ImageConfigFieldset } from '@@/ImageConfigFieldset';

import { FormValues } from './PullImageFormWidget.types';

export function PullImageForm({
  onRateLimit,
  isLoading,
  isNodeVisible,
}: {
  onRateLimit: (limited?: boolean) => void;
  isLoading: boolean;
  isNodeVisible: boolean;
}) {
  const { values, setFieldValue, errors, isValid } =
    useFormikContext<FormValues>();

  return (
    <Form className="form-horizontal">
      <ImageConfigFieldset
        autoComplete
        values={values.config}
        setFieldValue={(field, value) =>
          setFieldValue(`config.${field}`, value)
        }
        errors={errors.config}
        onRateLimit={onRateLimit}
      >
        {isNodeVisible && (
          <FormSection title="Deployment">
            <NodeSelector
              value={values.node}
              onChange={(node) => setFieldValue('node', node)}
              error={errors.node}
            />
          </FormSection>
        )}

        <FormActions
          isLoading={isLoading}
          isValid={isValid}
          loadingText="Download in progress..."
          submitLabel="Pull the image"
          data-cy="pull-image-button"
        />
      </ImageConfigFieldset>
    </Form>
  );
}
