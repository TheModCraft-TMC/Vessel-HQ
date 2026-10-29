import { ContainerStatsViewModel } from './container-stats';

describe('container working memory and block I/O', () => {
  it.each([
    [{ inactive_file: 400 }, 600, 400],
    [{ total_inactive_file: 300, cache: 500 }, 700, 300],
    [{ cache: 200 }, 800, 200],
    [{ inactive_file: 2000 }, 1000, 0],
    [{}, 1000, 0],
  ])('subtracts the applicable bounded cache %j', (stats, usage, cache) => {
    const model = new ContainerStatsViewModel({
      memory_stats: { usage: 1000, stats },
    });
    expect(model.MemoryUsage).toBe(usage);
    expect(model.MemoryCache).toBe(cache);
  });

  it('preserves Podman and Windows memory reporting', () => {
    expect(
      new ContainerStatsViewModel({ memory_stats: { usage: 1000 } }).MemoryUsage
    ).toBe(1000);
    const windows = new ContainerStatsViewModel({
      memory_stats: {
        privateworkingset: 500,
        usage: 1000,
        stats: { cache: 400 },
      },
    });
    expect(windows.MemoryUsage).toBe(500);
    expect(windows.MemoryCache).toBe(0);
    expect(windows.isWindows).toBe(true);
  });

  it('sums multiple devices regardless of order and ignores totals', () => {
    const counters = [
      { op: 'Read', value: 10 },
      { op: 'write', value: 20 },
      { op: 'read', value: 30 },
      { op: 'Write', value: 40 },
      { op: 'Total', value: 100 },
    ];
    for (const entries of [counters, [...counters].reverse()]) {
      const model = new ContainerStatsViewModel({
        blkio_stats: {
          io_service_bytes_recursive: entries.map((entry, index) => ({
            major: 8,
            minor: index,
            ...entry,
          })),
        },
      });
      expect(model.BytesRead).toBe(40);
      expect(model.BytesWrite).toBe(60);
      expect(model.noIOdata).toBe(false);
    }
    expect(new ContainerStatsViewModel({}).noIOdata).toBe(true);
    expect(
      new ContainerStatsViewModel({
        blkio_stats: { io_service_bytes_recursive: [] },
      }).noIOdata
    ).toBe(true);
  });
});
