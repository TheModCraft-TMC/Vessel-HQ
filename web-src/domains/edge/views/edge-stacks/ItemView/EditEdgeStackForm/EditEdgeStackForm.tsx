import { EdgeStack } from '@/domains/edge/models/edge-stack';

import { GitForm } from './GitForm';
import { NonGitStackForm } from './NonGitStackForm';

export function EditEdgeStackForm({ edgeStack }: { edgeStack: EdgeStack }) {
  if (edgeStack.GitConfig) {
    return <GitForm stack={edgeStack} />;
  }

  return <NonGitStackForm edgeStack={edgeStack} />;
}
