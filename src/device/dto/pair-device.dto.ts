import { IsString, Length, MaxLength } from 'class-validator';

export class PairDeviceDto {
  // Bindestriche und Kleinschreibung sind erlaubt, der Service normalisiert.
  @IsString()
  @Length(8, 12)
  code!: string;

  @IsString()
  @MaxLength(60)
  deviceName!: string;
}
