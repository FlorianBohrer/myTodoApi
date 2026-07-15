import { IsOptional, IsString ,IsBoolean ,IsUUID ,MinLength } from "class-validator";

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
}