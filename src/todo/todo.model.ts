export interface Todo {
  id: string;
  title: string;
  userId: string;
  completed: boolean;
  createdAt: Date;
}

export type Filter = 'all' | 'active' | 'completed';

