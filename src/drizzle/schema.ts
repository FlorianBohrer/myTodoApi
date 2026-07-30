import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  date,
  jsonb,
  index,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

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

    // Für die Wochenansicht: reines Datum (YYYY-MM-DD, ohne Uhrzeit/Zeitzone).
    // null = ungeplant (Backlog).
    scheduledDate: date('scheduled_date'),

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

// geräte-tokens für native clients (macOS-Menüleisten-Timer). Clerk-Session-JWTs
// laufen nach ~60s ab und werden nur im Browser erneuert — eine native App
// braucht deshalb ein eigenes, langlebiges Token. Gespeichert wird nur der
// SHA-256-Hash, der Klartext existiert nur einmal in der Antwort auf /device/pair.
export const deviceTokens = pgTable(
  'device_tokens',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull(),
    // frei wählbarer Gerätename, damit man in der Liste weiß, was man widerruft.
    name: text('name').notNull(),
    tokenHash: text('token_hash').notNull().unique(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    lastUsedAt: timestamp('last_used_at'),
    // gesetzt = widerrufen, Zeile bleibt für die Historie stehen.
    revokedAt: timestamp('revoked_at'),
  },
  (table) => [
    index('device_token_user_id_idx').on(table.userId),
    index('device_token_hash_idx').on(table.tokenHash),
  ],
);

// kurzlebiger Kopplungscode: die eingeloggte Weboberfläche erzeugt ihn, das
// Gerät tauscht ihn genau einmal gegen ein Token. Einmalig + 5 Minuten gültig,
// damit ein abgelesener Code nichts mehr wert ist.
export const pairingCodes = pgTable(
  'pairing_codes',
  {
    code: text('code').primaryKey(),
    userId: text('user_id').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    consumedAt: timestamp('consumed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [index('pairing_code_user_id_idx').on(table.userId)],
);

// ein Fokusblock auf einem Todo. Die Uhr läuft auf dem Server: Restzeit ergibt
// sich aus plannedSeconds minus (elapsedSeconds + Laufzeit seit runningSince).
// Dadurch überlebt ein Block Neustart, Ruhezustand und Client-Wechsel.
export const focusSessions = pgTable(
  'focus_sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull(),
    // Todo darf verschwinden, die Historie bleibt — deshalb set null.
    todoId: uuid('todo_id').references(() => todos.id, {
      onDelete: 'set null',
    }),
    // Schnappschuss des Titels, damit die Historie ein gelöschtes Todo überlebt.
    todoTitle: text('todo_title').notNull(),
    plannedSeconds: integer('planned_seconds').notNull(),
    startedAt: timestamp('started_at').notNull().defaultNow(),
    // summierte reine Laufzeit aller bereits beendeten Abschnitte (ohne Pausen).
    elapsedSeconds: integer('elapsed_seconds').notNull().default(0),
    // Beginn des aktuell laufenden Abschnitts. null = pausiert oder beendet.
    runningSince: timestamp('running_since'),
    // gesetzt = Block ist vorbei (durchgelaufen oder abgebrochen).
    endedAt: timestamp('ended_at'),
    // true = bis auf 0 durchgelaufen, false = vorzeitig gestoppt.
    completed: boolean('completed').notNull().default(false),
  },
  (table) => [
    index('focus_session_user_id_idx').on(table.userId),
    index('focus_session_started_at_idx').on(table.startedAt),
  ],
);

// Planungsseiten (Planungsmodus). Gehören einem Folder (categoryId) ODER sind
// eigenständig (categoryId null). content = geordnete Blöcke (Text/Tabelle) als
// JSON — bewusst flexibel, damit später weitere Blocktypen dazukommen können.
export const plans = pgTable(
  'plans',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull(),
    title: text('title').notNull(),
    categoryId: uuid('category_id').references(() => categories.id, {
      onDelete: 'set null',
    }),
    content: jsonb('content')
      .$type<unknown[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    position: integer('position').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index('plan_user_id_idx').on(table.userId)],
);

export type Plan = typeof plans.$inferSelect;
export type NewPlan = typeof plans.$inferInsert;

export type Todo = typeof todos.$inferSelect;
export type newTodo = typeof todos.$inferInsert;

export type DeviceToken = typeof deviceTokens.$inferSelect;
export type NewDeviceToken = typeof deviceTokens.$inferInsert;

export type PairingCode = typeof pairingCodes.$inferSelect;

export type FocusSession = typeof focusSessions.$inferSelect;
export type NewFocusSession = typeof focusSessions.$inferInsert;

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

/** Ein Todo samt seiner Label-IDs (aus der Zwischentabelle zusammengesetzt). */
export type TodoWithCategories = Todo & { categoryIds: string[] };
