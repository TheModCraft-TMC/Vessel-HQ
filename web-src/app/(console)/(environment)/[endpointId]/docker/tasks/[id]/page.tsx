import {
  DockerTaskDetailsContent,
  DockerTaskHeader,
} from '@console/console/platform/docker/DockerTaskPages';

export default function Page() {
  return (
    <>
      <DockerTaskHeader />
      <DockerTaskDetailsContent />
    </>
  );
}
