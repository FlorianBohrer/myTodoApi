import { IsInt, Max, Min, ValidateIf } from 'class-validator';

export class SetTimerDto {
  // Zahl = Zeitblock mit dieser Länge starten, null = laufenden Block beenden.
  @ValidateIf((dto: SetTimerDto) => dto.durationSeconds !== null)
  @IsInt()
  @Min(1)
  @Max(86400)
  durationSeconds!: number | null;
}
