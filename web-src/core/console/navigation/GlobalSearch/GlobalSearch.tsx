'use client';

import { Search } from 'lucide-react';
import { lazy, Suspense, useEffect, useState } from 'react';

import styles from './GlobalSearch.module.css';

const GlobalSearchDialog = lazy(() =>
  import('./GlobalSearchDialog').then((module) => ({
    default: module.GlobalSearchDialog,
  }))
);

export function GlobalSearch() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isEditing =
        target?.isContentEditable ||
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName || '');
      const isSearchShortcut =
        (!isEditing && event.key === '/') ||
        ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k');

      if (!isSearchShortcut) return;
      event.preventDefault();
      setOpen(true);
    }

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  return (
    <>
      <button
        className={styles.trigger}
        type="button"
        aria-label="Open global search"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Search aria-hidden size={16} />
        <span className={styles.triggerLabel}>Search</span>
        <kbd>/</kbd>
      </button>
      {open && (
        <Suspense fallback={null}>
          <GlobalSearchDialog onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </>
  );
}

export { buildSearchItems } from './searchItems';
