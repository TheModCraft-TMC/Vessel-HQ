'use client';

import { FormEvent, useState } from 'react';
import { Plus } from 'lucide-react';

import {
  useCreateTagMutation,
  useDeleteTagsMutation,
  useTags,
} from '@/portainer/tags/queries';
import { TagsDatatable } from '@/react/portainer/environments/TagsView/TagsDatatable';
import { LoadingButton } from '@/ui/components/buttons';
import { FormControl } from '@/ui/components/forms/FormControl';
import { Input } from '@/ui/components/forms/Input';
import { notifySuccess } from '@/ui/components/toast/notifications';

import { Widget } from '@@/Widget';

export function EnvironmentTagsContent() {
  const tagsQuery = useTags();
  const deleteTags = useDeleteTagsMutation();

  return (
    <div className="space-y-4">
        <CreateTagPanel
          existingNames={tagsQuery.data?.map((tag) => tag.Name)}
        />
        <TagsDatatable
          dataset={tagsQuery.data}
          onRemove={(tags) =>
            deleteTags.mutate(
              tags.map((tag) => tag.ID),
              {
                onSuccess: () =>
                  notifySuccess('Success', 'Tag(s) successfully removed'),
              }
            )
          }
        />
      </div>
  );
}

function CreateTagPanel({ existingNames = [] }: { existingNames?: string[] }) {
  const createTag = useCreateTagMutation();
  const [name, setName] = useState('');
  const trimmedName = name.trim();
  const duplicate = existingNames.includes(trimmedName);

  return (
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
                isLoading={createTag.isLoading}
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
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!trimmedName || duplicate) return;

    createTag.mutate(trimmedName, {
      onSuccess: () => {
        notifySuccess('Success', `Tag ${trimmedName} created`);
        setName('');
      },
    });
  }
}
