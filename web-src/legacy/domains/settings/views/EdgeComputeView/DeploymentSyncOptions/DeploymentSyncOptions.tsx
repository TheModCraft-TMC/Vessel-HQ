import { Form, Formik } from 'formik';
import { useReducer } from 'react';
import { Laptop } from 'lucide-react';

import {
  EdgeCheckinIntervalField,
  EdgeAsyncIntervalsForm,
} from '@/domains/edge';
import { notifySuccess } from '@/ui/components/toast/notifications';
import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';
import { FormSection } from '@/ui/components/forms/FormSection';
import { LoadingButton } from '@/ui/components/buttons/LoadingButton';
import { TextTip } from '@/ui/components/feedback/Tip/TextTip';
import {
  useSettings,
  useUpdateSettingsMutation,
} from '@/domains/settings/queries';

import { Widget, WidgetBody, WidgetTitle } from '@@/Widget';

import { FormValues } from './types';

const asyncIntervalFieldSettings = {
  ping: {
    label: 'Edge agent default ping frequency',
    tooltip:
      'Interval used by default by each Edge agent to ping the Vessel HQ instance. Affects Edge environment management and Edge compute features.',
  },
  snapshot: {
    label: 'Edge agent default snapshot frequency',
    tooltip:
      'Interval used by default by each Edge agent to snapshot the agent state.',
  },
  command: {
    label: 'Edge agent default command frequency',
    tooltip: 'Interval used by default by each Edge agent to execute commands.',
  },
};

export function DeploymentSyncOptions() {
  const settingsQuery = useSettings();
  const settingsMutation = useUpdateSettingsMutation();
  const [formKey, resetForm] = useReducer((state) => state + 1, 0);

  if (!settingsQuery.data) {
    return null;
  }

  const initialValues: FormValues = {
    Edge: {
      CommandInterval: settingsQuery.data.Edge.CommandInterval,
      PingInterval: settingsQuery.data.Edge.PingInterval,
      SnapshotInterval: settingsQuery.data.Edge.SnapshotInterval,
    },
    EdgeAgentCheckinInterval: settingsQuery.data.EdgeAgentCheckinInterval,
  };

  return (
    <div className="row">
      <Widget>
        <WidgetTitle icon={Laptop} title="Deployment sync options" />
        <WidgetBody>
          <Formik<FormValues>
            initialValues={initialValues}
            onSubmit={handleSubmit}
            key={formKey}
          >
            {({ setFieldValue, values, isValid, dirty }) => (
              <Form className="form-horizontal">
                <TextTip color="blue">
                  Default values set here will be available to choose as an
                  option for edge environment creation
                </TextTip>

                <FormSection title="Check-in Intervals">
                  <EdgeCheckinIntervalField
                    value={values.EdgeAgentCheckinInterval}
                    onChange={(value) =>
                      setFieldValue('EdgeAgentCheckinInterval', value)
                    }
                    isDefaultHidden
                    label="Edge agent default poll frequency"
                    tooltip="Interval used by default by each Edge agent to check in with the Vessel HQ instance. Affects Edge environment management and Edge compute features."
                  />
                </FormSection>

                {isBE && (
                  <FormSection title="Async Check-in Intervals">
                    <EdgeAsyncIntervalsForm
                      values={values.Edge}
                      onChange={(value) => setFieldValue('Edge', value)}
                      isDefaultHidden
                      fieldSettings={asyncIntervalFieldSettings}
                    />
                  </FormSection>
                )}

                <div className="form-group mt-5">
                  <div className="col-sm-12">
                    <LoadingButton
                      disabled={!isValid || !dirty}
                      className="!ml-0"
                      data-cy="settings-deploySyncOptionsButton"
                      isLoading={settingsMutation.isLoading}
                      loadingText="Saving settings..."
                    >
                      Save settings
                    </LoadingButton>
                  </div>
                </div>
              </Form>
            )}
          </Formik>
        </WidgetBody>
      </Widget>
    </div>
  );

  function handleSubmit(values: FormValues) {
    settingsMutation.mutate(
      {
        Edge: values.Edge,
        EdgeAgentCheckinInterval: values.EdgeAgentCheckinInterval,
      },
      {
        onSuccess() {
          notifySuccess('Success', 'Settings updated successfully');
          resetForm();
        },
      }
    );
  }
}
