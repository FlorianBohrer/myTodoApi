import {
  readTranslations,
  translateSystemPrompt,
  translateUserMessage,
} from './translate';

describe('readTranslations', () => {
  it('takes a list with one translation per item', () => {
    expect(readTranslations('{"translations":["Goals","Budget"]}', 2)).toEqual([
      'Goals',
      'Budget',
    ]);
  });

  it('rejects a list of the wrong length — it could not be matched to the blocks', () => {
    expect(readTranslations('{"translations":["Goals"]}', 2)).toBeNull();
    expect(readTranslations('{"translations":["a","b","c"]}', 2)).toBeNull();
  });

  it('rejects anything that is not the agreed shape', () => {
    expect(readTranslations('not json', 1)).toBeNull();
    expect(readTranslations('{"text":"Goals"}', 1)).toBeNull();
    expect(readTranslations('{"translations":[1]}', 1)).toBeNull();
    expect(readTranslations('null', 1)).toBeNull();
  });
});

describe('prompt', () => {
  it('names the target language and keeps wiki links and diagram syntax', () => {
    const prompt = translateSystemPrompt('en');
    expect(prompt).toContain('into English');
    expect(prompt).toContain('[[double brackets]]');
    expect(prompt).toContain('"mermaid"');
    expect(translateSystemPrompt('de')).toContain('into German');
  });

  it('sends only text and kind, as JSON', () => {
    const message = translateUserMessage([{ text: 'Ziele', kind: 'text' }]);
    expect(JSON.parse(message)).toEqual([{ text: 'Ziele', kind: 'text' }]);
  });
});
