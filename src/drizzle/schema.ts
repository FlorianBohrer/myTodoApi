import { pgTable, uuid, text, boolean, integer, timestamp, index } from 'drizzle-orm/pg-core';

export const todos = pgTable(
  'todos',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull(),
    title: text('title').notNull(),
    completed: boolean('completed').notNull().default(false),
    categoryId: uuid('category_id').references(() => categories.id, {
      onDelete: 'set null',
    }),
    position: integer('position').notNull().default(0),
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
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [index('category_user_id_idx').on(table.userId)],
);

export type Todo = typeof todos.$inferSelect;
export type newTodo = typeof todos.$inferInsert;

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
