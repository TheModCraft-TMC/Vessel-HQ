import { HelpCircle } from 'lucide-react';
import clsx from 'clsx';

import { useLayoutBindings } from '@/ui/layouts/layout-context';

import headerStyles from './HeaderTitle.module.css';

export function ContextHelp() {
  const { docsUrl } = useLayoutBindings();

  return (
    <div className={headerStyles.menuButton}>
      <a
        href={docsUrl}
        target="_blank"
        color="none"
        className={clsx(
          headerStyles.menuIcon,
          'icon-badge mr-1 cursor-pointer !p-2 text-lg',
          'text-gray-8',
          'th-dark:text-gray-warm-7'
        )}
        title="Documentation"
        rel="noreferrer"
        data-cy="context-help-button"
      >
        <HelpCircle className="lucide" />
      </a>
    </div>
  );
}

export function useDocsUrl(doc?: string): string {
  const { docsUrl } = useLayoutBindings();
  return doc ? docsUrl + doc : docsUrl;
}
