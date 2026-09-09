# Tydeligere filtrering på forsiden (Anbefalt Stack)

I dag vises alle filtre samtidig over fanene, selv om "bruksområde" bare gjelder verktøy og "drift" bare gjelder modeller. Det gjør det uklart hva som faktisk påvirker listen du ser på.

## Ny løsning

Filtrene flyttes ned under fanene og tilpasses valgt fane:

- Alltid synlig: søkefelt og statusfilter (Godkjent / Ikke godkjent / Prøve / Alle).
- Fanen **Verktøy**: i tillegg filter for bruksområde (Intern, Kunde, Begge, Ikke satt).
- Fanen **Modeller**: i tillegg filter for drift (Lokal, Sky, Ikke satt).

Når du bytter fane, nullstilles filteret som ikke gjelder lenger, slik at antallet i fanene alltid stemmer med det du ser.

```text
[ Verktøy (12) ] [ Modeller (8) ]
------------------------------------------
[ Søk............ ]  [ Status ▾ ]  [ Bruksområde ▾ ]
```

Fanetellerne fortsetter å vise treff etter søk og status, slik at du ser hvor mange resultater den andre fanen har før du bytter.

## Teknisk

- `src/pages/Stack.tsx`: gjør `Tabs` kontrollert med `useState` for aktiv fane, flytt filterraden fra over `Tabs` til innsiden av hver `TabsContent` (delt filterkomponent), og render kun det relevante `Select`-et.
- Nullstill `usageFilter` / `deploymentFilter` til `ALL` i `onValueChange` på `Tabs`.
- Ingen endringer i data, spørringer eller backend. Nye i18n-nøkler kun hvis en etikett mangler.
