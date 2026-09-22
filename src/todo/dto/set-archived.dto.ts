import { IsBoolean } from 'class-validator';

export class SetArchivedDto {
  /** true legt weg, false holt zurueck. */
  @IsBoolean()
  archived!: boolean;
}

/** Antwort der Sammelaktion: wie viele Todos weggelegt wurden. */
export class ArchivedCountDto {
  constructor(public readonly archived: number) {}
}
