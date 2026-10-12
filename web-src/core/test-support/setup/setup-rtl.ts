import { cleanup, configure } from '@testing-library/react';

import { configureTestNavigation } from '../next-navigation';

configure({ testIdAttribute: 'data-cy' });

beforeEach(() => {
  configureTestNavigation();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
