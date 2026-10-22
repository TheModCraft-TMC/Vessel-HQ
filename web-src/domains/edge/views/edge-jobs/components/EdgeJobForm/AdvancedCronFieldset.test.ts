import { cronRegex, cronValidation } from './AdvancedCronFieldset';

describe('cronValidation', () => {
  it.each([
    '0 0 * * *',
    '*/5 * * * *',
    '1,2,3 4-5 6/7 * * *',
    '0 0 1 1 * 2024',
    '@daily',
    '@every 1h30m',
  ])('accepts %s', (value) => {
    expect(cronValidation().isValidSync(value)).toBe(true);
  });

  it.each(['', 'abc', '1 2 3', '@every', '* * *'])('rejects %s', (value) => {
    expect(cronValidation().isValidSync(value)).toBe(false);
  });

  it.each([
    ['digit run', `${'1'.repeat(50_000)}x`],
    ['numeric list', `${'1,'.repeat(50_000)}1x`],
    ['list after incomplete fields', `0 0 0 ${'1,'.repeat(50_000)}1x`],
    ['list after a range', `1-${'1,'.repeat(50_000)}1x`],
  ])('rejects a long %s without repeated scanning', (_label, value) => {
    const start = performance.now();

    expect(cronRegex.test(value)).toBe(false);
    expect(performance.now() - start).toBeLessThan(500);
  });

  it('still accepts a long valid numeric list promptly', () => {
    const value = `${'1,'.repeat(50_000)}1 2 3 * *`;
    const start = performance.now();

    expect(cronValidation().isValidSync(value)).toBe(true);
    expect(performance.now() - start).toBeLessThan(500);
  });
});
