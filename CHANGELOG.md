# Changelog – Sternenspiel

## [0.2.0] – 2026-10-18 – Kapitel 1: Layout-Grundgerüst (überarbeitet nach Sandros Präzisierung)

### Neu
- Retro-Layout: Kopf mit Logo + Ressourcenleiste, linkes Menü, mittleres Inhaltsfeld; Handy mit ausklappbarem Menü (☰)
- Menü in fester Reihenfolge: Übersicht, Ressourcen, Anlagen, Forschung, Werft, Verteidigung, Flotte, Weltraum
- Weltraum-Hierarchie (1 Universum, 5 Sektoren, 300 Systeme, 12 Planeten je System = 3.600 Planeten), navigierbar
  über Sektor-Karten, System-Raster und Systemansicht (◀ ▶, Direktsprung); Heimatplanet verortet und hervorgehoben
- Übersicht (Heimatplanet, Koordinaten Sektor:System:Planet, Startplatz/Stufe), Ressourcen-Seite (Tabelle)
- Platzhalter-Seiten: Anlagen (Kap. 2), Forschung (Kap. 3), Werft (Kap. 4), Verteidigung (Kap. 5), Flotte (Kap. 6)
- Eigene SVG-Grafiken unter `assets/` (Logo, Emblem, Favicon, Sternenhimmel, 6 Planeten, 5 Sterne, 8 Rohstoff-Icons),
  erzeugt mit `tools/erzeuge-grafiken.js`
- Spielstand v2: `heimat` und `freigeschaltet.antimaterie` (Antimaterie versteckt bis zur Freischaltung); Migration von v1
- Optionaler Name für den Heimatplaneten
- Tests: 19 Node-Tests, Browser-Playtest `tests/playtest-kapitel1-layout.js` (alle 8 Seiten, Handy + Desktop)

### Geändert
- Kapitelplan: Kapitel 1 = Layout-Grundgerüst; Kapitel 2 = Ressourcen & Anlagen, 3 Forschung, 4 Werft,
  5 Verteidigung & Kampf, 6 Flotte & Weltraum-Missionen, 7 KI & Feinschliff
- Produktion/Speichern/Offline-Fortschritt bleiben als Unterbau; „Demnächst“-Kasten durch Platzhalter-Seiten ersetzt

### Entfernt
- Alte Screenshots `playtest/kapitel1-*.png` und `tests/playtest-kapitel1.js` (ersetzt durch `kapitel1-layout-*`)

## [0.1.0] – 2026-10-18 – Kapitel 1 (erste Fassung)

### Neu
- Projektstruktur (HTML/CSS/JS, ohne Build, offline per Doppelklick), Doku (`README.md`, `docs/`), lokales git
- Startbildschirm mit „Neues Spiel“ / „Weiterspielen“
- Startplatz-Wahl A–Z (Stufe 1–15, Schwerpunkt-Rohstoff, Boni-Vorschau, Sortierung nach Stufe)
- Ressourcenleiste und Produktionstabelle für Metall, Silizium, Rohöl, Strom, Kunststoff T1–T3, Antimaterie
- Echtzeit-Produktion (Ticks), Lagergrenzen, Offline-Fortschritt (max. 24 Std.) mit Übersicht
- Speichern (manuell/automatisch), Laden, Zurücksetzen; Spielstand-Prüfung und Migration
- Zentrale Balance-Konstanten (`js/data/konstanten.js`), Andockpunkte für Kapitel 2–7
- Tests: 13 Node-Tests (`node --test tests/`), Browser-Playtest mit Screenshots Handy/Desktop
