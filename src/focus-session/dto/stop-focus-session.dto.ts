import { IsBoolean, IsOptional } from 'class-validator';

export class StopFocusSessionDto {
  /**
   * true = der Block ist durchgelaufen, false = vorzeitig abgebrochen.
   * Ohne Angabe wertet der Server selbst aus, ob die Zeit um war.
   */
  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}
