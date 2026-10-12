import type { ComponentType } from 'react';
import { createRoot } from 'react-dom/client';

import type { OnSubmit } from './Modal';

let counter = 0;

export async function openModal<TProps, TResult>(
  ModalComponent: ComponentType<
    { onSubmit: OnSubmit<TResult> } & Omit<TProps, 'onSubmit'>
  >,
  props: TProps = {} as TProps
) {
  const container = document.createElement('div');
  container.id = `dialog-${++counter}`;
  document.body.appendChild(container);
  const root = createRoot(container);

  try {
    return await new Promise<TResult | undefined>((resolve) => {
      root.render(
        <ModalComponent
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...props}
          onSubmit={(result) => resolve(result)}
        />
      );
    });
  } finally {
    root.unmount();
    container.remove();
  }
}
