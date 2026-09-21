import { DEFAULT_DAILY_LIMIT, resolveDailyLimit } from './ai-quota.service';

describe('resolveDailyLimit', () => {
  it('takes a positive whole number from the environment', () => {
    expect(resolveDailyLimit('25')).toBe(25);
    expect(resolveDailyLimit(' 25 ')).toBe(25);
  });

  it('falls back when nothing is configured', () => {
    expect(resolveDailyLimit(undefined)).toBe(DEFAULT_DAILY_LIMIT);
    expect(resolveDailyLimit(null)).toBe(DEFAULT_DAILY_LIMIT);
    expect(resolveDailyLimit('')).toBe(DEFAULT_DAILY_LIMIT);
    expect(resolveDailyLimit('   ')).toBe(DEFAULT_DAILY_LIMIT);
  });

  it('refuses values that would quietly switch the cap off', () => {
    // Number('abc') ist NaN, und jeder Vergleich mit NaN ist falsch — ein
    // Tippfehler haette den Deckel sonst wirkungslos gemacht.
    expect(resolveDailyLimit('abc')).toBe(DEFAULT_DAILY_LIMIT);
    expect(resolveDailyLimit('0')).toBe(DEFAULT_DAILY_LIMIT);
    expect(resolveDailyLimit('-5')).toBe(DEFAULT_DAILY_LIMIT);
    expect(resolveDailyLimit('12.5')).toBe(DEFAULT_DAILY_LIMIT);
  });
});
