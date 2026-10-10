ALTER TABLE "todos" ADD COLUMN "completed_at" timestamp;--> statement-breakpoint
ALTER TABLE "todos" ADD COLUMN "series_id" uuid;--> statement-breakpoint

-- completed_at wird NICHT nachgetragen.
--
-- Wann etwas erledigt wurde, stand nirgends. Es aus created_at oder
-- scheduled_date zu erfinden hiesse, geratene Zahlen als gemessene
-- auszugeben — und zwar rueckwirkend und unsichtbar. Bestehende erledigte
-- Zeilen bleiben deshalb bei null, und die Oberflaeche sagt "noch keine
-- Erledigungszeiten", statt eine Woche zu bilanzieren, die sie nicht kennt.
-- Ab dem ersten Haken nach dieser Migration ist jede Zahl eine echte.

-- series_id wird einmalig, nach bestem Wissen, nachgetragen.
--
-- Welche Ausgaben einer wiederkehrenden Aufgabe zusammengehoerten, war nie
-- gespeichert. Rekonstruierbar ist es nur ueber das, was eine Ausgabe von
-- ihrer Vorgaengerin uebernimmt: denselben Nutzer, denselben Titel, dieselbe
-- Regel. Das ist eine Heuristik, und ihre Grenze gehoert benannt: zwei
-- WIRKLICH verschiedene Aufgaben mit gleichem Titel und gleichem Rhythmus
-- landen in einer Reihe. Die Folge ist eine gemeinsame Trefferquote, also
-- eine schiefe Anzeige — kein Datenverlust, und sie laeuft sich mit jeder
-- neuen Ausgabe aus.
--
-- Die Alternative waere, alle Altzeilen als Reihe der Laenge eins zu fuehren:
-- dann steht bei jeder wiederkehrenden Aufgabe am ersten Tag ein leerer
-- Rhythmus, obwohl die Historie im Grunde da ist. Einmaliges Zusammenfuehren
-- ist hier das kleinere Uebel. Neue Ausgaben erben die series_id danach
-- ausdruecklich (siehe createOccurrence), es bleibt also bei diesem einen Mal.
UPDATE "todos" AS t
SET "series_id" = s."series_id"
FROM (
  SELECT
    "user_id",
    "title",
    "repeat_every",
    "repeat_unit",
    "repeat_from",
    gen_random_uuid() AS "series_id"
  FROM "todos"
  WHERE "repeat_every" IS NOT NULL
    AND "repeat_unit" IS NOT NULL
    AND "repeat_from" IS NOT NULL
  GROUP BY "user_id", "title", "repeat_every", "repeat_unit", "repeat_from"
) AS s
WHERE t."user_id" = s."user_id"
  AND t."title" = s."title"
  AND t."repeat_every" = s."repeat_every"
  AND t."repeat_unit" = s."repeat_unit"
  AND t."repeat_from" = s."repeat_from";
