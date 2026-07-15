import { IsArray, IsUUID } from "class-validator";

export class ReorderTodosDto {
    @IsArray()
    @IsUUID('all', { each: true })
    ids!: string[];
}
