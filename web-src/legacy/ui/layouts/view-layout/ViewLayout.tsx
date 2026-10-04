import { PropsWithChildren } from 'react';

export function ViewLayout({ children }: PropsWithChildren) {
  return <div className="view-layout">{children}</div>;
}
