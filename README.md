# Sternenspiel

**Stand:** 2026-10-18 (Europe/Vienna) · **Status:** Kapitel 1 von 7 erledigt  
**Für:** Sandro Orsaria · **Sprache:** Deutsch (Oberfläche, Doku, Kommentare)

## Kurzüberblick

**Sternenspiel** (Arbeitstitel, auch „Sternenreich“/„Weltraumspiel“) ist ein Offline-Aufbauspiel im Weltraum für den Browser.
Du wählst einen von 26 Startplätzen (A–Z, Stufe 1–15), sammelst Rohstoffe (Metall, Silizium, Rohöl, Strom, Kunststoff T1–T3,
Antimaterie) und baust in späteren Kapiteln Gebäude, Forschung, eine Werft mit 23 Schiffen, Kampf, Flotten und KI-Gegner aus.

- Reines **HTML/CSS/JavaScript** – kein Build, kein Server, keine externen Quellen (CDNs, Schriften).
- Läuft **offline** per Doppelklick auf `index.html`; Spielstand in `localStorage`.
- **Responsiv** für Handy und Desktop.

## Starten

1. `index.html` doppelklicken (öffnet im Browser über `file://`).
2. „Neues Spiel“ → Name eingeben → Startplatz wählen → „Spiel starten“.

## Kapitel-1-Funktionen

- Startbildschirm mit „Neues Spiel“ / „Weiterspielen“ (Spielstand-Übersicht)
- Startplatz-Wahl A–Z mit Stufe, Schwerpunkt-Rohstoff und Boni-Vorschau (Sortierung A–Z oder nach Stufe)
- Ressourcenleiste mit allen 8 Rohstoffen, Produktion pro Stunde, Hinweis „Lager voll“
- Echtzeit-Produktion über Ticks (rechnet mit echter Zeitdifferenz, daher auch bei gedrosseltem Tab korrekt)
- Offline-Fortschritt seit dem letzten Speichern (max. 24 Std. – ANNAHME) mit „Willkommen zurück“-Übersicht
- Speichern (manuell, alle 30 s automatisch, beim Verlassen/Verstecken des Tabs), Laden, Zurücksetzen (mit Rückfrage)
- Beschädigte/ältere Spielstände werden erkannt bzw. ergänzt (Migration)

## Testen

```bash
node --test tests/              # Logik-Tests (Produktion, Offline, Speichern/Laden, Startplatz-Boni) – 13 Tests
node tests/playtest-kapitel1.js # Browser-Playtest (Chromium headless, file://), Screenshots nach playtest/
```

Der Playtest braucht `playwright-core` (sucht automatisch; sonst `npm i playwright-core` oder `PLAYWRIGHT_CORE=…`) und
Chrome/Chromium (`CHROME=…`). Er prüft Konsolenfehler, externe Anfragen, waagrechten Überlauf und den kompletten Ablauf
Neues Spiel → Produktion → Speichern → Offline (3 Std. simuliert) → Zurücksetzen auf **Handy 412×915** und **Desktop 1366×768**.

## Ordnerstruktur

```
/workspace/sternenspiel/
  index.html              ← Einstieg (Doppelklick)
  css/style.css           ← Stil, mobil zuerst
  js/data/                ← Konfiguration (Andockpunkte für spätere Kapitel)
    konstanten.js         ← ZENTRALE Spielbalance (alle Zahlen = ANNAHME)
    rohstoffe.js          ← 8 Rohstoffe
    startplaetze.js       ← Startplätze A–Z mit Stufe/Schwerpunkt
    gebaeude.js           ← Geologiestation (Platzhalter, Kapitel 2)
    schiffe.js            ← 23 Schiffe / 5 Waffen / 2 Hüllen (leer, Kapitel 4)
  js/kern/                ← DOM-freie Logik (in Node testbar)
    zustand.js            ← Spielstand-Modell, Prüfung, Migration
    produktion.js         ← Boni-Formel, Ticks, Offline-Fortschritt
    speicher.js           ← Speichern/Laden/Löschen
  js/ui/format.js         ← deutsche Zahlen-/Zeitformate
  js/ui/app.js            ← Oberfläche
  tests/                  ← Node-Tests + Browser-Playtest
  playtest/               ← Screenshots (kapitel1-handy-*.png, kapitel1-desktop-*.png)
  docs/
    SPEZIFIKATION.md      ← verbindliche Punkte von Sandro + markierte ANNAHMEN
    KAPITELPLAN.md        ← Kapitel 1–7 mit Status
    OFFENE-PUNKTE.md      ← offene Fragen an Sandro
  CHANGELOG.md
```

## Kennzeichnung

- **FEST** = von Sandro vorgegeben (siehe `docs/SPEZIFIKATION.md`)
- **ANNAHME** = von mir gesetzt, bis Sandro entscheidet (gesammelt in `docs/OFFENE-PUNKTE.md`)

## Nächster Schritt

Kapitel 2: Gebäude inkl. Geologiestation & Ausbau (siehe `docs/KAPITELPLAN.md`). Vorher idealerweise die offenen Fragen klären.
