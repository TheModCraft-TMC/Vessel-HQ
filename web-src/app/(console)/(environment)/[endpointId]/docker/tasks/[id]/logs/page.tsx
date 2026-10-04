import {
  DockerTaskHeader,
  DockerTaskLogsContent,
} from '@console/console/platform/docker/DockerTaskPages';

export default function Page() {
  return (
    <>
      <DockerTaskHeader logs />
      <DockerTaskLogsContent />
    </>
  );
}
