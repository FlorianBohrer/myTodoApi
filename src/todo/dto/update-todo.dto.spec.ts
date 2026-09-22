import { ValidationPipe } from '@nestjs/common';

import { UpdateTodoDto } from './update-todo.dto';

/**
 * Kommt die Wiederholung ueberhaupt durch die Validierung?
 *
 * Die globale ValidationPipe laeuft mit whitelist: true und entfernt alles,
 * was am DTO nicht ausdruecklich deklariert ist. Was hier herausfaellt, kommt
 * in der Datenbank nie an — und zwar lautlos, ohne Fehler und ohne Log.
 * Genau diese Luecke ist von aussen nicht zu sehen.
 */
describe('UpdateTodoDto durch die ValidationPipe', () => {
  const pipe = new ValidationPipe({ whitelist: true });
  const meta = {
    type: 'body' as const,
    metatype: UpdateTodoDto,
    data: '',
  };

  it('laesst eine vollstaendige Wiederholungsregel durch', async () => {
    const out = await pipe.transform(
      { repeatEvery: 1, repeatUnit: 'week', repeatFrom: 'due' },
      meta,
    );

    expect(out).toMatchObject({
      repeatEvery: 1,
      repeatUnit: 'week',
      repeatFrom: 'due',
    });
  });

  it('laesst das Abschalten durch (alle drei null)', async () => {
    const out = await pipe.transform(
      { repeatEvery: null, repeatUnit: null, repeatFrom: null },
      meta,
    );

    expect(out).toMatchObject({
      repeatEvery: null,
      repeatUnit: null,
      repeatFrom: null,
    });
  });

  it('laesst den Haken zusammen mit nichts anderem durch', async () => {
    const out = await pipe.transform({ completed: true }, meta);

    expect(out).toEqual({ completed: true });
  });

  it('wirft Erfundenes weg, statt es an die Datenbank zu reichen', async () => {
    const out = await pipe.transform(
      { completed: true, userId: 'fremd', archivedAt: 'jetzt' },
      meta,
    );

    expect(out).toEqual({ completed: true });
  });

  it('weist eine unbekannte Einheit ab', async () => {
    await expect(
      pipe.transform({ repeatEvery: 1, repeatUnit: 'fortnight', repeatFrom: 'due' }, meta),
    ).rejects.toThrow();
  });
});
