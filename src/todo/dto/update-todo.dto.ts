import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { REPEAT_FROM, REPEAT_UNITS } from '../recurrence';

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

    /**
     * Wiederholung. Die drei Felder gehören zusammen; null bei allen dreien
     * schaltet sie ab.
     *
     * Die Obergrenze ist keine Schikane: repeatEvery landet in einer Schleife,
     * die den Termin so lange weiterschiebt, bis er in der Zukunft liegt. Ein
     * absurder Wert soll dort gar nicht erst ankommen.
     */
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(365)
    repeatEvery?: number | null;

    @IsOptional()
    @IsIn(REPEAT_UNITS)
    repeatUnit?: string | null;

    @IsOptional()
    @IsIn(REPEAT_FROM)
    repeatFrom?: string | null;

    /** Der Plan, aus dem das Todo stammt. null loest die Herkunft auf. */
    @IsOptional()
    @IsUUID()
    planId?: string | null;
}
