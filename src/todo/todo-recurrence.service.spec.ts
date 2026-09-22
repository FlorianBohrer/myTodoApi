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
    createdAt: new Date('2026-09-01T00:00:00Z'),
    ...over,
  };
}

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

    expect(result.completed).toBe(true);
  });
});
