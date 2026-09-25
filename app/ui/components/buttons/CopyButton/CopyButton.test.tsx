import { fireEvent, render } from '@testing-library/react';

import { CopyButton } from './CopyButton';

function mockClipboard() {
  vi.stubGlobal('isSecureContext', true);
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
  return { writeText };
}

test('should display a CopyButton with children', async () => {
  const children = 'test button children';
  const { findByText } = render(
    <CopyButton copyText="" data-cy="copy-button">
      {children}
    </CopyButton>
  );

  const button = await findByText(children);
  expect(button).toBeTruthy();
});

test('CopyButton should copy text to clipboard', async () => {
  const { writeText } = mockClipboard();

  const children = 'button';
  const copyText = 'text successfully copied to clipboard';
  const { findByText } = render(
    <CopyButton copyText={copyText} data-cy="copy-button">
      {children}
    </CopyButton>
  );

  const button = await findByText(children);
  expect(button).toBeTruthy();

  fireEvent.click(button);
  expect(writeText).toHaveBeenCalledWith(copyText);
});
