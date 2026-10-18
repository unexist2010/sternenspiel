# Sternenspiel

**Stand:** 2026-10-19 (Europe/Vienna) · **Version:** 0.5.0 · **Status:** Kapitel 1 „reine Seitenstruktur“ erledigt  
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

## Kapitel 1 – reine Seitenstruktur (Inhalt)

- **Menü** links in fester Reihenfolge: Übersicht, Ressourcen, Anlagen, Forschung, Werft, Verteidigung, Flotte, Weltraum
- **Alle Menüseiten** sind eigene Seiten im gleichen Layout, aber **ohne Inhalt**: Seitentitel + „Wird in einem eigenen
  Kapitel ausgearbeitet.“ (Ausnahme Übersicht)
- **Übersicht**: Hauptplanetname + Koordinaten (Sektor:System:Planet), Knöpfe Speichern / Spieler wechseln / Zurücksetzen
- **Ressourcenleiste** (Platzhalter): Metall, Silizium, Rohöl, Strom; Kunststoff T1–T3 und Antimaterie sind per Flag
  (`freigeschaltet.<id>`) ausgeblendet, aber im Datenmodell vorhanden
- **Spielerprofile**: mehrere Spieler pro Browser, je eigener Spielstand und Offline-Fortschritt; Löschen nur mit Bestätigung
- **Im Datenmodell, aber nicht sichtbar**: Weltraum-Hierarchie 1/5/300/12 (Koordinaten des Hauptplaneten), Startplatz-Regeln
- **Unterbau**: vorläufige Grundproduktion, Offline-Fortschritt (max. 24 Std.), Speichern/Zurücksetzen (nur aktiver Spieler),
  Migration alter Spielstände
- **Nicht** enthalten (bewusst, eigene spätere Kapitel): Rohstofftabelle, Gebäude, Forschung, Schiffe, Verteidigung/Kampf,
  Flotte, Startplätze, Weltraum-Ansicht

## Testen

```bash
node --test tests/                       # 29 Logik-Tests (Hierarchie, Menü, Ressourcen-Flags, Produktion, Offline, Migration, Profile, Cache-Schutz …)
node tests/playtest-kapitel1-struktur.js # Browser-Playtest Seitenstruktur (Chromium headless, file://), Screenshots kapitel1-final-*.png
node tests/playtest-kapitel1-profile.js # Browser-Playtest Profile + Cache-Mix (Chromium/Firefox, file:// + lokaler Server)
LIVE_URL=https://unexist2010.github.io/sternenspiel/ node tests/playtest-kapitel1-struktur.js  # gegen die Live-Seite
LIVE_URL=https://unexist2010.github.io/sternenspiel/ node tests/playtest-kapitel1-profile.js
```

Der Playtest braucht `playwright-core` (sucht automatisch; sonst `npm i playwright-core` oder `PLAYWRIGHT_CORE=…`) und
Chrome/Chromium (`CHROME=…`). Er öffnet auf **Handy 412×915** und **Desktop 1366×768** alle 8 Menüseiten und prüft
Konsolenfehler, externe Anfragen, waagrechten Überlauf, geladene Bilder, Menü auf/zu, leere Seiten und Spielstand.

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
    rohstoffe.js          ← 8 Rohstoffe (Kunststoff T1–T3 + Antimaterie mit Freischalt-Flag)
    startplaetze.js       ← Startplätze = Flotten-Startplattformen A–J (nur Doku/Datenmodell, nicht sichtbar)
    weltraum.js           ← Universum/Sektoren/Systeme/Planeten (deterministisch erzeugt), zufällige Start-Koordinate
    menue.js              ← 8 Menüpunkte (Reihenfolge FEST) + neutraler Platzhaltertext
    gebaeude.js, schiffe.js ← Andockpunkte für spätere Kapitel
  js/kern/                ← DOM-freie Logik (in Node testbar)
    zustand.js            ← Spielstand-Modell v3, Prüfung, Migration
    profile.js            ← Spielerprofile (Liste, Anlegen, Laden/Speichern je Spieler, Löschen, Übernahme Altstand)
    produktion.js         ← Grundrate, Ticks, Offline-Fortschritt
    speicher.js           ← Speichern/Laden/Löschen
  js/ui/format.js, app.js ← Formate + Oberfläche (Menü, Seiten, Navigation per #anker)
  tests/                  ← Node-Tests + Browser-Playtest
  playtest/               ← Screenshots kapitel1-final-*.png, kapitel1-profile-*.png
  docs/                   ← SPEZIFIKATION.md, KAPITELPLAN.md, OFFENE-PUNKTE.md
  CHANGELOG.md
```

## Kennzeichnung

- **FEST** = von Sandro vorgegeben (siehe `docs/SPEZIFIKATION.md`)
- **ANNAHME** = von mir gesetzt, bis Sandro entscheidet (gesammelt in `docs/OFFENE-PUNKTE.md`)

## Nächster Schritt

Das nächste Kapitel (welcher Menüpunkt bzw. welche Mechanik) legt Sandro fest – Sammlung in `docs/KAPITELPLAN.md`.
