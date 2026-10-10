'use client';

import { useState } from 'react';
import { Network } from 'lucide-react';
import { Form, FormikProps } from 'formik';
import { useRouter } from 'next/navigation';
import { boolean, object, SchemaOf, string } from 'yup';

import { ConnectivityTestModal } from '@/domains/edge/components/ConnectivityTestModal/ConnectivityTestModal';
import {
  useSettings,
  useUpdateSettingsMutation,
} from '@/domains/settings/queries/useSettings';
import { EnabledWaitingRoomSwitch } from '@/domains/settings/views/EdgeComputeView/AutomaticEdgeEnvCreation/EnableWaitingRoomSwitch';
import {
  buildDefaultValue as buildUrlDefaultValue,
  PortainerUrlField,
  validation as urlValidation,
} from '@/react/portainer/common/PortainerUrlField';
import { Button } from '@/ui/components/buttons';
import { LoadingButton } from '@/ui/components/buttons/LoadingButton';
import { TextTip } from '@/ui/components/feedback/Tip/TextTip';
import { FormControl } from '@/ui/components/forms/FormControl';
import { Switch } from '@/ui/components/forms/SwitchField/Switch';
import { notifySuccess } from '@/ui/components/toast/notifications';

export interface FormValues {
  EnableEdgeComputeFeatures: boolean;
  EdgePortainerUrl: string;
  EnableWaitingRoom: boolean;
}

export function useInitEdgeSetup() {
  const router = useRouter();
  const updateSettings = useUpdateSettingsMutation();
  const settingsQuery = useSettings();
  const settings = settingsQuery.data;
  const initialValues: FormValues = {
    EnableEdgeComputeFeatures: settings?.EnableEdgeComputeFeatures ?? false,
    EdgePortainerUrl: settings?.EdgePortainerUrl || buildUrlDefaultValue(),
    EnableWaitingRoom: settings ? !settings.TrustOnFirstConnect : true,
  };

  return {
    initialValues,
    isLoading: settingsQuery.isLoading,
    isSaving: updateSettings.isLoading,
    onSkip: () => router.push('/environments/new'),
    handleSubmit,
  };

  function handleSubmit(values: FormValues) {
    if (!values.EnableEdgeComputeFeatures) {
      router.push('/environments/new');
      return;
    }

    updateSettings.mutate(
      {
        EnableEdgeComputeFeatures: true,
        EdgePortainerUrl: values.EdgePortainerUrl,
        TrustOnFirstConnect: !values.EnableWaitingRoom,
      },
      {
        onSuccess() {
          notifySuccess('Success', 'Edge Compute enabled');
          router.push('/environments/new');
        },
      }
    );
  }
}

export function EdgeComputeIntroduction() {
  return (
    <>
      <p className="text-muted">
        Edge Compute lets Vessel HQ manage environments that it cannot reach
        directly—remote devices, environments behind NAT or a firewall, or sites
        with intermittent connectivity.
      </p>
      <ul className="text-muted ml-4 list-disc">
        <li>
          Onboard edge agents over a secure reverse tunnel, with no inbound
          ports to open on the remote side.
        </li>
        <li>
          Deploy stacks and jobs to many edge environments from one Vessel HQ
          instance.
        </li>
      </ul>
    </>
  );
}

export function EdgeSetupForm({
  formik,
  isSaving,
  onSkip,
}: {
  formik: FormikProps<FormValues>;
  isSaving: boolean;
  onSkip(): void;
}) {
  const [connectivityOpen, setConnectivityOpen] = useState(false);

  return (
    <Form className="form-horizontal mt-4" noValidate>
      <FormControl
        inputId="edge_enable"
        label="Enable Edge Compute features"
        size="small"
        errors={formik.errors.EnableEdgeComputeFeatures}
      >
        <Switch
          id="edge_enable"
          data-cy="init-edge-enable-switch"
          name="edge_enable"
          className="space-right"
          checked={formik.values.EnableEdgeComputeFeatures}
          onChange={(value) =>
            formik.setFieldValue('EnableEdgeComputeFeatures', value)
          }
        />
      </FormControl>
      {formik.values.EnableEdgeComputeFeatures && (
        <EdgeEnabledFields
          portainerUrl={formik.values.EdgePortainerUrl}
          connectivityOpen={connectivityOpen}
          onConnectivityOpen={() => setConnectivityOpen(true)}
          onConnectivityClose={() => setConnectivityOpen(false)}
        />
      )}
      <div className="form-group mt-5">
        <div className="col-sm-12 flex gap-2">
          <LoadingButton
            disabled={!formik.isValid}
            data-cy="init-edge-submit-button"
            isLoading={isSaving}
            loadingText="Saving..."
          >
            {formik.values.EnableEdgeComputeFeatures
              ? 'Enable and continue'
              : 'Continue'}
          </LoadingButton>
          <Button
            type="button"
            color="light"
            onClick={onSkip}
            data-cy="init-edge-skip-button"
          >
            Skip
          </Button>
        </div>
      </div>
    </Form>
  );
}

function EdgeEnabledFields({
  portainerUrl,
  connectivityOpen,
  onConnectivityOpen,
  onConnectivityClose,
}: {
  portainerUrl: string;
  connectivityOpen: boolean;
  onConnectivityOpen(): void;
  onConnectivityClose(): void;
}) {
  return (
    <>
      <TextTip color="blue" className="mb-2">
        Confirm that this browser-derived URL is reachable from your edge
        agents. You can change it later in Settings &gt; Edge Compute.
      </TextTip>
      <PortainerUrlField fieldName="EdgePortainerUrl" required />
      <div className="form-group">
        <div className="col-sm-12">
          <Button
            color="default"
            icon={Network}
            onClick={onConnectivityOpen}
            data-cy="init-edge-test-connectivity-button"
            className="!ml-0"
          >
            Test connectivity
          </Button>
        </div>
      </div>
      {connectivityOpen && (
        <ConnectivityTestModal
          portainerUrl={portainerUrl}
          onDismiss={onConnectivityClose}
        />
      )}
      <EnabledWaitingRoomSwitch />
      <TextTip color="blue" className="mb-2">
        When enabled, new edge agents wait for manual approval in Edge Compute
        &gt; Waiting Room. Otherwise, agents are trusted on first connect.
      </TextTip>
    </>
  );
}

export function validationSchema(): SchemaOf<FormValues> {
  return object({
    EnableEdgeComputeFeatures: boolean().default(false),
    EnableWaitingRoom: boolean().default(true),
    EdgePortainerUrl: string()
      .default('')
      .when('EnableEdgeComputeFeatures', {
        is: true,
        then: () => urlValidation(),
      }),
  });
}
