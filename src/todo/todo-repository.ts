import type { TodoWithCategories } from '../drizzle/schema';
import type { CreateTodoDto } from './dto/create-todo.dto';
import type { UpdateTodoDto } from './dto/update-todo.dto';

export const TODO_REPOSITORY = Symbol('TODO_REPOSITORY');

export interface TodoRepository {
  /**
   * Alle Todos des Nutzers. Archivierte bleiben draussen, ausser sie werden
   * ausdruecklich verlangt — das Archiv ist ein eigener Blick, kein Teil der
   * taeglichen Liste.
   */
  findAll(
    userId: string,
    options?: { includeArchived?: boolean },
  ): Promise<TodoWithCategories[]>;
  findById(userId: string, id: string): Promise<TodoWithCategories | null>;

  categoryBelongsToUser(
    userId: string,
    categoryId: string,
  ): Promise<boolean>;

  create(userId: string, dto: CreateTodoDto): Promise<TodoWithCategories>;

  update(
    userId: string,
    id: string,
    dto: UpdateTodoDto,
  ): Promise<TodoWithCategories | null>;

  /** Ersetzt die komplette Label-Menge eines Todos (n:m). */
  setCategories(
    userId: string,
    id: string,
    categoryIds: string[],
  ): Promise<TodoWithCategories | null>;

  setTimer(
    userId: string,
    id: string,
    startedAt: Date | null,
    durationSeconds: number | null,
  ): Promise<TodoWithCategories | null>;

  /** Ein Todo weglegen oder zurueckholen. */
  setArchived(
    userId: string,
    id: string,
    archived: boolean,
  ): Promise<TodoWithCategories | null>;

  /** Alles Erledigte auf einmal weglegen. Gibt zurueck, wie viele es waren. */
  archiveCompleted(userId: string): Promise<number>;

  /**
   * Die naechste Ausgabe einer wiederkehrenden Aufgabe anlegen.
   *
   * Kopiert Titel, Folder, Wiederholung und Herkunft vom Original; das
   * erledigte Exemplar bleibt stehen, damit die Historie erhalten bleibt.
   */
  createOccurrence(
    userId: string,
    source: TodoWithCategories,
    scheduledDate: string,
  ): Promise<TodoWithCategories>;

  delete(userId: string, id: string): Promise<boolean>;
  reorder(userId: string, ids: string[]): Promise<void>;
}
