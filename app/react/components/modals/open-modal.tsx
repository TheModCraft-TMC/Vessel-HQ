import { ComponentType } from 'react';
import { createRoot } from 'react-dom/client';

import '@reach/dialog/styles.css';
import { OnSubmit } from './Modal/types';

let counter = 0;
export async function openModal<TProps, TResult>(
  Modal: ComponentType<
    { onSubmit: OnSubmit<TResult> } & Omit<TProps, 'onSubmit'>
  >,
  props: TProps = {} as TProps
) {
  const modal = document.createElement('div');
  counter += 1;
  modal.id = `dialog-${counter}`;
  document.body.appendChild(modal);
  const root = createRoot(modal);

  const result = await new Promise<TResult | undefined>((resolve) => {
    root.render(
      // eslint-disable-next-line react/jsx-props-no-spreading
      <Modal {...props} onSubmit={(result) => resolve(result)} />
    );
  });

  root.unmount();
  document.body.removeChild(modal);

  return result;
}
