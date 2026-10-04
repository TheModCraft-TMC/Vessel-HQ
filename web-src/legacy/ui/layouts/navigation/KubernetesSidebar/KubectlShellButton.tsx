import { Terminal } from 'lucide-react';
import clsx from 'clsx';
import { v4 as uuidv4 } from 'uuid';

import { Button } from '@/ui/components/buttons';
import { useLayoutBindings } from '@/ui/layouts/layout-context';

import { useSidebarState } from '../useSidebarState';
import { SidebarTooltip } from '../SidebarItem/SidebarTooltip';

interface Props {
  environmentId: number;
}
export function KubectlShellButton({ environmentId }: Props) {
  const { isOpen: isSidebarOpen } = useSidebarState();
  const { baseHref } = useLayoutBindings() as ReturnType<
    typeof useLayoutBindings
  > & {
    baseHref: () => string;
  };

  const button = (
    <Button
      color="primary"
      size="small"
      data-cy="k8sSidebar-shellButton"
      onClick={() => handleOpen()}
      className={clsx('sidebar', !isSidebarOpen && '!p-1')}
      icon={Terminal}
    >
      {isSidebarOpen ? 'kubectl shell' : ''}
    </Button>
  );

  return (
    <>
      {!isSidebarOpen && (
        <SidebarTooltip
          content={
            <span className="whitespace-nowrap text-sm">Kubectl Shell</span>
          }
        >
          <span className="flex w-full justify-center">{button}</span>
        </SidebarTooltip>
      )}
      {isSidebarOpen && button}
    </>
  );

  function handleOpen() {
    const basePath = baseHref().replace(/\/?$/, '/');
    const url = new URL(
      `${basePath}${environmentId}/kubernetes/kubectl-shell`,
      window.location.origin
    );
    window.open(
      url.toString(),
      // give the window a unique name so that more than one can be opened
      `kubectl-shell-${environmentId}-${uuidv4()}`,
      'width=800,height=600'
    );
  }
}
