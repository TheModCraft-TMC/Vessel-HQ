import { CellContext } from '@tanstack/react-table';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { buildHref } from '@console/console/routing/buildHref';

import type { ContainerListViewModel } from '@/domains/containers/types';

import { columnHelper } from './helper';

export const image = columnHelper.accessor('Image', {
  header: 'Image',
  id: 'image',
  cell: ImageCell,
});

function ImageCell({ getValue }: CellContext<ContainerListViewModel, string>) {
  const imageName = getValue();
  const pathname = usePathname();
  const href = buildHref(
    '/:endpointId/docker/images/:id',
    { id: imageName },
    pathname
  );
  const shortImageName = trimSHASum(imageName);

  return <Link href={href}>{shortImageName}</Link>;

  function trimSHASum(imageName: string) {
    if (!imageName) {
      return '';
    }

    if (imageName.indexOf('sha256:') === 0) {
      return imageName.substring(7, 19);
    }

    return imageName.split('@sha256')[0];
  }
}
