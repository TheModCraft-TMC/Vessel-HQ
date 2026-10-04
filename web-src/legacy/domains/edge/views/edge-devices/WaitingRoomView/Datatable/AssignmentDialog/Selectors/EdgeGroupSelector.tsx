import { notifySuccess } from '@/ui/components/toast/notifications';
import { useCreateEdgeGroupMutation } from '@/domains/edge/queries/edge-groups/useCreateEdgeGroupMutation';
import { useEdgeGroups } from '@/domains/edge/queries/edge-groups/useEdgeGroups';

import { CreatableSelector } from './CreatableSelector';

export function EdgeGroupsSelector() {
  const createMutation = useCreateEdgeGroupMutation();

  const edgeGroupsQuery = useEdgeGroups({
    select: (edgeGroups) =>
      edgeGroups
        .filter((g) => !g.Dynamic)
        .map((opt) => ({ label: opt.Name, value: opt.Id })),
  });

  if (!edgeGroupsQuery.data) {
    return null;
  }

  const edgeGroups = edgeGroupsQuery.data;

  return (
    <CreatableSelector
      name="edgeGroups"
      options={edgeGroups}
      onCreate={handleCreate}
      isLoading={createMutation.isLoading}
    />
  );

  async function handleCreate(newGroup: string) {
    const group = await createMutation.mutateAsync({
      name: newGroup,
      dynamic: false,
    });

    notifySuccess('Edge group created', `Group ${group.Name} created`);
    return group.Id;
  }
}
