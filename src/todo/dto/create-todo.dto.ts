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

    /**
     * Der Plan, aus dem dieses Todo entsteht.
     *
     * Gesetzt, wenn ein Checklisten-Eintrag im Planungsmodus zu einer echten
     * Aufgabe wird. Danach zeigt das Todo zurueck auf seine Herkunft.
     */
    @IsOptional()
    @IsUUID()
    planId?: string | null;
}
