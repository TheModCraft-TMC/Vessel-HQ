import type { ApplicationBindings } from '../bindings';

import type { DomainComposition } from './types';

export function createDomainComposition(
  bindings: ApplicationBindings
): DomainComposition {
  return { bindings };
}
