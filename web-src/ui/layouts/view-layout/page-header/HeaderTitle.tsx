import { ContextHelp } from '@/ui/layouts/view-layout/page-header/ContextHelp';
import { useLayoutIdentity } from '@/ui/layouts/layout-context';

import { useHeaderContext } from './HeaderContainer';
import { NotificationsMenu } from './NotificationsMenu';
import { UserMenu } from './UserMenu';
import { AskAILink } from './AskAILink';

export function HeaderTitle() {
  useHeaderContext();
  const { isBE, ddExtension } = useLayoutIdentity();

  return (
    <div className="flex items-center">
      {isBE && <AskAILink />}
      <NotificationsMenu />
      <ContextHelp />
      {!ddExtension && <UserMenu />}
    </div>
  );
}
