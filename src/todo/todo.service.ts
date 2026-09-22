
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import type { TodoWithCategories } from '../drizzle/schema';
import type { Filter } from './todo.model';
import type { CreateTodoDto } from './dto/create-todo.dto';
import type { UpdateTodoDto } from './dto/update-todo.dto';

import {
  TODO_REPOSITORY,
  type TodoRepository,
} from '../../src/todo/todo-repository';
import { nextOccurrence, parseRepeat, todayISO } from './recurrence';


@Injectable()
export class TodoService {
  private readonly logger = new Logger(TodoService.name);

  constructor(
    @Inject(TODO_REPOSITORY)
    private readonly repository: TodoRepository,
  ) {}

  async findAll(
    userId: string,
    filter: Filter,
    includeArchived = false,
  ): Promise<TodoWithCategories[]> {
    const items = await this.repository.findAll(userId, { includeArchived });

    if (filter === 'active') {
      return items.filter((todo) => !todo.completed);
    }

    if (filter === 'completed') {
      return items.filter((todo) => todo.completed);
    }

    return items;
  }

  async findById(userId: string, id: string): Promise<TodoWithCategories> {
    const todo = await this.repository.findById(userId, id);

    if (!todo) {
      throw new NotFoundException('Todo not found');
    }

    return todo;
  }

async createTodo(
  userId: string,
  dto: CreateTodoDto,
): Promise<TodoWithCategories> {
  await this.assertCategoryOwnership(
    userId,
    dto.categoryId,
  );

  return this.repository.create(userId, dto);
}

  async reorder(userId: string, ids: string[]): Promise<void> {
    return this.repository.reorder(userId, ids);
  }

 async updateTodo(
  userId: string,
  id: string,
  dto: UpdateTodoDto,
): Promise<TodoWithCategories> {
  await this.assertCategoryOwnership(
    userId,
    dto.categoryId,
  );

  // Vorher lesen, aber nur wenn es sein muss: die naechste Ausgabe einer
  // wiederkehrenden Aufgabe entsteht beim UEBERGANG auf erledigt. Ohne den
  // Vorzustand koennte ein zweites PUT mit completed:true ein zweites
  // Exemplar anlegen.
  const before =
    dto.completed === true
      ? await this.repository.findById(userId, id)
      : null;

  const todo = await this.repository.update(
    userId,
    id,
    dto,
  );

  if (!todo) {
    throw new NotFoundException('Todo not found');
  }

  if (before && !before.completed && todo.completed) {
    await this.spawnNextOccurrence(userId, todo);
  }

  return todo;
}

/**
 * Archivieren oder zurueckholen.
 */
async setArchived(
  userId: string,
  id: string,
  archived: boolean,
): Promise<TodoWithCategories> {
  const todo = await this.repository.setArchived(userId, id, archived);

  if (!todo) {
    throw new NotFoundException('Todo not found');
  }

  return todo;
}

/** Alles Erledigte auf einmal weglegen. Gibt zurueck, wie viele es waren. */
async archiveCompleted(userId: string): Promise<number> {
  return this.repository.archiveCompleted(userId);
}

/**
 * Die naechste Ausgabe anlegen, wenn eine wiederkehrende Aufgabe abgehakt
 * wurde.
 *
 * Das erledigte Exemplar bleibt stehen. Es waere einfacher, dieselbe Zeile
 * einfach weiterzuschieben, aber dann verschwaende jedes Mal die Historie —
 * und genau die braucht die Ansicht oben, um zu sagen, wie viel man an einem
 * geplanten Tag ueblicherweise schafft. Das Archiv raeumt die alten Exemplare
 * spaeter weg.
 *
 * Schlaegt das Anlegen fehl, bleibt das Abhaken trotzdem bestehen: die
 * Wiederholung ist ein Zusatz, kein Teil des Hakens. Ein Fehler hier darf
 * nicht dazu fuehren, dass der Nutzer sein Todo nicht erledigen kann.
 */
private async spawnNextOccurrence(
  userId: string,
  completed: TodoWithCategories,
): Promise<void> {
  const rule = parseRepeat(completed);
  if (!rule) return;

  try {
    const next = nextOccurrence(rule, completed.scheduledDate, todayISO());
    await this.repository.createOccurrence(userId, completed, next);
  } catch (error) {
    this.logger.error('Naechste Ausgabe konnte nicht angelegt werden', error as Error);
  }
}

  /**
   * Startet einen Zeitblock (durationSeconds gesetzt) oder beendet ihn (null).
   * Der Startzeitpunkt kommt vom Server, damit die Restzeit unabhängig von der
   * Uhr des Browsers stimmt.
   */
  async setTimer(
    userId: string,
    id: string,
    durationSeconds: number | null,
  ): Promise<TodoWithCategories> {
    const startedAt = durationSeconds === null ? null : new Date();

    const todo = await this.repository.setTimer(
      userId,
      id,
      startedAt,
      durationSeconds,
    );

    if (!todo) {
      throw new NotFoundException('Todo not found');
    }

    return todo;
  }

  /** Setzt die komplette Label-Menge eines Todos (n:m). */
  async setCategories(
    userId: string,
    id: string,
    categoryIds: string[],
  ): Promise<TodoWithCategories> {
    const uniqueIds = [...new Set(categoryIds)];

    // Jedes Label muss dem Nutzer gehören — kein Fremd-Label unterjubeln.
    for (const categoryId of uniqueIds) {
      await this.assertCategoryOwnership(userId, categoryId);
    }

    const todo = await this.repository.setCategories(userId, id, uniqueIds);

    if (!todo) {
      throw new NotFoundException('Todo not found');
    }

    return todo;
  }

  async deleteTodo(userId: string, id: string): Promise<void> {
    const deleted = await this.repository.delete(userId, id);

    if (!deleted) {
      throw new NotFoundException('Todo not found');
    }
  }
  private async assertCategoryOwnership(
  userId: string,
  categoryId: string | null | undefined,
): Promise<void> {
  if (categoryId === null || categoryId === undefined) {
    return;
  }

  const belongsToUser =
    await this.repository.categoryBelongsToUser(
      userId,
      categoryId,
    );

  if (!belongsToUser) {
    throw new BadRequestException(
      'Category does not exist for this user',
    );
  }
}

}

