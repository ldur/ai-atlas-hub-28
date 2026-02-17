

# Katalog som hovedkilde, Stack som kuratert utvalg

## Nåsituasjon

- **Katalogen** viser kun elementer som har en `catalog_entries`-rad -- bare 7 av 14 verktøy, og 0 av 20 modeller har dette
- **Stack** viser elementer fra `evaluations`-tabellen, uavhengig av katalogen
- **ToolDetail** er bare for verktøy, ikke modeller

Disse lever som separate siloer i dag.

## Ny logikk

```text
Katalog (hovedkilde)          Anbefalt Stack (kuratert utvalg)
+---------------------------+  +---------------------------+
| Alle verktøy (14 stk)    |  | Kun verktøy/modeller     |
| Alle modeller (20 stk)   |  | som har en evaluering    |
| Søkbar, med faner         |  | Gruppert etter status    |
| Klikkbar -> detaljside   |  | (Standard/Tillatt/etc.)  |
+---------------------------+  +---------------------------+
```

Stack-siden forblir som den er -- den viser bare det som har evalueringer. Katalogen utvides til a bli den komplette oversikten.

## Endringer

### 1. Utvide Katalog-siden med faner (Verktøy + Modeller)
- Legge til Tabs-komponent med "Verktøy" og "Modeller"
- **Verktøy-fanen**: Vise ALLE verktøy fra `tools`-tabellen (ikke bare de med catalog_entries), med søk. Hvert verktøy vises med navn, kategori, og evalueringsstatus (badge) om det finnes
- **Modeller-fanen**: Vise ALLE modeller fra `models`-tabellen med provider, modalitet og evalueringsstatus

### 2. Gjøre katalogkort klikkbare
- Verktøy klikker til eksisterende `/katalog/:toolId`
- Legge til ny rute `/katalog/modell/:modelId` med en ny `ModelDetail.tsx`-side

### 3. Ny ModelDetail-side
- Tilsvarende ToolDetail, men henter fra `models` og `catalog_entries` (via `model_id`) og `evaluations` (via `model_id`)
- Viser provider, modalitet, notater, evalueringsstatus, og eventuelle katalogoppføringer

### 4. Oppdatere ToolDetail tilbake-lenke
- Endre "Tilbake til Stack" til "Tilbake til Katalog" med lenke til `/katalog`

### 5. Stack-siden kobler til katalogen
- Gjore modellkort i Stack klikkbare -- navigerer til `/katalog/modell/:modelId`
- Verktøy linker allerede til `/katalog/:toolId`

## Tekniske detaljer

**Filer som endres:**
- `src/pages/Catalog.tsx` -- ny struktur med Tabs, henter tools + models + evaluations + catalog_entries, viser alt
- `src/pages/ToolDetail.tsx` -- endre tilbake-lenke fra `/stack` til `/katalog`
- `src/pages/Stack.tsx` -- gjore modellkort klikkbare med navigasjon til `/katalog/modell/:modelId`
- `src/App.tsx` -- legge til rute `/katalog/modell/:modelId`

**Ny fil:**
- `src/pages/ModelDetail.tsx` -- detaljside for modeller (provider, modalitet, evaluering, katalogoppforing)

**Ingen databaseendringer** -- `catalog_entries` har allerede `model_id`-kolonne, og alle tabeller er på plass.

