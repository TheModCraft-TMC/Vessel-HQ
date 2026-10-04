import { describe, expect, it } from 'vitest';

import { getDockerSystemCapabilities } from '../index';

describe('getDockerSystemCapabilities', () => {
  it('detects Windows standalone hosts and applies system limits', () => {
    expect(
      getDockerSystemCapabilities({
        OSType: 'windows',
        NCPU: 4,
        MemTotal: 8_000_000_000,
      })
    ).toEqual({
      isWindows: true,
      isStandalone: true,
      isSwarm: false,
      isSwarmManager: false,
      maxCpu: 4,
      maxMemory: 8000,
    });
  });

  it('detects Swarm managers separately from Swarm workers', () => {
    expect(
      getDockerSystemCapabilities({
        OSType: 'linux',
        Swarm: { NodeID: 'node-id', ControlAvailable: true },
      })
    ).toMatchObject({
      isStandalone: false,
      isSwarm: true,
      isSwarmManager: true,
    });
  });

  it('detects Swarm workers and uses safe resource defaults', () => {
    expect(
      getDockerSystemCapabilities({
        Swarm: { NodeID: 'worker-id', ControlAvailable: false },
      })
    ).toEqual({
      isWindows: false,
      isStandalone: false,
      isSwarm: true,
      isSwarmManager: false,
      maxCpu: 32,
      maxMemory: 32768,
    });
  });
});
