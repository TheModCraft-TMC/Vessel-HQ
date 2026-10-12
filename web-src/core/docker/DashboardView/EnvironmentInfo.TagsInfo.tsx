import _ from 'lodash';

import { useTags } from '@/domains/tags';
import { DetailsTable } from '@/ui/components/DetailsTable';

export function TagsInfo({ ids }: { ids: number[] }) {
  const tagsQuery = useTags();

  if (!tagsQuery.data) {
    return null;
  }

  const tags = tagsQuery.data;

  const tagNameList = ids.length
    ? _.compact(
        ids
          .map((id) => {
            const tag = tags.find((tag) => tag.ID === id);
            return tag ? tag.Name : '';
          })
          .join(', ')
      )
    : '-';

  return <DetailsTable.Row label="Tags">{tagNameList}</DetailsTable.Row>;
}
