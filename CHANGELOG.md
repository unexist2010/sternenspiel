# Changelog – Sternenspiel

## [0.1.0] – 2026-10-18 – Kapitel 1

### Neu
- Projektstruktur (HTML/CSS/JS, ohne Build, offline per Doppelklick), Doku (`README.md`, `docs/`), lokales git
- Startbildschirm mit „Neues Spiel“ / „Weiterspielen“
- Startplatz-Wahl A–Z (Stufe 1–15, Schwerpunkt-Rohstoff, Boni-Vorschau, Sortierung nach Stufe)
- Ressourcenleiste und Produktionstabelle für Metall, Silizium, Rohöl, Strom, Kunststoff T1–T3, Antimaterie
- Echtzeit-Produktion (Ticks), Lagergrenzen, Offline-Fortschritt (max. 24 Std.) mit Übersicht
- Speichern (manuell/automatisch), Laden, Zurücksetzen; Spielstand-Prüfung und Migration
- Zentrale Balance-Konstanten (`js/data/konstanten.js`), Andockpunkte für Kapitel 2–7
- Tests: 13 Node-Tests (`node --test tests/`), Browser-Playtest mit Screenshots Handy/Desktop
