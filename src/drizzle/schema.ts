import { pgTable, uuid, text, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const todos = pgTable(
    'todos', 
    {
        id: uuid('id').defaultRandom().primaryKey(),
        userId: text('user_id').notNull(),
        title: text('title').notNull(),
        completed: boolean('completed').notNull().default(false),
        createdAt: timestamp('created_at').notNull().defaultNow() 
        },
        (table) => [index('todo_user_id_idx').on(table.userId)]
);

export type Todo = typeof todos.$inferSelect;
export type newTodo = typeof todos.$inferInsert;




