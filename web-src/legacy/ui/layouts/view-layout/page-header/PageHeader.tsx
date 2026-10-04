import { PropsWithChildren } from 'react';
import { RefreshCw } from 'lucide-react';

import { useLayoutBindings } from '@/ui/layouts/layout-context';
import { Button } from '@/ui/components/buttons';
import { SidebarToggleButton } from '@/ui/layouts/mobile-navigation/SidebarToggleButton';

import { VerticalSeparator } from './VerticalSeparator';
import { Breadcrumbs } from './Breadcrumbs';
import { Crumb } from './Breadcrumbs/Breadcrumbs';
import { HeaderContainer } from './HeaderContainer';
import { HeaderTitle } from './HeaderTitle';
import { PageTitle } from './PageTitle';

interface Props {
  id?: string;
  reload?: boolean;
  loading?: boolean;
  onReload?(): Promise<void> | void;
  breadcrumbs?: (Crumb | string)[] | string;
  title?: string;
  /** Render the visible page title row. Defaults to true when title is provided.
   * Set to false on screens that display the title via another component (e.g.
   * `ResourceDetailHeader`) to avoid showing it twice. */
  showTitle?: boolean;
}

export function PageHeader({
  id,
  title,
  breadcrumbs = [],
  reload,
  loading,
  onReload,
  showTitle = !!title,
  children,
}: PropsWithChildren<Props>) {
  const { reload: reloadLayout } = useLayoutBindings();

  return (
    <>
      <HeaderContainer id={id}>
        <div className="flex min-w-0 items-center">
          <SidebarToggleButton />
          <VerticalSeparator />
          <Breadcrumbs breadcrumbs={breadcrumbs} />
        </div>
        <HeaderTitle />
      </HeaderContainer>

      {showTitle && title && (
        <PageTitle title={title}>
          {(reload || children) && (
            <div className="ml-auto flex items-center gap-2">
              {reload && (
                <Button
                  color="none"
                  size="large"
                  onClick={onClickedRefresh}
                  className="m-0 p-0 focus:text-inherit"
                  disabled={loading}
                  title="Refresh page"
                  data-cy="refresh-page-button"
                >
                  <RefreshCw className="icon" />
                </Button>
              )}
              {children}
            </div>
          )}
        </PageTitle>
      )}
    </>
  );

  function onClickedRefresh() {
    return onReload ? onReload() : reloadLayout();
  }
}
