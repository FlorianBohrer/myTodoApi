export class TodoItemResponseDto {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly completed: boolean,
    public readonly isFavorite: boolean,
    public readonly categoryId: string | null,
    public readonly createdAt: Date,
  ) {}
}