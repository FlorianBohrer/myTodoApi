import { Test, type TestingModule } from '@nestjs/testing';

import { TodoService } from './todo.service';
import { TODO_REPOSITORY, type TodoRepository } from './todo-repository';
import type { TodoWithCategories } from '../drizzle/schema';

/**
 * Die naechste Ausgabe entsteht beim UEBERGANG auf erledigt.
 *
 * Die Datumsrechnung steht in recurrence.spec.ts. Hier geht es nur um die
 * Frage, WANN angelegt wird — und das ist die Stelle, an der ein Fehler
 * Exemplare vermehrt, statt sie zu verschieben.
 */
function todo(over: Partial<TodoWithCategories> = {}): TodoWithCategories {
  return {
    id: 'todo-1',
    userId: 'user_1',
    title: 'müll runterbringen',
    completed: false,
    isFavorite: false,
    categoryId: null,
    categoryIds: [],
    position: 0,
    timerStartedAt: null,
    timerDurationSeconds: null,
    scheduledDate: '2026-09-21',
    archivedAt: null,
    repeatEvery: 1,
    repeatUnit: 'week',
    repeatFrom: 'due',
    planId: null,
    completedAt: null,
    seriesId: null,
    createdAt: new Date('2026-09-01T00:00:00Z'),
    ...over,
  };
}

/**
 * Der Tag, an dem dieser Test spielt.
 *
 * Vorher las der Test die echte Uhr: scheduledDate stand fest auf dem
 * 21.09., erwartet wurde der 28.09. — und `nextOccurrence` schiebt bei
 * 'due' so lange weiter, bis der Termin in der ZUKUNFT liegt. Ab dem
 * 28.09.2026 war die Erwartung damit falsch, ohne dass sich eine Zeile Code
 * geaendert hatte. Ein Test, der an einem Dienstag umkippt, prueft nicht die
 * Regel, sondern das Datum des Testlaufs.
 */
const TEST_TODAY = new Date('2026-09-22T12:00:00Z');

describe('TodoService, wiederkehrende Aufgaben', () => {
  let service: TodoService;
  let repository: jest.Mocked<Pick<TodoRepository, 'findById' | 'update' | 'createOccurrence'>>;

  beforeEach(async () => {
    repository = {
      findById: jest.fn(),
      update: jest.fn(),
      createOccurrence: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TodoService,
        { provide: TODO_REPOSITORY, useValue: repository },
      ],
    }).compile();

    service = module.get(TodoService);

    // Nur die Uhr festhalten, nicht die Zeitsteuerung: der Dienst wartet auf
    // Promises, und gefaelschte Timer wuerden dabei im Weg stehen.
    jest.useFakeTimers({
      now: TEST_TODAY,
      doNotFake: [
        'nextTick',
        'setImmediate',
        'setTimeout',
        'clearTimeout',
        'setInterval',
        'clearInterval',
      ],
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('legt die naechste Ausgabe an, wenn abgehakt wird', async () => {
    repository.findById.mockResolvedValue(todo({ completed: false }));
    repository.update.mockResolvedValue(todo({ completed: true }));

    await service.updateTodo('user_1', 'todo-1', { completed: true });

    expect(repository.createOccurrence).toHaveBeenCalledTimes(1);
    const [, source, date] = repository.createOccurrence.mock.calls[0];
    expect(source.title).toBe('müll runterbringen');
    expect(date).toBe('2026-09-28');
  });

  it('legt nichts an, wenn es schon erledigt WAR', async () => {
    // Ein zweites PUT mit completed:true darf kein zweites Exemplar erzeugen.
    repository.findById.mockResolvedValue(todo({ completed: true }));
    repository.update.mockResolvedValue(todo({ completed: true }));

    await service.updateTodo('user_1', 'todo-1', { completed: true });

    expect(repository.createOccurrence).not.toHaveBeenCalled();
  });

  it('legt nichts an, wenn der Haken entfernt wird', async () => {
    repository.update.mockResolvedValue(todo({ completed: false }));

    await service.updateTodo('user_1', 'todo-1', { completed: false });

    expect(repository.findById).not.toHaveBeenCalled();
    expect(repository.createOccurrence).not.toHaveBeenCalled();
  });

  it('legt nichts an, wenn gar keine Wiederholung eingestellt ist', async () => {
    const plain = { repeatEvery: null, repeatUnit: null, repeatFrom: null };
    repository.findById.mockResolvedValue(todo({ completed: false, ...plain }));
    repository.update.mockResolvedValue(todo({ completed: true, ...plain }));

    await service.updateTodo('user_1', 'todo-1', { completed: true });

    expect(repository.createOccurrence).not.toHaveBeenCalled();
  });

  it('laesst das Abhaken gelten, auch wenn die naechste Ausgabe scheitert', async () => {
    // Die Wiederholung ist ein Zusatz. Geht sie schief, darf der Nutzer sein
    // Todo trotzdem erledigen koennen.
    repository.findById.mockResolvedValue(todo({ completed: false }));
    repository.update.mockResolvedValue(todo({ completed: true }));
    repository.createOccurrence.mockRejectedValue(new Error('db weg'));

    const result = await service.updateTodo('user_1', 'todo-1', {
      completed: true,
    });

    expect(result.todo.completed).toBe(true);
    expect(result.nextOccurrence).toBeNull();
  });
});
