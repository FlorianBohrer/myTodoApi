import { IsDateString, IsOptional, IsString ,IsBoolean ,IsUUID ,MinLength } from "class-validator";

export class UpdateTodoDto {
    @IsOptional()
    @IsString()
    @MinLength(1)
    title?: string;

    @IsOptional()
    @IsBoolean()
    completed?: boolean;

    @IsOptional()
    @IsUUID()
    categoryId?: string | null;

    @IsOptional()
    @IsBoolean()
    isFavorite?: boolean;

    // Wochenansicht: YYYY-MM-DD einem Tag zuordnen, null = zurück in den Backlog.
    @IsOptional()
    @IsDateString()
    scheduledDate?: string | null;
}