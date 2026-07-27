import { IsDateString, IsOptional, IsString, IsUUID, MinLength } from "class-validator";

export class CreateTodoDto {
    @IsString()
    @MinLength(1)
    title!: string;

    @IsOptional()
    @IsUUID()
    categoryId?: string | null;

    // Wochenansicht: reines Datum YYYY-MM-DD; weglassen/null = ungeplant.
    @IsOptional()
    @IsDateString()
    scheduledDate?: string | null;
}
