import { describe, expect, it } from 'vitest';

import { zEndpointForceUpdateServiceResponse } from '@/core/generated-api/portainer/zod.gen';

describe('generated service force-update response contract', () => {
  // Docker's SDK distinguishes nil (null), empty, and populated warning slices.
  // Regeneration must not make its runtime validator reject valid API responses.
  it.each([
    ['omitted warnings', {}],
    ['nil warnings', { Warnings: null }],
    ['empty warnings', { Warnings: [] }],
    ['populated warnings', { Warnings: ['fixture warning'] }],
  ])('preserves %s', (_name, wire) => {
    expect(zEndpointForceUpdateServiceResponse.parse(wire)).toEqual(wire);
  });

  it('still rejects malformed warnings', () => {
    for (const Warnings of ['not an array', [123]]) {
      expect(
        zEndpointForceUpdateServiceResponse.safeParse({ Warnings }).success
      ).toBe(false);
    }
  });
});
