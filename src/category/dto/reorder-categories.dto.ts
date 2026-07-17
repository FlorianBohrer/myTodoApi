import { IsArray, IsUUID } from "class-validator";

export class ReorderCategoriesDto {
    @IsArray()
    @IsUUID('all', { each: true })
    ids!: string[];
}
