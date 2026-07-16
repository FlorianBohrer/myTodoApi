export class CategoryItemResponseDto {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly color: string,
    public readonly icon: string,
    public readonly favoritePosition: number | null,
  ) {}
}