import {
  addInterval,
  nextOccurrence,
  parseRepeat,
  todayISO,
  type RepeatRule,
} from './recurrence';

const rule = (over: Partial<RepeatRule> = {}): RepeatRule => ({
  every: 1,
  unit: 'week',
  from: 'due',
  ...over,
});

describe('parseRepeat', () => {
  it('reads a complete rule', () => {
    expect(
      parseRepeat({ repeatEvery: 3, repeatUnit: 'day', repeatFrom: 'completion' }),
    ).toEqual({ every: 3, unit: 'day', from: 'completion' });
  });

  it('needs all three columns', () => {
    expect(
      parseRepeat({ repeatEvery: 1, repeatUnit: 'week', repeatFrom: null }),
    ).toBeNull();
    expect(
      parseRepeat({ repeatEvery: null, repeatUnit: 'week', repeatFrom: 'due' }),
    ).toBeNull();
  });

  it('rejects values that would produce nonsense', () => {
    expect(
      parseRepeat({ repeatEvery: 0, repeatUnit: 'week', repeatFrom: 'due' }),
    ).toBeNull();
    expect(
      parseRepeat({ repeatEvery: -2, repeatUnit: 'week', repeatFrom: 'due' }),
    ).toBeNull();
    expect(
      parseRepeat({ repeatEvery: 1, repeatUnit: 'fortnight', repeatFrom: 'due' }),
    ).toBeNull();
  });
});

describe('addInterval', () => {
  it('adds days', () => {
    expect(addInterval('2026-09-21', 3, 'day')).toBe('2026-09-24');
  });

  it('adds weeks', () => {
    expect(addInterval('2026-09-21', 2, 'week')).toBe('2026-10-05');
  });

  it('crosses a month boundary', () => {
    expect(addInterval('2026-09-30', 1, 'day')).toBe('2026-10-01');
  });

  it('crosses a year boundary', () => {
    expect(addInterval('2026-12-30', 3, 'day')).toBe('2027-01-02');
  });

  it('adds months by calendar, not by 30 days', () => {
    expect(addInterval('2026-01-15', 1, 'month')).toBe('2026-02-15');
    expect(addInterval('2026-11-15', 2, 'month')).toBe('2027-01-15');
  });

  it('clamps to the last day when the target month is shorter', () => {
    // Der 3. Maerz waere der Fehler, den man erst im Maerz bemerkt.
    expect(addInterval('2026-01-31', 1, 'month')).toBe('2026-02-28');
    expect(addInterval('2026-03-31', 1, 'month')).toBe('2026-04-30');
  });

  it('knows about leap years', () => {
    expect(addInterval('2028-01-31', 1, 'month')).toBe('2028-02-29');
  });

  it('survives the switch to summer time', () => {
    // In Europa in der Nacht auf den 29. Maerz 2026. Ueber UTC gerechnet
    // darf da kein Tag verrutschen.
    expect(addInterval('2026-03-28', 1, 'day')).toBe('2026-03-29');
    expect(addInterval('2026-03-29', 1, 'day')).toBe('2026-03-30');
  });
});

describe('nextOccurrence', () => {
  const TODAY = '2026-09-21';

  it('counts from the due date when the rhythm is fixed', () => {
    expect(nextOccurrence(rule({ from: 'due' }), '2026-09-21', TODAY)).toBe(
      '2026-09-28',
    );
  });

  it('counts from today when it hangs on the completion', () => {
    // Zwei Wochen zu spaet abgehakt: der naechste Termin haengt am Heute,
    // nicht am alten Plan.
    expect(
      nextOccurrence(rule({ from: 'completion', every: 3, unit: 'day' }), '2026-09-07', TODAY),
    ).toBe('2026-09-24');
  });

  it('skips the missed dates instead of landing in the past', () => {
    // Woechentlich, drei Wochen zu spaet abgehakt. Der naechste Montag soll
    // in der Zukunft liegen, sonst steht die neue Ausgabe sofort als
    // ueberfaellig da.
    const next = nextOccurrence(rule({ from: 'due' }), '2026-08-31', TODAY);
    expect(next > TODAY).toBe(true);
    expect(next).toBe('2026-09-28');
  });

  it('keeps the rhythm while skipping', () => {
    // Vom 31.08. aus bleibt der Wochentag (Montag) erhalten.
    const start = new Date('2026-08-31T00:00:00Z').getUTCDay();
    const next = nextOccurrence(rule({ from: 'due' }), '2026-08-31', TODAY);
    expect(new Date(`${next}T00:00:00Z`).getUTCDay()).toBe(start);
  });

  it('counts from today when there is no due date to move', () => {
    expect(nextOccurrence(rule({ from: 'due' }), null, TODAY)).toBe('2026-09-28');
  });

  it('never returns the same day it is completed on', () => {
    expect(
      nextOccurrence(rule({ from: 'due', every: 1, unit: 'day' }), TODAY, TODAY),
    ).toBe('2026-09-22');
  });
});

describe('todayISO', () => {
  it('formats with padding', () => {
    expect(todayISO(new Date('2026-01-05T23:30:00Z'))).toBe('2026-01-05');
  });
});
