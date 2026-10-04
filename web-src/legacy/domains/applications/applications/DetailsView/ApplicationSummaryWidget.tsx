import { User, Clock, Info } from 'lucide-react';
import moment from 'moment';
import { useEffect, useState } from 'react';
import { Pod } from 'kubernetes-types/core/v1';

import { useApplicationRouteParams } from '@/domains/applications/applications/useApplicationRouteParams';
import { Authorized } from '@/react/hooks/useUser';
import {
  notifyError,
  notifySuccess,
} from '@/ui/components/toast/notifications';
import { usePublicSettings } from '@/domains/settings';
import type { GlobalDeploymentOptions } from '@/domains/settings';
import { Link } from '@/ui/components/links/Link';
import { LoadingButton } from '@/ui/components/buttons';
import { InlineLoader } from '@/ui/components/feedback/InlineLoader';
import { Icon } from '@/ui/components/icons/Icon';
import { ExternalBadge } from '@/ui/components/status/Badge/ExternalBadge';
import { SystemBadge } from '@/ui/components/status/Badge/SystemBadge';
import { useNamespaceQuery } from '@/domains/namespaces';
import { bytesToReadableFormat } from '@/domains/clusters';

import { Note } from '@@/Note';
import { WidgetBody, Widget } from '@@/Widget';
import { DetailsTable } from '@@/DetailsTable';

import {
  appStackNameLabel,
  appKindToDeploymentTypeMap,
  appOwnerLabel,
  appDeployMethodLabel,
  appNoteAnnotation,
} from '../constants';
import {
  applicationIsKind,
  getResourceRequests,
  getRunningPods,
  getTotalPods,
  isExternalApplication,
} from '../utils';
import { Application, ApplicationPatch } from '../types';
import { useApplication } from '../queries/useApplication';
import { usePatchApplicationMutation } from '../queries/usePatchApplicationMutation';

export function ApplicationSummaryWidget() {
  const { environmentId, namespace, name, resourceType } =
    useApplicationRouteParams();
  const { data: application, ...applicationQuery } = useApplication(
    environmentId,
    namespace,
    name,
    resourceType
  );
  const namespaceData = useNamespaceQuery(environmentId, namespace);
  const isSystemNamespace = namespaceData.data?.IsSystem;

  const externalApplication = application && isExternalApplication(application);
  const applicationRequests = application && getResourceRequests(application);
  const applicationOwner = application?.metadata?.labels?.[appOwnerLabel];
  const applicationDeployMethod = getApplicationDeployMethod(application);
  const applicationNote =
    application?.metadata?.annotations?.[appNoteAnnotation];

  const [applicationNoteFormValues, setApplicationNoteFormValues] =
    useState('');

  useEffect(() => {
    setApplicationNoteFormValues(applicationNote || '');
  }, [applicationNote]);

  const globalDeploymentOptionsQuery =
    usePublicSettings<GlobalDeploymentOptions>({
      select: (settings) => settings.GlobalDeploymentOptions,
    });

  const failedCreateCondition = application?.status?.conditions?.find(
    (condition) => condition.reason === 'FailedCreate'
  );
  const patchApplicationMutation = usePatchApplicationMutation(
    environmentId,
    namespace,
    name
  );

  return (
    <div className="row">
      <div className="col-sm-12">
        <Widget>
          <WidgetBody>
            {applicationQuery.isLoading && (
              <InlineLoader>Loading application...</InlineLoader>
            )}
            {application && (
              <>
                {failedCreateCondition && (
                  <div
                    className="alert alert-danger mb-2 flex items-start gap-1"
                    data-cy="k8sAppDetail-failedCreateMessage"
                  >
                    <div className="mt-0.5">
                      <Icon
                        icon={Info}
                        className="mr-1 shrink-0"
                        mode="danger"
                      />
                    </div>
                    <div>
                      <div className="font-semibold">
                        Failed to create application
                      </div>
                      {failedCreateCondition.message}
                    </div>
                  </div>
                )}
                <DetailsTable dataCy="k8sAppDetail-table">
                  <tr>
                    <td>Name</td>
                    <td>
                      <div
                        className="flex items-center gap-x-2"
                        data-cy="k8sAppDetail-appName"
                      >
                        {name}
                        {externalApplication && !isSystemNamespace && (
                          <ExternalBadge />
                        )}
                      </div>
                    </td>
                  </tr>
                  {globalDeploymentOptionsQuery.data &&
                    !globalDeploymentOptionsQuery.data
                      .hideStacksFunctionality && (
                      <tr>
                        <td>Stack</td>
                        <td data-cy="k8sAppDetail-stackName">
                          {application?.metadata?.labels?.[appStackNameLabel] ||
                            '-'}
                        </td>
                      </tr>
                    )}
                  <tr>
                    <td>Namespace</td>
                    <td>
                      <div
                        className="flex items-center gap-x-2"
                        data-cy="k8sAppDetail-resourcePoolName"
                      >
                        <Link
                          to="/:endpointId/kubernetes/namespaces/:id"
                          data-cy="k8sAppDetail-namespaceLink"
                          params={{ id: namespace }}
                        >
                          {namespace}
                        </Link>
                        {isSystemNamespace && <SystemBadge />}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>Application type</td>
                    <td data-cy="k8sAppDetail-appType">
                      {application?.kind || '-'}
                    </td>
                  </tr>
                  {application?.kind && (
                    <tr>
                      <td>Status</td>
                      {applicationIsKind<Pod>('Pod', application) && (
                        <td data-cy="k8sAppDetail-appType">
                          {application?.status?.phase}
                        </td>
                      )}
                      {!applicationIsKind<Pod>('Pod', application) && (
                        <td data-cy="k8sAppDetail-appType">
                          {appKindToDeploymentTypeMap[application.kind]}
                          <code
                            className="ml-1"
                            data-cy="k8sAppDetail-runningPods"
                          >
                            {getRunningPods(application)}
                          </code>{' '}
                          /{' '}
                          <code data-cy="k8sAppDetail-totalPods">
                            {getTotalPods(application)}
                          </code>
                        </td>
                      )}
                    </tr>
                  )}
                  {(!!applicationRequests?.cpu ||
                    !!applicationRequests?.memoryBytes) && (
                    <tr>
                      <td>
                        Resource reservations
                        {!applicationIsKind<Pod>('Pod', application) && (
                          <div className="text-muted small">per instance</div>
                        )}
                      </td>
                      <td>
                        {!!applicationRequests?.cpu && (
                          <div data-cy="k8sAppDetail-cpuReservation">
                            CPU {applicationRequests.cpu}
                          </div>
                        )}
                        {!!applicationRequests?.memoryBytes && (
                          <div data-cy="k8sAppDetail-memoryReservation">
                            Memory{' '}
                            {String(
                              bytesToReadableFormat(
                                applicationRequests.memoryBytes
                              )
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td>Creation</td>
                    <td>
                      <div className="flex flex-wrap items-center gap-3">
                        {applicationOwner && (
                          <span
                            className="flex items-center gap-1"
                            data-cy="k8sAppDetail-owner"
                          >
                            <User />
                            {applicationOwner}
                          </span>
                        )}
                        <span
                          className="flex items-center gap-1"
                          data-cy="k8sAppDetail-creationDate"
                        >
                          <Clock />
                          {moment(
                            application?.metadata?.creationTimestamp
                          ).format('YYYY-MM-DD HH:mm:ss')}
                        </span>
                        {(!externalApplication || isSystemNamespace) && (
                          <span
                            className="flex items-center gap-1"
                            data-cy="k8sAppDetail-creationMethod"
                          >
                            <Clock />
                            Deployed from {applicationDeployMethod}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2}>
                      <form className="form-horizontal">
                        <Note
                          value={applicationNoteFormValues}
                          onChange={setApplicationNoteFormValues}
                          defaultIsOpen
                          isExpandable
                        />
                        <Authorized authorizations="K8sApplicationDetailsW">
                          <div className="form-group">
                            <div className="col-sm-12">
                              <LoadingButton
                                color="primary"
                                size="small"
                                className="!ml-0"
                                type="button"
                                onClick={() => patchApplicationNote()}
                                disabled={
                                  // disable if there is no change to the note, or it's updating
                                  applicationNoteFormValues ===
                                    (applicationNote || '') ||
                                  patchApplicationMutation.isLoading
                                }
                                data-cy="k8sAppDetail-saveNoteButton"
                                isLoading={patchApplicationMutation.isLoading}
                                loadingText={
                                  applicationNote ? 'Updating' : 'Saving'
                                }
                              >
                                {applicationNote ? 'Update' : 'Save'} note
                              </LoadingButton>
                            </div>
                          </div>
                        </Authorized>
                      </form>
                    </td>
                  </tr>
                </DetailsTable>
              </>
            )}
          </WidgetBody>
        </Widget>
      </div>
    </div>
  );

  async function patchApplicationNote() {
    const patch: ApplicationPatch = [
      {
        op: 'replace',
        path: `/metadata/annotations/${appNoteAnnotation}`,
        value: applicationNoteFormValues,
      },
    ];
    if (application?.kind) {
      try {
        await patchApplicationMutation.mutateAsync({
          appKind: application.kind,
          patch,
        });
        notifySuccess('Success', 'Application successfully updated');
      } catch (error) {
        notifyError(
          `Failed to ${applicationNote ? 'update' : 'save'} note`,
          error as Error
        );
      }
    }
  }
}

function getApplicationDeployMethod(application?: Application) {
  if (!application?.metadata?.labels?.[appDeployMethodLabel])
    return 'application form';
  if (application?.metadata?.labels?.[appDeployMethodLabel] === 'content') {
    return 'manifest';
  }
  return application?.metadata?.labels?.[appDeployMethodLabel];
}
