import { IsArray, IsUUID } from 'class-validator';

export class ReorderPlansDto {
  @IsArray()
  @IsUUID('all', { each: true })
  ids!: string[];
}
