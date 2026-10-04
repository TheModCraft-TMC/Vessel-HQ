import {
  DockerConfigDetailsContent,
  DockerConfigDetailsHeader,
} from '@console/console/platform/docker/DockerConfigSecretPages';

export default function Page() {
  return (
    <>
      <DockerConfigDetailsHeader />
      <DockerConfigDetailsContent />
    </>
  );
}
