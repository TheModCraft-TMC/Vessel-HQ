import { testStackDelivery } from '@/core/native-extensions/test-support/stack-delivery-suite';

import Extension from './index';

testStackDelivery(Extension, 'Sync from Git', 'stacks.gitops.sync', 1);
