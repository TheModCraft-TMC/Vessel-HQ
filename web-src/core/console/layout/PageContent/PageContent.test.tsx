import { render } from '@testing-library/react';

import { PageContent } from './PageContent';
import styles from './PageContent.module.css';

test('renders page content with the shared spacing', () => {
  const { getByTestId } = render(
    <PageContent className="custom-class" gap="large">
      <div data-cy="content">Content</div>
    </PageContent>
  );

  const content = getByTestId('content');
  expect(content.parentElement).toHaveClass(
    styles.root,
    styles.gapLarge,
    'custom-class'
  );
});
