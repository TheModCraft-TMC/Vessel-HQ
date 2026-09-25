import { FormEvent, useState } from 'react';
import { Plus } from 'lucide-react';

import {
  useCreateTagMutation,
  useDeleteTagsMutation,
  useTags,
} from '@/portainer/tags/queries';
import { notifySuccess } from '@/ui/components/toast/notifications';

import { PageHeader } from '@/ui/layouts/view-layout/page-header';
import { Widget } from '@@/Widget';
import { Input } from '@/ui/components/forms/Input';
import { FormControl } from '@/ui/components/forms/FormControl';
import { LoadingButton } from '@/ui/components/buttons';

import { TagsDatatable } from './TagsDatatable';

export function TagsView() {
  const tagsQuery = useTags();
  const createMutation = useCreateTagMutation();
  const deleteMutation = useDeleteTagsMutation();
  const [name, setName] = useState('');

  const trimmedName = name.trim();
  const duplicate = Boolean(
    trimmedName && tagsQuery.data?.some((tag) => tag.Name === trimmedName)
  );

  return (
    <>
      <PageHeader title="Tags" breadcrumbs="Tag management" reload />

      <div className="space-y-4">
        <Widget className="mx-4">
          <Widget.Title icon={Plus} title="Add a new tag" />
          <Widget.Body>
            <form className="form-horizontal" onSubmit={handleSubmit}>
              <FormControl
                inputId="tag-name"
                label="Name"
                required
                errors={duplicate ? 'This tag already exists.' : undefined}
              >
                <Input
                  id="tag-name"
                  value={name}
                  placeholder="org/acme"
                  onChange={(event) => setName(event.target.value)}
                  data-cy="tag-name-input"
                />
              </FormControl>

              <div className="form-group">
                <div className="col-sm-12">
                  <LoadingButton
                    icon={Plus}
                    disabled={!trimmedName || duplicate}
                    isLoading={createMutation.isLoading}
                    loadingText="Creating tag..."
                    data-cy="create-tag-button"
                  >
                    Create tag
                  </LoadingButton>
                </div>
              </div>
            </form>
          </Widget.Body>
        </Widget>

        <TagsDatatable
          dataset={tagsQuery.data}
          onRemove={(tags) =>
            deleteMutation.mutate(
              tags.map((tag) => tag.ID),
              {
                onSuccess: () =>
                  notifySuccess('Success', 'Tag(s) successfully removed'),
              }
            )
          }
        />
      </div>
    </>
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!trimmedName || duplicate) {
      return;
    }

    createMutation.mutate(trimmedName, {
      onSuccess: () => {
        notifySuccess('Success', `Tag ${trimmedName} created`);
        setName('');
      },
    });
  }
}
