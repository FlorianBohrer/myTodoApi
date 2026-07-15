import { IsOptional, IsString, IsUUID, MinLength } from "class-validator";

export class CreateTodoDto {
    @IsString()
    @MinLength(1)
    title!: string;

    @IsOptional()
    @IsUUID()
    categoryId?: string | null;
}
