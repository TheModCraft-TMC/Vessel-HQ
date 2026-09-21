import type { Environment } from '@/domains/environments';
import { isEdgeEnvironment } from '@/react/portainer/environments/utils';

export function EnvironmentURL({ environment }: { environment: Environment }) {
  if (isEdgeEnvironment(environment.Type)) {
    return null;
  }

  return (
    <span className="small text-muted vertical-center">{environment.URL}</span>
  );
}
