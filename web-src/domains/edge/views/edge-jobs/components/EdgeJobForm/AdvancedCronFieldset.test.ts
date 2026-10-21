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

  it('rejects a long digit run without backtracking', () => {
    const start = performance.now();

    expect(cronRegex.test(`${'1'.repeat(50_000)}x`)).toBe(false);
    expect(performance.now() - start).toBeLessThan(500);
  });
});
