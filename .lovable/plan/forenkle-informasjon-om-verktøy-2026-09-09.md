# Forenkle informasjon om verktøy

Samme forenkling som for modeller, nå for verktøy.

## Hva endres

- På verktøysiden vises kun "Best for". Feltene Notater, Eksempelprompter, Gjør dette, Unngå dette og Sikkerhetsveiledning fjernes fra visningen.
- I skjemaet for å opprette/redigere et verktøy fjernes de samme feltene, slik at admin kun fyller ut "Best for" i katalogdelen.
- AI-utfyllingen ("Fyll med AI") setter fortsatt kategori, leverandør, lenke og "Best for"; øvrig generert innhold brukes ikke lenger.
- Anbefalt stack er allerede oppdatert (lenken "Se detaljer" er fjernet for både verktøy og modeller) — ingen ny endring der.

## Teknisk

- `src/pages/ToolDetail.tsx`: fjern kortene for notes, example_prompts, do_this, avoid_this, security_guidance samt ubrukte ikon-/markdown-importer.
- `src/components/catalog/ToolFormDialog.tsx`: reduser `catalogFields` til kun `best_for`, fjern tilhørende state/lagring og Notater-feltet på verktøyet.
- Eksisterende data i databasen røres ikke; feltene skjules bare i grensesnittet.
