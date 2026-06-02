import { IsString, MinLength } from "class-validator";

export class CreateTodoDto {
    [x: string]: string;
    @IsString()
    @MinLength(1)
    title!: string;
}