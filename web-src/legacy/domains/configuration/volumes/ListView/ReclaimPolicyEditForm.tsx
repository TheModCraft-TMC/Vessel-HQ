import { Form, Formik } from 'formik';
import { mixed, object, SchemaOf } from 'yup';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useUpdatePVReclaimPolicy } from '@/domains/configuration/volumes/queries/useUpdatePVReclaimPolicy';
import { Modal } from '@/ui/components/dialog';
import { LoadingButton } from '@/ui/components/buttons';
import { FormControl } from '@/ui/components/forms/FormControl';
import { Select } from '@/ui/components/forms/ReactSelect';

import { PersistentVolume, ReclaimPolicy } from './types';

interface ReclaimPolicyEditFormValues {
  reclaimPolicy: ReclaimPolicy;
}

const RECLAIM_POLICY_OPTIONS: ReclaimPolicy[] = ['Retain', 'Recycle', 'Delete'];

interface Props {
  volume: PersistentVolume;
  onDismiss: () => void;
}

export function ReclaimPolicyEditForm({ volume, onDismiss }: Props) {
  const envId = useEnvironmentId();
  const updateMutation = useUpdatePVReclaimPolicy(envId);

  const initialValues: ReclaimPolicyEditFormValues = {
    reclaimPolicy: volume.persistentVolumeReclaimPolicy,
  };

  return (
    <>
      <Modal.Header title="Edit Persistent Volume Reclaim Policy" />

      <Formik<ReclaimPolicyEditFormValues>
        initialValues={initialValues}
        validationSchema={validationSchema()}
        onSubmit={onSubmit}
        validateOnChange
      >
        {({ errors, handleSubmit, values, setFieldValue, isSubmitting }) => (
          <>
            <Modal.Body>
              <Form className="form-vertical" onSubmit={handleSubmit}>
                <FormControl
                  label="Reclaim Policy"
                  inputId="reclaimPolicy-input"
                  errors={errors.reclaimPolicy}
                  size="vertical"
                >
                  <Select
                    inputId="reclaimPolicy-input"
                    value={{
                      value: values.reclaimPolicy,
                      label: values.reclaimPolicy,
                    }}
                    onChange={(option) =>
                      setFieldValue('reclaimPolicy', option?.value)
                    }
                    options={RECLAIM_POLICY_OPTIONS.map((o) => ({
                      value: o,
                      label: o,
                    }))}
                    data-cy="kubernetes-pv-reclaim-policy-select"
                  />
                </FormControl>
              </Form>
            </Modal.Body>

            <Modal.Footer>
              <LoadingButton
                loadingText="Updating..."
                isLoading={isSubmitting}
                onClick={() => handleSubmit()}
                data-cy="kubernetes-pv-reclaim-edit-submit"
              >
                Save
              </LoadingButton>
            </Modal.Footer>
          </>
        )}
      </Formik>
    </>
  );

  async function onSubmit(values: ReclaimPolicyEditFormValues) {
    await updateMutation.mutateAsync({
      name: volume.name,
      reclaimPolicy: values.reclaimPolicy,
    });
    onDismiss();
  }
}

function validationSchema(): SchemaOf<ReclaimPolicyEditFormValues> {
  return object().shape({
    reclaimPolicy: mixed<ReclaimPolicy>()
      .oneOf(RECLAIM_POLICY_OPTIONS)
      .required(),
  });
}
