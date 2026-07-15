// quelle für todo ist jetzt das drizzle/drizzle.module.ts und drizzle/schema.ts


export type Filter = 'all' | 'active' | 'completed';

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  isFavorite: boolean;
  labelId: string | null;
  createdAt: Date;
}