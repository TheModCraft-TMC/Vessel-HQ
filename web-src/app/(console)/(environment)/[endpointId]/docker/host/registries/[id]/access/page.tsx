import {
  EnvironmentRegistryAccessContent,
  EnvironmentRegistryAccessHeader,
} from '@app/_components/platform/EnvironmentRegistryPages';

export default function Page() {
  return (
    <>
      <EnvironmentRegistryAccessHeader registryListRoute="/:endpointId/docker/host/registries" />
      <EnvironmentRegistryAccessContent />
    </>
  );
}
