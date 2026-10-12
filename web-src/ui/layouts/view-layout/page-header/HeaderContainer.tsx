import { PropsWithChildren, createContext, useContext } from 'react';

import styles from './HeaderContainer.module.css';

const Context = createContext<null | boolean>(null);
Context.displayName = 'PageHeaderContext';

export function useHeaderContext() {
  const context = useContext(Context);

  if (context == null) {
    throw new Error('Should be nested inside a HeaderContainer component');
  }
}
interface Props {
  id?: string;
}

export function HeaderContainer({ id, children }: PropsWithChildren<Props>) {
  return (
    <Context.Provider value>
      <div
        id={id}
        className={`row ${styles.root}`}
        data-legacy-page-header
      >
        <div id="loadingbar-placeholder" />
        <div className="col-xs-12">
          <div className="flex items-center justify-between [&_div]:truncate">
            {children}
          </div>
        </div>
      </div>
    </Context.Provider>
  );
}
