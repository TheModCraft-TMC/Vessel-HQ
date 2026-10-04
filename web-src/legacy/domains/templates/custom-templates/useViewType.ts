import { usePathname } from 'next/navigation';

export type TemplateViewType = 'kube' | 'docker' | 'edge';

export function useViewType(): TemplateViewType {
  const pathname = usePathname();
  if (pathname.includes('/kubernetes/')) {
    return 'kube';
  }

  if (pathname.includes('/docker/')) {
    return 'docker';
  }

  if (pathname.startsWith('/edge/')) {
    return 'edge';
  }

  throw new Error(`Unknown view type for path: ${pathname}`);
}
