import { Formik } from 'formik';
import { Copy } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { buildHref } from '@console/console/routing/buildHref';

import {
  notifyError,
  notifySuccess,
} from '@/ui/components/toast/notifications';
import { Stack } from '@/domains/stacks/models/types';
import { validateForm } from '@/ui/components/forms/validate-form';
import { confirm } from '@/ui/components/dialog/confirm';
import { ModalType } from '@/ui/components/dialog';
import { buildConfirmButton } from '@/ui/components/dialog/utils';

import { WidgetTitle } from '@@/Widget/WidgetTitle';
import { WidgetBody } from '@@/Widget/WidgetBody';
import { Widget } from '@@/Widget';

import { FormSubmitValues } from './StackDuplicationForm.types';
import { StackDuplicationFormInner } from './StackDuplicationFormInner';
import {
  getBaseValidationSchema,
  getDuplicateValidationSchema,
  getMigrateValidationSchema,
} from './StackDuplicationForm.validation';
import { useDuplicateStackMutation } from './useDuplicateStackMutation';
import { useMigrateStackMutation } from './useMigrateStackMutation';

interface StackDuplicationFormProps {
  currentEnvironmentId: number;

  yamlError?: string;

  originalFileContent: string;
  stack: Stack;
}

export function StackDuplicationForm({
  yamlError,
  originalFileContent,
  currentEnvironmentId,
  stack,
}: StackDuplicationFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const duplicateMutation = useDuplicateStackMutation();
  const migrateMutation = useMigrateStackMutation();
  const initialValues: FormSubmitValues = {
    environmentId: undefined,
    newName: '',
    actionType: 'migrate', // Default value, will be set by button clicks
  };

  return (
    <Widget>
      <WidgetTitle title="Stack duplication / migration" icon={Copy} />
      <WidgetBody>
        <Formik
          initialValues={initialValues}
          onSubmit={handleSubmit}
          validateOnMount
          validationSchema={getBaseValidationSchema()}
        >
          <StackDuplicationFormInner
            yamlError={yamlError}
            currentEnvironmentId={currentEnvironmentId}
            currentStackName={stack.Name}
            isLoading={migrateMutation.isLoading || duplicateMutation.isLoading}
          />
        </Formik>
      </WidgetBody>
    </Widget>
  );

  async function handleSubmit(values: FormSubmitValues) {
    const { actionType, environmentId, newName } = values;

    switch (actionType) {
      case 'duplicate':
        await handleDuplicate(environmentId!, newName);
        break;
      case 'migrate':
        await handleMigrate(environmentId!, newName);
        break;
      default:
        break;
    }
  }

  async function handleDuplicate(environmentId: number, name: string) {
    const schema = getDuplicateValidationSchema();
    const errors = await validateForm(() => schema, { environmentId, name });
    if (errors) {
      notifyError(
        'Validation Error',
        undefined,
        'Please fix the errors and try again.'
      );
      return;
    }

    duplicateMutation.mutate(
      {
        fileContent: originalFileContent,
        name,
        type: stack.Type,
        env: stack.Env,
        targetEnvironmentId: environmentId,
      },
      {
        onSuccess() {
          notifySuccess('Success', 'Stack successfully duplicated');
          router.push(buildHref('/:endpointId/docker/stacks', {}, pathname));
        },
        onError(error) {
          notifyError('Failure', error as Error, 'Unable to duplicate stack');
        },
      }
    );
  }

  async function handleMigrate(
    environmentId: number,
    name: string | undefined
  ) {
    const isRename = environmentId === currentEnvironmentId;

    const confirmed = await confirm({
      title: 'Are you sure?',
      modalType: ModalType.Warn,
      message: isRename
        ? 'This action will deploy a new instance of this stack with the new name that will replace the current stack. Please note that this does NOT migrate the content of any persistent volumes that may be attached to this stack.'
        : 'This action will deploy a new instance of this stack on the target environment, please note that this does NOT relocate the content of any persistent volumes that may be attached to this stack.',
      confirmButton: buildConfirmButton(
        isRename ? 'Rename' : 'Migrate',
        'danger'
      ),
    });

    if (!confirmed) {
      return;
    }

    const schema = getMigrateValidationSchema(stack.Name, currentEnvironmentId);
    const errors = await validateForm(() => schema, {
      environmentId,
      name,
    });

    if (errors) {
      notifyError(
        'Validation Error',
        undefined,
        'Please fix the errors and try again.'
      );
      return;
    }

    migrateMutation.mutate(
      {
        name,
        stackType: stack.Type,
        fromEnvId: currentEnvironmentId,
        id: stack.Id,
        targetEnvId: environmentId,
        fromSwarmId: stack.SwarmId,
      },
      {
        onSuccess() {
          notifySuccess('Stack successfully migrated', name || stack.Name);
          router.push(buildHref('/:endpointId/docker/stacks', {}, pathname));
        },
        onError(error) {
          notifyError('Failure', error as Error, 'Unable to migrate stack');
        },
      }
    );
  }
}
