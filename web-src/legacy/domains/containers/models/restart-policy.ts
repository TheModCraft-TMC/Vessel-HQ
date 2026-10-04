// Enum version of the Docker restart policy.
export enum RestartPolicy {
  No = 'no',
  Always = 'always',
  OnFailure = 'on-failure',
  UnlessStopped = 'unless-stopped',
}
