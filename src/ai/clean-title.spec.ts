import { cleanTitle, MAX_TITLE_LENGTH } from './ai.service';

describe('cleanTitle', () => {
  it('passes a well-formed title through unchanged', () => {
    expect(cleanTitle('Umzug nach Hamburg')).toBe('Umzug nach Hamburg');
    expect(cleanTitle('Sprint planning')).toBe('Sprint planning');
  });

  it('keeps umlauts and accents intact', () => {
    expect(cleanTitle('Küche über Ostern')).toBe('Küche über Ostern');
  });

  it('treats NONE as "nothing to say"', () => {
    expect(cleanTitle('NONE')).toBeNull();
    expect(cleanTitle('none')).toBeNull();
    expect(cleanTitle('  None  ')).toBeNull();
  });

  it('returns null for an empty or blank answer', () => {
    expect(cleanTitle('')).toBeNull();
    expect(cleanTitle('   ')).toBeNull();
    expect(cleanTitle('\n\n')).toBeNull();
  });

  it('takes only the first line when the model keeps talking', () => {
    expect(cleanTitle('Umzug nach Hamburg\n\nIch habe das so gewählt, weil…'))
      .toBe('Umzug nach Hamburg');
  });

  it('strips a markdown heading marker', () => {
    expect(cleanTitle('## Umzug nach Hamburg')).toBe('Umzug nach Hamburg');
    expect(cleanTitle('#Umzug')).toBe('Umzug');
  });

  it('strips quotes in the shapes a model actually produces', () => {
    expect(cleanTitle('"Umzug nach Hamburg"')).toBe('Umzug nach Hamburg');
    expect(cleanTitle("'Umzug nach Hamburg'")).toBe('Umzug nach Hamburg');
    expect(cleanTitle('„Umzug nach Hamburg“')).toBe('Umzug nach Hamburg');
    expect(cleanTitle('»Umzug nach Hamburg«')).toBe('Umzug nach Hamburg');
  });

  it('drops a trailing period or colon', () => {
    expect(cleanTitle('Umzug nach Hamburg.')).toBe('Umzug nach Hamburg');
    expect(cleanTitle('Umzug nach Hamburg:')).toBe('Umzug nach Hamburg');
  });

  it('shortens an over-long title instead of letting it break the tab', () => {
    const long = 'Ein ausschweifender Titel, der viel zu lang für eine Lasche ist';
    const result = cleanTitle(long)!;
    expect(result.length).toBeLessThanOrEqual(MAX_TITLE_LENGTH + 1); // + das Auslassungszeichen
    expect(result.endsWith('…')).toBe(true);
    expect(result.trimEnd()).toBe(result); // kein Leerzeichen vor dem Zeichen
  });

  it('leaves a title at exactly the limit alone', () => {
    const exact = 'x'.repeat(MAX_TITLE_LENGTH);
    expect(cleanTitle(exact)).toBe(exact);
  });

  it('returns null when nothing survives the stripping', () => {
    expect(cleanTitle('###')).toBeNull();
    expect(cleanTitle('"."')).toBeNull();
  });
});
