import { it } from 'vitest';

import { stackDeliveryCases } from '@/core/native-extensions/test-support/stack-delivery-suite';

import Extension from './index';

it.each(
  stackDeliveryCases(Extension, 'Sync from Git', 'stacks.gitops.sync', 1)
)('$name', ({ assertCase }) => assertCase());
