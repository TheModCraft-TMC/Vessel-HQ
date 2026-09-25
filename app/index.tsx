import './assets/css';
import './i18n';

import { hydrateRoot } from 'react-dom/client';

import { Edition } from '@/react/portainer/feature-flags/enums';
import { init as initFeatureService } from '@/react/portainer/feature-flags/feature-flags.service';
import { applyTheme } from '@/core/theme/applyTheme';

import { ClientApp } from './core/ClientApp';

const RESIZE_OBSERVER_LOOP_ERROR_MESSAGES = [
  'ResizeObserver loop completed with undelivered notifications.',
  'ResizeObserver loop limit exceeded',
];

window.addEventListener('error', (event) => {
  if (RESIZE_OBSERVER_LOOP_ERROR_MESSAGES.includes(event.message)) {
    event.stopImmediatePropagation();
  }
});

if (window.origin === 'http://localhost:49000') {
  document
    .getElementById('base')
    ?.setAttribute('href', 'http://localhost:49000/');
  window.ddExtension = true;
} else {
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
  document
    .getElementById('base')
    ?.setAttribute('href', path ? `/${path}/` : '/');
}

void initFeatureService(Edition[process.env.PORTAINER_EDITION]);
applyTheme('auto');

const root = document.getElementById('root');
if (!root) {
  throw new Error('Vessel HQ root element is missing');
}

hydrateRoot(root, <ClientApp />);
