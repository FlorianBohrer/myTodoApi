import { Min, MinLength } from "class-validator";

export class CreateTodoDto {
    @isString()
    @MinLength(1)
    title: string;
}