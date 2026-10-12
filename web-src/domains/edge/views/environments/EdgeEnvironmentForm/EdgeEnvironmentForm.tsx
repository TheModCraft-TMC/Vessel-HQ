import { Form, Formik, useFormikContext } from 'formik';
import _ from 'lodash';

import { NameField } from '@/domains/environments';
import { PublicUrlField } from '@/core/environment-management/environments/common/PublicUrlField/PublicUrlField';
import { EdgeIntervalsFieldset } from '@/domains/edge/components/EdgeIntervalsFieldset/EdgeIntervalsFieldset';
import { useUpdateEnvironmentMutation } from '@/core/environment-management/environments/queries/useUpdateEnvironmentMutation';
import { Environment } from '@/domains/environments';
import { TextTip } from '@/ui/components/feedback/Tip/TextTip';
import { FormSection } from '@/ui/components/forms/FormSection';
import { MetadataFieldset } from '@/core/environment-management/environments/common/MetadataFieldset';
import { EnvironmentFormActions } from '@/core/environment-management/environments/ItemView/EnvironmentFormActions/EnvironmentFormActions';
import { buildConfirmButton } from '@/ui/components/dialog/utils';
import { confirmDestructive } from '@/ui/components/dialog/confirm';
import { Widget } from '@/ui/components/Widget';

import { EdgeEnvironmentFormValues } from './types';
import { buildInitialValues, buildUpdatePayload } from './helpers';
import { useEdgeValidation } from './validation';

interface Props {
  environment: Environment;
  onSuccess: () => void;
}

export function EdgeEnvironmentForm({ environment, onSuccess }: Props) {
  const initialValues = buildInitialValues(environment);
  const validationSchema = useEdgeValidation(environment.Id);
  const updateMutation = useUpdateEnvironmentMutation();

  async function handleSubmit(values: EdgeEnvironmentFormValues) {
    if (_.difference(environment.TagIds, values.meta.tagIds || []).length > 0) {
      const confirmed = await confirmDestructive({
        title: 'Confirm action',
        message:
          'Removing tags from this environment will remove the corresponding edge stacks when dynamic grouping is being used',
        confirmButton: buildConfirmButton(),
      });

      if (!confirmed) {
        return;
      }
    }

    const payload = buildUpdatePayload(values, environment);
    updateMutation.mutate({ id: environment.Id, payload }, { onSuccess });
  }

  return (
    <Widget>
      <Widget.Body>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          validateOnMount
          enableReinitialize
        >
          <EdgeEnvironmentFormContent
            environment={environment}
            isSubmitting={updateMutation.isLoading}
          />
        </Formik>
      </Widget.Body>
    </Widget>
  );
}

interface FormContentProps {
  environment: Environment;
  isSubmitting: boolean;
}

function EdgeEnvironmentFormContent({
  environment,
  isSubmitting,
}: FormContentProps) {
  const { isValid, dirty, values, setValues } =
    useFormikContext<EdgeEnvironmentFormValues>();

  const asyncMode = environment.Edge?.AsyncMode || false;

  return (
    <Form className="form-horizontal">
      <FormSection title="Configuration">
        <NameField />
        <PublicUrlField />
        <TextTip color="blue">
          Use https connection on Edge agent to use private registries with
          credentials.
        </TextTip>
      </FormSection>

      <EdgeIntervalsFieldset
        value={values.edge}
        onChange={(intervalValues) => {
          setValues((values) => ({
            ...values,
            edge: {
              ...values.edge,
              ...intervalValues,
            },
          }));
        }}
        asyncMode={asyncMode}
      />

      <MetadataFieldset />

      <EnvironmentFormActions
        isLoading={isSubmitting}
        isValid={isValid}
        isDirty={dirty}
      />
    </Form>
  );
}
