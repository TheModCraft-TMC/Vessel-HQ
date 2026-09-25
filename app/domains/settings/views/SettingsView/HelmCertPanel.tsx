import { Form, Formik, useFormikContext } from 'formik';
import { Key } from 'lucide-react';
import { SchemaOf, object } from 'yup';

import { notifySuccess } from '@/ui/components/toast/notifications';
import { TextTip } from '@/ui/components/feedback/Tip/TextTip';
import { FileUploadField } from '@/ui/components/forms/FileUpload';
import { FormControl } from '@/ui/components/forms/FormControl';
import {
  file,
  withFileExtension,
} from '@/ui/components/forms/yup-file-validation';
import { FormActions } from '@/ui/components/forms/FormActions';
import { FeatureId } from '@/react/portainer/feature-flags/enums';

import { BEOverlay } from '@@/BEFeatureIndicator/BEOverlay';
import { Widget } from '@@/Widget';

import { useUpdateSSLConfigMutation } from './useUpdateSSLConfigMutation';

interface FormValues {
  clientCertFile: File | null;
}

export function HelmCertPanel() {
  const mutation = useUpdateSSLConfigMutation();
  const initialValues = {
    clientCertFile: null,
  };

  return (
    <BEOverlay featureId={FeatureId.CA_FILE}>
      <Widget>
        <Widget.Title
          icon={Key}
          title="Certificate Authority file for Kubernetes Helm repositories"
        />
        <Widget.Body>
          <Formik
            initialValues={initialValues}
            validationSchema={validation}
            onSubmit={handleSubmit}
            validateOnMount
          >
            <InnerForm isLoading={mutation.isLoading} />
          </Formik>
        </Widget.Body>
      </Widget>
    </BEOverlay>
  );

  function handleSubmit({ clientCertFile }: FormValues) {
    if (!clientCertFile) {
      return;
    }

    mutation.mutate(
      { clientCertFile },
      {
        onSuccess() {
          notifySuccess('Success', 'Helm certificate updated');
        },
      }
    );
  }
}

function InnerForm({ isLoading }: { isLoading: boolean }) {
  const { values, setFieldValue, errors, isValid } =
    useFormikContext<FormValues>();

  return (
    <Form className="form-horizontal">
      <div className="form-group">
        <div className="col-sm-12">
          <TextTip color="blue">
            Provide an additional CA file containing certificate(s) for HTTPS
            connections to Helm repositories.
          </TextTip>
        </div>
      </div>

      <FormControl
        label="CA file"
        tooltip="Select a CA file containing your X.509 certificate(s), commonly a crt, cer or pem file."
        inputId="ca-cert-field"
        errors={errors?.clientCertFile}
      >
        <FileUploadField
          required
          data-cy="helm-cert-panel-file-upload-field"
          inputId="ca-cert-field"
          name="clientCertFile"
          onChange={(file) => setFieldValue('clientCertFile', file)}
          value={values.clientCertFile}
        />
      </FormControl>

      <FormActions
        isValid={isValid}
        isLoading={isLoading}
        submitLabel="Apply changes"
        loadingText="Saving in progress..."
        data-cy="helm-cert-panel-submit-button"
      />
    </Form>
  );
}

function validation(): SchemaOf<FormValues> {
  return object({
    clientCertFile: withFileExtension(file(), [
      'pem',
      'crt',
      'cer',
      'cert',
    ]).required(''),
  });
}
