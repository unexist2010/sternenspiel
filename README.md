# Sternenspiel

**Stand:** 2026-10-19 (Europe/Vienna) · **Version:** 0.4.0 · **Status:** Kapitel 1 „Layout-Grundgerüst“ (inkl. Spielerprofile) von 7 erledigt  
**Für:** Sandro Orsaria · **Sprache:** Deutsch (Oberfläche, Doku, Kommentare) · **Repo:** github.com/unexist2010/sternenspiel · **Live:** https://unexist2010.github.io/sternenspiel/

## Kurzüberblick

**Sternenspiel** (Arbeitstitel, auch „Sternenreich“/„Weltraumspiel“) ist ein Offline-Aufbauspiel im Weltraum für den Browser
im Retro-Stil klassischer Browser-Weltraumspiele: links das Menü, in der Mitte das Inhaltsfeld, oben die Rohstoffe.
Grafiken sind **eigene SVGs** (`assets/`, erzeugt mit `tools/erzeuge-grafiken.js`) – keine fremden Assets.

- Reines **HTML/CSS/JavaScript** – kein Build, kein Server, keine externen Quellen (CDNs, Schriften).
- Läuft **offline** per Doppelklick auf `index.html`; Spielstand in `localStorage`.
- **Responsiv**: Desktop mit fester Menüleiste links, Handy mit ausklappbarem Menü (☰).

## Starten

1. `index.html` doppelklicken (öffnet im Browser über `file://`).
2. **Spielerauswahl:** vorhandenen Spieler mit „Spielen“ fortsetzen – oder unten „Neuen Spieler erschaffen“ (Name, optional
   Planetenname). Ein neuer Spieler startet automatisch auf einem Hauptplaneten (zufällige Koordinate) – ohne Auswahl.
3. Im Spiel wechselt „Spieler wechseln“ (Menü unten oder Übersicht) zurück zur Auswahl; vorher wird gespeichert.

**Nach einem Update** genügt normales Neuladen: Alle Dateien tragen `?v=<Version>`; passt etwas nicht zusammen, lädt die
Seite einmal selbst neu oder zeigt „Neu laden“. Spielstände bitte **nicht** löschen – alte Stände werden übernommen.

## Kapitel 1 – Layout-Grundgerüst (Inhalt)

- **Menü** links in fester Reihenfolge: Übersicht, Ressourcen, Anlagen, Forschung, Werft, Verteidigung, Flotte, Weltraum
- **Kopfbereich** mit Logo und Ressourcenleiste: Metall, Silizium, Rohöl, Strom, Kunststoff T1–T3
  (Antimaterie ist versteckt, bis `freigeschaltet.antimaterie` im Spielstand `true` ist)
- **Spielerprofile**: mehrere Spieler pro Browser, je eigener Spielstand und Offline-Fortschritt; Löschen nur mit Bestätigung
- **Übersicht**: Hauptplanet mit Koordinaten (Sektor:System:Planet), Sektor, System, Spielstand-Knöpfe
- **Ressourcen**: Rohstofftabelle (Bestand, Lager, pro Std.) – Grundrate, keine Boni
- **Weltraum**: 1 Universum → 5 Sektoren → 300 Sonnensysteme → 12 Planeten je System (3.600 Planeten), navigierbar
  (Sektor-Karten, System-Raster, Systemansicht mit ◀ ▶ und Direktsprung), Heimat hervorgehoben
- **Platzhalter**: Anlagen (Kap. 2), Forschung (Kap. 3), Werft (Kap. 4), Verteidigung (Kap. 5), Flotte (Kap. 6)
- **Startplätze** = Start-/Abschussplattformen für Flotten (bis zu 10, Stufe 1–15, Kapazität nach Schiffsanzahl):
  in Kapitel 1 nur Datenmodell (`zustand.startplaetze`), Konstanten und Info-Abschnitt auf der Seite „Flotte“; Logik in Kapitel 6
- **Unterbau**: vorläufige Grundproduktion, Offline-Fortschritt (max. 24 Std.), Speichern/Laden/Zurücksetzen (nur aktiver Spieler),
  Spielstand-Migration (v1/v2 → v3, alter Einzel-Spielstand → erstes Profil)
- **Nicht** enthalten (bewusst): Gebäude, Schiffe, Kampf, Forschung, Planetengrößen/Feldlimits

## Testen

```bash
node --test tests/                      # 29 Logik-Tests (Hierarchie, Start-Koordinate, Menü, Startplätze, Produktion, Offline, Migration, Profile, Cache-Schutz …)
node tests/playtest-kapitel1-layout.js  # Browser-Playtest Layout (Chromium headless, file://), Screenshots nach playtest/
node tests/playtest-kapitel1-profile.js # Browser-Playtest Profile + Cache-Mix (Chromium/Firefox, file:// + lokaler Server)
LIVE_URL=https://unexist2010.github.io/sternenspiel/ node tests/playtest-kapitel1-profile.js   # dasselbe gegen die Live-Seite
```

Der Playtest braucht `playwright-core` (sucht automatisch; sonst `npm i playwright-core` oder `PLAYWRIGHT_CORE=…`) und
Chrome/Chromium (`CHROME=…`). Er öffnet auf **Handy 412×915** und **Desktop 1366×768** alle 8 Menüseiten und prüft
Konsolenfehler, externe Anfragen, waagrechten Überlauf, geladene Bilder, Menü auf/zu, Weltraum-Navigation und Spielstand.

Grafiken neu erzeugen: `node tools/erzeuge-grafiken.js`

## Ordnerstruktur

```
/workspace/sternenspiel/
  index.html              ← Einstieg (Doppelklick)
  css/style.css           ← Retro-Weltraum-Stil, mobil zuerst
  assets/                 ← EIGENE Grafiken (SVG): Logo, Emblem, Favicon, Sternenhimmel, Planeten, Sterne, Rohstoffe
  tools/erzeuge-grafiken.js ← erzeugt alle SVGs unter assets/
  js/data/                ← Konfiguration
    konstanten.js         ← ZENTRALE Balance + Weltraum-Größen
    rohstoffe.js          ← 8 Rohstoffe (Antimaterie mit Freischaltung)
    startplaetze.js       ← Startplätze = Flotten-Startplattformen A–J (Regeln, Anfangszustand; Logik Kapitel 6)
    weltraum.js           ← Universum/Sektoren/Systeme/Planeten (deterministisch erzeugt), zufällige Start-Koordinate
    menue.js              ← 8 Menüpunkte (Reihenfolge FEST) + Kapitel der Platzhalter
    gebaeude.js, schiffe.js ← Andockpunkte (Kapitel 2/4)
  js/kern/                ← DOM-freie Logik (in Node testbar)
    zustand.js            ← Spielstand-Modell v3, Prüfung, Migration
    profile.js            ← Spielerprofile (Liste, Anlegen, Laden/Speichern je Spieler, Löschen, Übernahme Altstand)
    produktion.js         ← Grundrate, Ticks, Offline-Fortschritt
    speicher.js           ← Speichern/Laden/Löschen
  js/ui/format.js, app.js ← Formate + Oberfläche (Menü, Seiten, Navigation per #anker)
  tests/                  ← Node-Tests + Browser-Playtest
  playtest/               ← Screenshots kapitel1-layout-*.png
  docs/                   ← SPEZIFIKATION.md, KAPITELPLAN.md, OFFENE-PUNKTE.md
  CHANGELOG.md
```

## Kennzeichnung

- **FEST** = von Sandro vorgegeben (siehe `docs/SPEZIFIKATION.md`)
- **ANNAHME** = von mir gesetzt, bis Sandro entscheidet (gesammelt in `docs/OFFENE-PUNKTE.md`)

## Nächster Schritt

Kapitel 2: Ressourcen & Anlagen (Gebäude inkl. Geologiestation) – siehe `docs/KAPITELPLAN.md`.
