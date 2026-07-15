# myTodoApi

Das NestJS-Backend zu meiner [Todo-App](https://github.com/FlorianBohrer/Todo_App). Speichert Todos und Kategorien pro Nutzer in einer Neon-Postgres-Datenbank (Drizzle ORM). Der Login läuft über Clerk: Ein globaler Guard prüft bei jedem Request das mitgeschickte Session-Token und filtert alle Abfragen auf den eingeloggten Nutzer.

Die Hintergründe und was ich beim Bauen gelernt habe, stehen in der [README des Frontends](https://github.com/FlorianBohrer/Todo_App#was-ich-dabei-gelernt-habe).

## Endpunkte

| Methode | Pfad | Zweck |
| --- | --- | --- |
| GET | `/todo` | Alle Todos des Nutzers, sortiert |
| GET | `/todo/:id` | Ein einzelnes Todo |
| POST | `/todo` | Todo anlegen |
| PUT | `/todo/reorder` | Reihenfolge nach Drag & Drop speichern |
| PUT | `/todo/:id` | Todo ändern (Titel, erledigt, Kategorie) |
| DELETE | `/todo/:id` | Todo löschen |
| GET | `/category` | Kategorien des Nutzers |
| POST | `/category` | Kategorie anlegen |
| PUT | `/category/:id` | Kategorie ändern |
| DELETE | `/category/:id` | Kategorie löschen |

Alle Endpunkte erwarten einen `Authorization: Bearer`-Header mit einem gültigen Clerk-Token, sonst gibt es eine 401.

## Starten

```bash
npm install
npm run db:migrate
npm run start:dev
```

Vorher eine `.env` im Projektordner anlegen mit `DATABASE_URL` (Connection-URL aus der Neon-Konsole), `CLERK_SECRET_KEY` (Clerk-Dashboard, API Keys) und `CLERK_AUTHORIZED_PARTIES` (darf leer bleiben). Die API läuft danach auf Port 3000.

Schema-Änderungen: In `src/drizzle/schema.ts` anpassen, dann `npm run db:generate` für eine neue Migration und `npm run db:migrate` zum Einspielen. `npm run db:studio` öffnet einen Blick in die Datenbank.
