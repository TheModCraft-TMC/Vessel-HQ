import { useFormikContext } from 'formik';

import { EditDetails } from '@/core/access-control/EditDetails';
import { Widget } from '@/ui/components/Widget';

import { validationSchema } from '../validation';
import { FormValues } from '../type';

export function AccessControlStep() {
  const { values, errors, setValues } = useFormikContext<FormValues>();

  return (
    <>
      <Widget.Title
        title="Access control"
        subtitle="Configure who can use this source to create workflows and deployments."
      />
      <Widget.Body>
        <EditDetails
          resourceName="source"
          values={values}
          onChange={({ ownership, authorizedTeams, authorizedUsers }) => {
            setValues((values) => ({
              ...values,
              ownership,
              authorizedTeams,
              authorizedUsers,
            }));
          }}
          errors={errors}
          isPublicVisible
        />
      </Widget.Body>
    </>
  );
}

export function validateAccessControlStep() {
  return validationSchema().pick([
    'ownership',
    'authorizedUsers',
    'authorizedTeams',
  ]);
}
