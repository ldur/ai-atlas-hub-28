# Sikrere admin-pålogging

Admin-koden ligger i dag i klartekst i kildekoden (to backend-funksjoner) og selve koden lagres permanent i nettleseren. Vi beholder én felles admin-kode, men gjør håndteringen langt tryggere.

## Hva som endres

1. **Koden flyttes ut av kildekoden**
   - Admin-koden lagres som en hemmelighet på serveren i stedet for å stå i filer som ligger åpent på GitHub.
   - Lagres som en kryptografisk «fingeravtrykk»-verdi (hash med salt), ikke som lesbar tekst.

2. **Nettleseren lagrer aldri passordet**
   - Ved innlogging sendes koden én gang til serveren, som svarer med et midlertidig øktbevis (token).
   - Kun dette øktbeviset lagres lokalt, og det utløper automatisk (forslag: 8 timer). Etter utløp må man logge inn på nytt.
   - Alle admin-handlinger godkjennes mot øktbeviset, ikke mot passordet.

3. **Beskyttelse mot gjetting**
   - Maks 5 mislykkede forsøk per IP innen 15 minutter, deretter midlertidig sperre.
   - Sammenligning skjer på en måte som ikke lekker informasjon via svartid.
   - Mislykkede forsøk logges (uten å lagre selve koden).

4. **Mulighet til å bytte kode**
   - Ny kode kan settes uten kodeendring, siden den ligger som hemmelighet.
   - Eksisterende økter kan invalideres ved bytte.

## Teknisk

- Ny hemmelighet `ADMIN_PASSWORD_HASH` (salt + SHA-256/PBKDF2) og `ADMIN_SESSION_SECRET` (tilfeldig generert) i backend.
- `verify-admin` blir innloggingsendepunkt: validerer koden, returnerer et signert, tidsbegrenset token (HMAC med `ADMIN_SESSION_SECRET`).
- Ny delt modul `supabase/functions/_shared/adminAuth.ts` med `verifySessionToken()`; brukes av `admin-action`, `verify-admin` og `fetch-pricing`. Hardkodet `ADMIN_CODE` fjernes fra alle tre.
- Rate limiting via ny tabell `admin_login_attempts` (ip-hash, tidsstempel), kun tilgjengelig for service role, med opprydding av gamle rader.
- Frontend: `src/lib/nickname.ts` lagrer token + utløpstid; `src/lib/adminAction.ts` sender `x-admin-token` som øktbevis og logger automatisk ut ved 401/utløp. `Admin.tsx` og `UserMenu.tsx` oppdateres til den nye flyten.
- Migrasjon: tabell med RLS aktivert og grants kun til service role.

## Etter implementering

Du må logge inn i admin på nytt én gang. Dagens kode kan gjenbrukes, eller vi kan sette en ny og sterkere kode — si ifra hva du foretrekker.
