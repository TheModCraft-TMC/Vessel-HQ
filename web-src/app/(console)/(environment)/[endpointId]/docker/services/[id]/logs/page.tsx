import {
  DockerServiceLogsContent,
  DockerServiceLogsHeader,
} from '@console/console/platform/docker/DockerTaskPages';

export default function Page() {
  return (
    <>
      <DockerServiceLogsHeader />
      <DockerServiceLogsContent />
    </>
  );
}
