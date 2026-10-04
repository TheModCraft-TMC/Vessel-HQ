import { useRouteParams } from '@console/console/routing/useRouteParams';
import { UserPlusIcon } from 'lucide-react';
import { Formik } from 'formik';
import { useMemo } from 'react';

import { RBACAlert, useIsRBACEnabled } from '@/domains/clusters';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useUsers } from '@/domains/users';
import {
  PortainerNamespaceAccessesConfigMap,
  useConfigMap,
  useUpdateK8sConfigMapMutation,
} from '@/domains/configuration';
import { useTeams } from '@/domains/teams';
import {
  notifyError,
  notifySuccess,
} from '@/ui/components/toast/notifications';
import type { Configuration } from '@/domains/configuration';
import { useCurrentUser } from '@/react/hooks/useUser';
import { TextTip } from '@/ui/components/feedback/Tip/TextTip';

import { Widget, WidgetBody, WidgetTitle } from '@@/Widget';

import { EnvironmentAccess } from '../types';
import { createAuthorizeAccessConfigMapPayload } from '../createAccessConfigMapPayload';
import { parseNamespaceAccesses } from '../parseNamespaceAccesses';

import { CreateAccessValues } from './types';
import { CreateAccessInnerForm } from './CreateAccessInnerForm';
import { validationSchema } from './createAccess.validation';

export function CreateAccessWidget() {
  const { id: namespaceName } = useRouteParams();
  const { user } = useCurrentUser();
  const environmentId = useEnvironmentId();
  const isRBACEnabledQuery = useIsRBACEnabled(environmentId);
  const initialValues: {
    selectedUsersAndTeams: EnvironmentAccess[];
  } = {
    selectedUsersAndTeams: [],
  };
  const usersQuery = useUsers(false, environmentId);
  const teamsQuery = useTeams(false, environmentId);
  const accessConfigMapQuery = useConfigMap(
    environmentId,
    PortainerNamespaceAccessesConfigMap.namespace,
    PortainerNamespaceAccessesConfigMap.configMapName
  );
  const namespaceAccesses = useMemo(
    () =>
      parseNamespaceAccesses(
        accessConfigMapQuery.data ?? null,
        namespaceName,
        usersQuery.data ?? [],
        teamsQuery.data ?? []
      ),
    [accessConfigMapQuery.data, usersQuery.data, teamsQuery.data, namespaceName]
  );
  const configMap = accessConfigMapQuery.data;

  const updateConfigMapMutation = useUpdateK8sConfigMapMutation(
    environmentId,
    PortainerNamespaceAccessesConfigMap.namespace
  );

  return (
    <div className="row">
      <div className="col-sm-12">
        <Widget aria-label="Create access">
          <WidgetTitle icon={UserPlusIcon} title="Create access" />
          <WidgetBody>
            {isRBACEnabledQuery.data === false && <RBACAlert />}
            <TextTip className="mb-2" childrenWrapperClassName="text-warning">
              Adding user access will require the affected user(s) to logout and
              login for the changes to be taken into account.
            </TextTip>
            {isRBACEnabledQuery.data !== false && (
              <Formik<CreateAccessValues>
                initialValues={initialValues}
                enableReinitialize
                validationSchema={validationSchema}
                onSubmit={(values, formikHelpers) =>
                  onSubmit(values, formikHelpers)
                }
                validateOnMount
              >
                {(formikProps) => (
                  <CreateAccessInnerForm
                    // eslint-disable-next-line react/jsx-props-no-spreading
                    {...formikProps}
                    namespaceAccessesGranted={namespaceAccesses}
                  />
                )}
              </Formik>
            )}
          </WidgetBody>
        </Widget>
      </div>
    </div>
  );

  async function onSubmit(
    values: {
      selectedUsersAndTeams: EnvironmentAccess[];
    },
    { resetForm }: { resetForm: () => void }
  ) {
    try {
      const configMapPayload = createAuthorizeAccessConfigMapPayload(
        namespaceAccesses,
        values.selectedUsersAndTeams,
        namespaceName,
        configMap ?? newConfigMap(user.Username, user.Id)
      );
      await updateConfigMapMutation.mutateAsync({
        configMap: configMapPayload,
        configMapName: PortainerNamespaceAccessesConfigMap.configMapName,
      });
      notifySuccess('Success', 'Namespace access updated');
      resetForm();
    } catch (error) {
      notifyError('Failed to update namespace access', error as Error);
    }
  }
}

function newConfigMap(userName: string, userId: number) {
  const configMap: Configuration = {
    Type: 1,
    UID: '',
    Name: PortainerNamespaceAccessesConfigMap.configMapName,
    Namespace: PortainerNamespaceAccessesConfigMap.namespace,
    Data: { [PortainerNamespaceAccessesConfigMap.accessKey]: '{}' },
    ConfigurationOwner: userName,
    ConfigurationOwnerId: `${userId}`,
    IsUsed: false,
    Yaml: '',
  };
  return configMap;
}
