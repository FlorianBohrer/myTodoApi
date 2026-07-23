import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  index,
  primaryKey,
} from 'drizzle-orm/pg-core';

export const todos = pgTable(
  'todos',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull(),
    title: text('title').notNull(),
    completed: boolean('completed').notNull().default(false),

    isFavorite: boolean('is_favorite').notNull().default(false),

    categoryId: uuid('category_id').references(() => categories.id, {
      onDelete: 'set null',
    }),
    position: integer('position').notNull().default(0),

    // Zeitblock: Startzeitpunkt kommt vom Server, die Restzeit rechnet das
    // Frontend daraus aus. Beide null = kein Timer aktiv.
    timerStartedAt: timestamp('timer_started_at'),
    timerDurationSeconds: integer('timer_duration_seconds'),

    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [index('todo_user_id_idx').on(table.userId)],
);

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull(),
    name: text('name').notNull(),
    color: text('color').notNull(),
    icon: text('icon').notNull().default('tag'),
    favoritePosition: integer('favorite_position'),
    // Reihenfolge im Folder-Overlay (per Drag & Drop änderbar).
    position: integer('position').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [index('category_user_id_idx').on(table.userId)],
);

// n:m zwischen Todos und Kategorien. Ein Todo kann mehrere Labels tragen,
// ein Label an mehreren Todos hängen. ON DELETE CASCADE räumt die Zuweisungen
// automatisch auf, wenn ein Todo oder ein Folder gelöscht wird.
export const todoCategories = pgTable(
  'todo_categories',
  {
    todoId: uuid('todo_id')
      .notNull()
      .references(() => todos.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.todoId, table.categoryId] }),
    index('todo_categories_todo_id_idx').on(table.todoId),
  ],
);

export type Todo = typeof todos.$inferSelect;
export type newTodo = typeof todos.$inferInsert;

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

/** Ein Todo samt seiner Label-IDs (aus der Zwischentabelle zusammengesetzt). */
export type TodoWithCategories = Todo & { categoryIds: string[] };
