import { FormikErrors } from 'formik';
import { SchemaOf, string } from 'yup';
import { useMemo } from 'react';

import { STACK_NAME_VALIDATION_REGEX } from '@/react/constants';
import { EnvironmentType } from '@/domains/environments';
import { FormControl } from '@/ui/components/forms/FormControl';
import { Input } from '@/ui/components/forms/Input';
import { EdgeStack } from '@/domains/edge/models/edge-stack';
import { useEdgeStacks } from '@/domains/edge/queries/edge-stacks/useEdgeStacks';
import { useEdgeGroups } from '@/domains/edge/queries/edge-groups/useEdgeGroups';
import { EdgeGroup } from '@/domains/edge/models/edge-group';

export function NameField({
  onChange,
  value,
  errors,
  placeholder,
}: {
  onChange(value: string): void;
  value: string;
  errors?: FormikErrors<string>;
  placeholder?: string;
}) {
  return (
    <FormControl inputId="name-input" label="Name" errors={errors} required>
      <Input
        id="name-input"
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        value={value}
        required
        data-cy="edgeStackCreate-nameInput"
      />
    </FormControl>
  );
}

export function nameValidation(
  stacks: Array<EdgeStack>,
  isComposeStack: boolean | undefined
): SchemaOf<string> {
  let schema = string()
    .required('Name is required')
    .test('unique', 'Name should be unique', (value) =>
      stacks.every((s) => s.Name !== value)
    );

  if (isComposeStack) {
    schema = schema.matches(
      new RegExp(STACK_NAME_VALIDATION_REGEX),
      "This field must consist of lower case alphanumeric characters, '_' or '-' (e.g. 'my-name', or 'abc-123')."
    );
  }

  return schema;
}

export function useNameValidation() {
  const edgeStacksQuery = useEdgeStacks();
  const edgeGroupsQuery = useEdgeGroups({
    select: (groups) =>
      Object.fromEntries(groups.map((g) => [g.Id, g.EndpointTypes])),
  });
  const edgeGroupsType = edgeGroupsQuery.data;

  return useMemo(
    () => (groupIds: Array<EdgeGroup['Id']>) =>
      nameValidation(
        edgeStacksQuery.data || [],
        groupIds
          .flatMap((g) => edgeGroupsType?.[g])
          ?.includes(EnvironmentType.EdgeAgentOnDocker)
      ),
    [edgeGroupsType, edgeStacksQuery.data]
  );
}
