'use client';

import { useMemo } from 'react';
import { Settings } from 'lucide-react';
import { Formik, Form as FormikForm, FormikProps } from 'formik';
import { useRouter } from 'next/navigation';
import { object, SchemaOf } from 'yup';

import { EdgeGroup } from '@/domains/edge/models/edge-group';
import { useEdgeGroups } from '@/domains/edge/queries/edge-groups/useEdgeGroups';
import { EdgeGroupsField } from '@/domains/edge/views/environments/EdgeGroupsField/EdgeGroupsField';
import { BetaAlert } from '@/react/portainer/environments/update-schedules/common/BetaAlert';
import { FormValues } from '@/react/portainer/environments/update-schedules/common/types';
import {
  NameField,
  nameValidation,
} from '@/react/portainer/environments/update-schedules/common/NameField';
import { ScheduleTypeSelector } from '@/react/portainer/environments/update-schedules/common/ScheduleTypeSelector';
import { defaultValue } from '@/react/portainer/environments/update-schedules/common/ScheduledTimeField';
import { validation } from '@/react/portainer/environments/update-schedules/common/validation';
import { useCreateMutation } from '@/react/portainer/environments/update-schedules/queries/create';
import { useList } from '@/react/portainer/environments/update-schedules/queries/list';
import { useItem } from '@/react/portainer/environments/update-schedules/queries/useItem';
import { useUpdateMutation } from '@/react/portainer/environments/update-schedules/queries/useUpdateMutation';
import {
  EdgeUpdateResponse,
  EdgeUpdateSchedule,
  ScheduleType,
} from '@/react/portainer/environments/update-schedules/types';
import { LoadingButton } from '@/ui/components/buttons';
import { TextTip } from '@/ui/components/feedback/Tip/TextTip';
import { Link } from '@/ui/components/links/Link';
import { notifySuccess } from '@/ui/components/toast/notifications';
import { PageHeader } from '@/ui/layouts/view-layout/page-header';

import { InformationPanel } from '@@/InformationPanel';
import { Widget } from '@@/Widget';

export function UpdateScheduleCreateContent() {
  const initialValues = useMemo<FormValues>(
    () => ({
      name: '',
      groupIds: [],
      type: ScheduleType.Update,
      version: '',
      scheduledTime: defaultValue(),
    }),
    []
  );
  const groupsQuery = useEdgeGroups();
  const schedulesQuery = useList();
  const createSchedule = useCreateMutation();
  const router = useRouter();
  if (!schedulesQuery.data) return null;

  return (
    <ScheduleEditorContentLayout>
      <Formik
        initialValues={initialValues}
        onSubmit={(values) =>
          createSchedule.mutate(values, {
            onSuccess: () => {
              notifySuccess('Success', 'Created schedule successfully');
              router.push('/update-schedules');
            },
          })
        }
        validateOnMount
        validationSchema={() =>
          validation(schedulesQuery.data, groupsQuery.data)
        }
      >
        {(formik) => (
          <ScheduleForm
            formik={formik}
            isLoading={createSchedule.isLoading}
            submitLabel="Create Schedule"
            loadingLabel="Creating..."
            dataCy="update-schedules-create-submit-button"
          />
        )}
      </Formik>
    </ScheduleEditorContentLayout>
  );
}

export function UpdateScheduleDetailsHeader({
  scheduleId,
}: {
  scheduleId: number;
}) {
  const scheduleQuery = useItem(scheduleId);

  return (
    <PageHeader
      title="Update & Rollback"
      breadcrumbs={[
        {
          label: 'Edge agent update and rollback',
          link: '/update-schedules',
        },
        scheduleQuery.data?.name || `Schedule ${scheduleId}`,
      ]}
      reload
    />
  );
}

export function UpdateScheduleDetailsContent({
  scheduleId,
}: {
  scheduleId: number;
}) {
  const groupsQuery = useEdgeGroups();
  const scheduleQuery = useItem(scheduleId);
  const schedulesQuery = useList();
  const updateSchedule = useUpdateMutation();
  const router = useRouter();
  if (!scheduleQuery.data || !schedulesQuery.data) return null;

  const schedule = scheduleQuery.data;
  const active = schedule.isActive;
  const initialValues: FormValues = {
    name: schedule.name,
    groupIds: schedule.edgeGroupIds,
    type: schedule.type,
    version: schedule.version,
    scheduledTime: schedule.scheduledTime,
  };

  return (
    <ScheduleEditorContentLayout>
      <Formik
        initialValues={
          active ? ({ name: schedule.name } as FormValues) : initialValues
        }
        onSubmit={(values) =>
          updateSchedule.mutate(
            { id: scheduleId, values },
            {
              onSuccess: () => {
                notifySuccess('Success', 'Updated schedule successfully');
                router.push('/update-schedules');
              },
            }
          )
        }
        validateOnMount
        validationSchema={() =>
          scheduleValidation(
            schedule.id,
            schedulesQuery.data,
            groupsQuery.data,
            active
          )
        }
      >
        {(formik) => (
          <ScheduleForm
            formik={formik}
            isLoading={updateSchedule.isLoading}
            submitLabel="Update Schedule"
            loadingLabel="Updating..."
            dataCy="update-schedule-button"
            activeSchedule={schedule}
          />
        )}
      </Formik>
    </ScheduleEditorContentLayout>
  );
}

function ScheduleEditorContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <BetaAlert
        className="mb-2 ml-[15px]"
        message="Beta feature - currently limited to standalone Linux edge devices."
      />
      <div className="row">
        <div className="col-sm-12">
          <Widget>
            <Widget.Title title="Update & Rollback Scheduler" icon={Settings} />
            <Widget.Body>
              <ScheduleHelp />
              {children}
            </Widget.Body>
          </Widget>
        </div>
      </div>
    </>
  );
}

function ScheduleHelp() {
  return (
    <TextTip color="blue" className="mb-2">
      Devices need to be allocated to an Edge group, visit the{' '}
      <Link to="/edge/groups" data-cy="update-schedules-edge-groups-link">
        Edge Groups
      </Link>{' '}
      page to assign environments and create groups.
      <br />
      You can upgrade from any agent version to 2.17 or later only. You can not
      upgrade to an agent version prior to 2.17. Rollback to the originating
      version is available for 2.15.0 and later.
    </TextTip>
  );
}

function ScheduleForm({
  formik,
  isLoading,
  submitLabel,
  loadingLabel,
  dataCy,
  activeSchedule,
}: {
  formik: FormikProps<FormValues>;
  isLoading: boolean;
  submitLabel: string;
  loadingLabel: string;
  dataCy: string;
  activeSchedule?: EdgeUpdateResponse & { isActive: boolean };
}) {
  return (
    <FormikForm className="form-horizontal">
      <NameField />
      <EdgeGroupsField
        disabled={Boolean(activeSchedule)}
        onChange={(value) => formik.setFieldValue('groupIds', value)}
        value={activeSchedule?.edgeGroupIds || formik.values.groupIds || []}
        onBlur={formik.handleBlur}
        error={formik.errors.groupIds}
      />
      <div className="mt-2">
        {activeSchedule ? (
          <InformationPanel>
            <TextTip color="blue">
              {Object.keys(activeSchedule.environmentsPreviousVersions).length}{' '}
              environment(s) will be updated to version {activeSchedule.version}{' '}
              on {activeSchedule.scheduledTime} (local time)
            </TextTip>
          </InformationPanel>
        ) : (
          <ScheduleTypeSelector />
        )}
      </div>
      <div className="form-group">
        <div className="col-sm-12">
          <LoadingButton
            disabled={!formik.isValid}
            data-cy={dataCy}
            isLoading={isLoading}
            loadingText={loadingLabel}
          >
            {submitLabel}
          </LoadingButton>
        </div>
      </div>
    </FormikForm>
  );
}

function scheduleValidation(
  itemId: EdgeUpdateSchedule['id'],
  schedules: EdgeUpdateSchedule[],
  groups: EdgeGroup[] | undefined,
  active: boolean
): SchemaOf<{ name: string } | FormValues> {
  return active
    ? object({ name: nameValidation(schedules, itemId) })
    : validation(schedules, groups, itemId);
}
