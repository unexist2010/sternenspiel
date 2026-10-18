# Sternenspiel – Kapitelplan

Stand: 2026-10-18 · Jedes Kapitel ist für sich spielbar, getestet (Node + Browser-Playtest Handy/Desktop) und wird einzeln committet.

| Kapitel | Inhalt | Status |
|---------|--------|--------|
| 1 | Grundgerüst, Rohstoffe, Wirtschaft, Startplatz-Wahl, Speichern | ✅ **erledigt** (2026-10-18) |
| 2 | Gebäude inkl. Geologiestation & Ausbau | offen |
| 3 | Forschung, Kunststoff-Tiers (T1–T3), Antimaterie | offen |
| 4 | Werft: 23 Schiffe, 2 Hüllentypen, 5 Waffentypen | offen |
| 5 | Kampf, Schutzschild-Autoaktivierung, Trümmer/Salvage | offen |
| 6 | Flotten, Treibstoff, Karte/Missionen | offen |
| 7 | KI-Gegner (5–10 Angriffe/Ereignisse täglich), Balancing, Feinschliff | offen |
| – | Offene Punkte | laufend: `docs/OFFENE-PUNKTE.md` |

---

## Kapitel 1 – Grundgerüst, Rohstoffe, Wirtschaft, Startplatz, Speichern ✅

- Projektstruktur (HTML/CSS/JS ohne Build, offline per `file://`), Doku, Tests, lokales git
- 8 Rohstoffe (FEST), Ressourcenleiste, Produktion pro Stunde, Lagergrenzen (ANNAHME)
- Startplätze A–Z mit Stufe 1–15 (FEST), Schwerpunkt + Boni-Formel (ANNAHME)
- Echtzeit-Ticks, Offline-Fortschritt (max. 24 Std., ANNAHME)
- Speichern/Laden/Zurücksetzen in `localStorage`, Migration
- Zentrale Balance in `js/data/konstanten.js`; Andockpunkte für Kapitel 2–7 im Datenmodell
- Tests: 13 Node-Tests, Browser-Playtest Handy 412×915 + Desktop 1366×768 → `playtest/kapitel1-*.png`

## Kapitel 2 – Gebäude inkl. Geologiestation & Ausbau

- Gebäude-Konfiguration in `js/data/gebaeude.js` (Kosten, Bauzeit, Wirkung je Stufe)
- Bauschleife (ein Bauauftrag gleichzeitig? → offen), Bauzeit läuft auch offline weiter
- **Geologiestation (FEST):** erkundet/bestimmt Lagerstätten → befüllt `zustand.lagerstaetten`, beeinflusst Förderung
- Förderanlagen für Metall/Silizium/Rohöl, Kraftwerk (Strom), Lager-Ausbau (Vorschlag, ANNAHME)
- Ggf. Startplatz-Stufe ausbauen (falls Sandro das so meint → offen)

## Kapitel 3 – Forschung, Kunststoff-Tiers & Antimaterie

- Forschungsbaum (`js/data/forschung.js`)
- Kunststoff-Kette: Rohöl (+ Strom) → T1 → T2 → T3 (Verarbeitungsgebäude, ANNAHME)
- Antimaterie-Erzeugung (teuer, viel Strom, ANNAHME)
- Forschung schaltet Schiffe/Waffen/Hüllen für Kapitel 4 frei

## Kapitel 4 – Werft: 23 Schiffe, Hüllentypen, Waffen

- `js/data/schiffe.js` mit **23 Schiffen** (FEST), **2 Hüllentypen** (FEST), **5 Waffentypen** (FEST)
- Namen/Werte/Kosten: Vorschlag von mir als ANNAHME, solange Sandro nichts vorgibt
- Bauwarteschlange in der Werft, Schiffsbestand in `zustand.schiffe`

## Kapitel 5 – Kampf, Schutzschild-Autoaktivierung, Trümmer/Salvage

- Kampfsimulation (Runden, Waffentyp gegen Hüllentyp), Kampfbericht
- **Schutzschild-Autoaktivierung als Solo-Regel (FEST)** – genaue Auslösebedingung offen
- **Trümmer-Salvage (FEST):** 50–75 % am Boden, 80 % im Orbit → `zustand.truemmerfelder`

## Kapitel 6 – Flotten, Treibstoff, Karte/Missionen

- Sternenkarte (Startplätze A–Z als Orte?), Flotten zusammenstellen und entsenden
- **Treibstoffregeln (FEST, Inhalt offen):** Verbrauch nach Entfernung/Schiffstyp, Treibstoff-Rohstoff (Rohöl? Antimaterie?) → offen
- Missionen: Angriff, Bergung (Salvage), Transport, Erkundung

## Kapitel 7 – KI-Gegner, Balancing, Feinschliff

- **KI-Gegner mit 5–10 Angriffen/Ereignissen pro Tag (FEST)** – Planung im Voraus, auch offline nachgeholt (ANNAHME)
- Schwierigkeit evtl. abhängig von Startplatz-Stufe (offen)
- Balancing aller Konstanten, Tutorial, Feinschliff, ggf. PWA/Export-Import des Spielstands
