import { endpointList } from '@api/sdk.gen';

import { getEnvironments } from './index';

vi.mock('@api/sdk.gen', () => ({ endpointList: vi.fn() }));

beforeEach(() => {
  vi.mocked(endpointList).mockReset();
  vi.mocked(endpointList).mockResolvedValue({
    data: [],
    headers: { 'x-total-count': '12', 'x-total-available': '20' },
  } as unknown as Awaited<ReturnType<typeof endpointList>>);
});

it('preserves identical query defaults for omitted, undefined, and empty options', async () => {
  const omitted = await getEnvironments();
  const explicitUndefined = await getEnvironments(undefined);
  const empty = await getEnvironments({});
  expect(omitted).toEqual(explicitUndefined);
  expect(omitted).toEqual(empty);
  expect(omitted).toMatchObject({ totalCount: 12, totalAvailable: 20 });
  const calls = vi.mocked(endpointList).mock.calls;
  expect(calls[0]).toEqual(calls[1]);
  expect(calls[0]).toEqual(calls[2]);
  expect(calls[0][0]?.query).toMatchObject({ order: 'asc' });
});

it.each([{ tagIds: [] }, { endpointIds: [] }])(
  'keeps empty explicit filters empty instead of fetching everything',
  async (query) => {
    expect(await getEnvironments({ query })).toMatchObject({
      totalCount: 0,
      value: [],
    });
    expect(endpointList).not.toHaveBeenCalled();
  }
);
