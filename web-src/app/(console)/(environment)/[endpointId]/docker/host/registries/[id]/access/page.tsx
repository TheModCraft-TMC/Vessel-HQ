import {
  EnvironmentRegistryAccessContent,
  EnvironmentRegistryAccessHeader,
} from '@console/console/platform/EnvironmentRegistryPages';

export default function Page() {
  return (
    <>
      <EnvironmentRegistryAccessHeader registryListRoute="/:endpointId/docker/host/registries" />
      <EnvironmentRegistryAccessContent />
    </>
  );
}
