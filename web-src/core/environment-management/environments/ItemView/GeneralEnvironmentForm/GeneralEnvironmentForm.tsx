import { Formik, Form, FormikErrors } from 'formik';

import { useUpdateEnvironmentMutation } from '@/core/environment-management/environments/queries/useUpdateEnvironmentMutation';
import { NameField } from '@/domains/environments';
import { EnvironmentUrlField } from '@/core/environment-management/environments/common/EnvironmentUrlField/EnvironmentUrlField';
import { PublicUrlField } from '@/core/environment-management/environments/common/PublicUrlField/PublicUrlField';
import { TLSFieldset } from '@/core/components/TLSFieldset';
import { MetadataFieldset } from '@/core/environment-management/environments/common/MetadataFieldset';
import {
  isAgentEnvironment,
  isLocalDockerEnvironment,
} from '@/domains/environments';
import {
  Environment,
  EnvironmentStatus,
} from '@/domains/environments';
import { FormSection } from '@/ui/components/forms/FormSection';
import { Widget } from '@/ui/components/Widget/Widget';
import { WidgetBody } from '@/ui/components/Widget';
import { TLSConfig } from '@/core/components/TLSFieldset/types';

import { EnvironmentFormActions } from '../EnvironmentFormActions/EnvironmentFormActions';

import { useGeneralValidation } from './validation';
import { buildInitialValues, buildUpdatePayload } from './helpers';

interface Props {
  environment: Environment;
  onSuccess: () => void;
}

export function GeneralEnvironmentForm({ environment, onSuccess }: Props) {
  const updateMutation = useUpdateEnvironmentMutation();

  const isAgent = isAgentEnvironment(environment.Type);
  const isLocalDocker = isLocalDockerEnvironment(environment.URL);
  const hasError = environment.Status === EnvironmentStatus.Error;
  const validationSchema = useGeneralValidation({
    status: environment.Status,
    environmentId: environment.Id,
  });

  return (
    <Widget>
      <WidgetBody>
        <Formik
          initialValues={buildInitialValues(environment)}
          validationSchema={validationSchema}
          onSubmit={(values) => {
            const payload = buildUpdatePayload({
              values,
              environmentType: environment.Type,
            });
            updateMutation.mutate(
              { id: environment.Id, payload },
              { onSuccess }
            );
          }}
          validateOnMount
        >
          {({ values, setFieldValue, errors, isValid, dirty }) => (
            <Form className="form-horizontal">
              <FormSection title="Configuration">
                <NameField />

                {!hasError && (
                  <>
                    <EnvironmentUrlField
                      isAgent={isAgent}
                      disabled={isLocalDocker}
                    />
                    <PublicUrlField />
                  </>
                )}

                {!hasError && values.tls && (
                  <TLSFieldset
                    values={values.tls}
                    onChange={(partialValues) => {
                      setFieldValue('tls', {
                        ...values.tls,
                        ...partialValues,
                      });
                    }}
                    errors={errors.tls as FormikErrors<TLSConfig> | undefined}
                  />
                )}
              </FormSection>

              <MetadataFieldset />

              <EnvironmentFormActions
                isLoading={updateMutation.isLoading}
                isValid={isValid}
                isDirty={dirty}
              />
            </Form>
          )}
        </Formik>
      </WidgetBody>
    </Widget>
  );
}
