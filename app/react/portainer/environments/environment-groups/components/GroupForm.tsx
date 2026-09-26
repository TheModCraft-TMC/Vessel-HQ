import {
  Form,
  Formik,
  FormikHelpers,
  FormikProps,
  useFormikContext,
} from 'formik';
import { object, string, array, number } from 'yup';
import { useRef } from 'react';

import { TagId } from '@/domains/tags';
import {
  EnvironmentId,
  EnvironmentGroupId,
} from '@/domains/environments';
import { useIsPureAdmin } from '@/react/hooks/useUser';
import { useCanExit } from '@/react/hooks/useCanExit';
import { FormControl } from '@/ui/components/forms/FormControl';
import { Input } from '@/ui/components/forms/Input';
import { confirmGenericDiscard } from '@/ui/components/dialog/confirm';
import { LoadingButton } from '@/ui/components/buttons';

import { TagSelector } from '@@/TagSelector';
import { StickyFooter } from '@@/StickyFooter/StickyFooter';

import { FormModeEnvironmentsSelector } from './AssociatedEnvironmentsSelector/FormModeEnvironmentsSelector';

export interface GroupFormValues {
  name: string;
  description: string;
  tagIds: Array<TagId>;
  /** Used in create mode only — undefined in edit mode */
  associatedEnvironments?: Array<EnvironmentId>;
}

interface Props {
  initialValues: GroupFormValues;
  onSubmit: (
    values: GroupFormValues,
    helpers: FormikHelpers<GroupFormValues>
  ) => Promise<void>;
  submitLabel: string;
  submitLoadingLabel: string;
  /** Group ID - if provided, shows environment selector (not for unassigned group) */
  groupId?: EnvironmentGroupId;
}

const validationSchema = object({
  name: string().required('Name is required'),
  description: string(),
  tagIds: array(number()),
});

export function GroupForm({
  initialValues,
  onSubmit,
  submitLabel,
  submitLoadingLabel,
  groupId,
}: Props) {
  const formikRef = useRef<FormikProps<GroupFormValues>>(null);
  useCanExit(() => !formikRef.current?.dirty || confirmGenericDiscard());

  return (
    <Formik
      innerRef={formikRef}
      initialValues={initialValues}
      onSubmit={onSubmit}
      validationSchema={validationSchema}
      validateOnMount
      enableReinitialize
    >
      <InnerForm
        submitLabel={submitLabel}
        submitLoadingLabel={submitLoadingLabel}
        groupId={groupId}
      />
    </Formik>
  );
}

interface InnerFormProps {
  submitLabel: string;
  submitLoadingLabel: string;
  groupId?: EnvironmentGroupId;
}

function InnerForm({
  submitLabel,
  submitLoadingLabel,
  groupId,
}: InnerFormProps) {
  const isPureAdmin = useIsPureAdmin();
  const {
    values,
    errors,
    handleChange,
    setFieldValue,
    isValid,
    dirty,
    isSubmitting,
  } = useFormikContext<GroupFormValues>();
  const isCreateMode = !groupId;

  return (
    <Form className="form-horizontal">
      <FormControl
        label="Name"
        required
        errors={errors.name}
        inputId="group-name"
      >
        <Input
          id="group-name"
          name="name"
          value={values.name}
          onChange={handleChange}
          placeholder="e.g. my-group"
          data-cy="group-name-input"
        />
      </FormControl>

      <FormControl label="Description" inputId="group-description">
        <Input
          id="group-description"
          name="description"
          value={values.description}
          onChange={handleChange}
          placeholder="e.g. production environments..."
          data-cy="group-description-input"
        />
      </FormControl>

      <TagSelector
        value={values.tagIds}
        onChange={(tagIds) => setFieldValue('tagIds', tagIds)}
        allowCreate={isPureAdmin}
      />

      {isCreateMode && (
        // Same UI as edit mode, but updates form values instead of the API
        <FormModeEnvironmentsSelector
          selectedIds={values.associatedEnvironments ?? []}
          onChange={(ids) => setFieldValue('associatedEnvironments', ids)}
        />
      )}

      <StickyFooter className="justify-end gap-4">
        <LoadingButton
          size="medium"
          loadingText={submitLoadingLabel}
          isLoading={isSubmitting}
          disabled={!isValid || isSubmitting || !dirty}
          data-cy="group-submit-button"
        >
          {submitLabel}
        </LoadingButton>
      </StickyFooter>
    </Form>
  );
}
