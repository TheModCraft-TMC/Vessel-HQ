import {
  DockerSecretDetailsContent,
  DockerSecretDetailsHeader,
} from '@console/console/platform/docker/DockerConfigSecretPages';

export default function Page() {
  return (
    <>
      <DockerSecretDetailsHeader />
      <DockerSecretDetailsContent />
    </>
  );
}
