import { useMemo } from 'react';

import { EnvironmentId } from '@/domains/environments';

import { nameValidation } from '../components/common/NameField';
import { useStacks } from '../queries/common/useStacks';

export function useNameValidation(environmentId: EnvironmentId) {
  const stacksQuery = useStacks();

  return useMemo(
    () =>
      nameValidation({ environmentId, stacks: stacksQuery.data }).required(
        'Name is required'
      ),
    [environmentId, stacksQuery.data]
  );
}
