import { IsOptional, IsString ,IsBoolean ,MinLength } from "class-validator";

export class UpdateTodoDto {
    @IsOptional()
    @IsString()
    @MinLength(1)
    title?: string;

    @IsOptional()
    @IsBoolean()    
    completed?: boolean;
}