import { IsInt, IsUUID, Max, Min } from 'class-validator';

export class StartFocusSessionDto {
  @IsUUID()
  todoId!: string;

  // eine Minute bis 24 Stunden, gleiche Grenzen wie beim bestehenden Timer.
  @IsInt()
  @Min(60)
  @Max(86400)
  plannedSeconds!: number;
}
