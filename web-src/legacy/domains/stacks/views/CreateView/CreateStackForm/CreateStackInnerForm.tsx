import { Form, useFormikContext } from 'formik';

import { AccessControlForm } from '@/react/portainer/access-control/AccessControlForm';
import { NameField } from '@/domains/stacks/components/common/NameField';
import { useDockerComposeSchema } from '@/react/hooks/useDockerComposeSchema/useDockerComposeSchema';
import { useCurrentEnvironment } from '@/react/hooks/useCurrentEnvironment';
import { LoadingButton } from '@/ui/components/buttons';
import { FormSection } from '@/ui/components/forms/FormSection';
import { StackEnvironmentVariablesPanel } from '@/ui/components/forms/EnvironmentVariablesFieldset';

import { BuildMethodSection } from './BuildMethodSection';
import { DeploymentInfo } from './DeploymentInfo';
import { FormValues } from './types';

export function CreateStackInnerForm({
  isSwarm = false,
  isDeploying,
  isSaved,
  webhookId,
}: {
  isSwarm: boolean | undefined;
  isDeploying: boolean;
  isSaved: boolean;
  webhookId: string;
}) {
  const environmentQuery = useCurrentEnvironment();
  const schemaQuery = useDockerComposeSchema();
  const formikContext = useFormikContext<FormValues>();
  const { errors, values, setFieldValue, isValid } = formikContext;

  if (!environmentQuery.data) {
    return null;
  }

  const environment = environmentQuery.data;

  const dockerComposeSchema = schemaQuery.data;
  const composeSyntaxMaxVersion = environment?.ComposeSyntaxMaxVersion
    ? parseInt(environment.ComposeSyntaxMaxVersion, 10)
    : undefined;

  return (
    <Form className="form-horizontal">
      <NameField
        value={values.name}
        onChange={(name) => setFieldValue('name', name)}
        placeholder="e.g. mystack"
        errors={errors.name}
      />

      <DeploymentInfo
        isSwarm={isSwarm}
        composeSyntaxMaxVersion={composeSyntaxMaxVersion}
      />

      <BuildMethodSection
        isSwarm={isSwarm}
        isSaved={isSaved}
        webhookId={webhookId}
        schema={dockerComposeSchema}
      />

      <StackEnvironmentVariablesPanel
        values={values.env}
        onChange={(env) => setFieldValue('env', env)}
        errors={errors.env}
      />

      <AccessControlForm
        values={values.accessControl}
        onChange={(accessControl) =>
          setFieldValue('accessControl', accessControl)
        }
        environmentId={environment.Id}
        allowReadOnlyAccess
        errors={errors.accessControl}
      />

      <FormSection title="Actions">
        <LoadingButton
          loadingText="Deployment in progress..."
          isLoading={isDeploying}
          disabled={!isValid}
          className="!ml-0"
          data-cy="create-stack-submit-btn"
        >
          Deploy the stack
        </LoadingButton>
      </FormSection>
    </Form>
  );
}
