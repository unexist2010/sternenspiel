# Playtest-Notizen

## Kapitel 1 „Layout-Grundgerüst“ – 2026-10-18
- `node tests/playtest-kapitel1-layout.js` (Chrome headless, `file://…/index.html`, ohne Server): 154/154 Prüfungen grün.
- Handy 412×915 (2×) und Desktop 1366×768: alle 8 Menüseiten geöffnet, keine Konsolenfehler/-warnungen, keine externen
  Anfragen, kein waagrechter Überlauf, alle sichtbaren Bilder geladen; Handy-Menü öffnet/schließt.
- Gefunden & behoben: Ressourcenleiste auf dem Handy mit Lücke (4+3) → 12er-Raster ohne Lücke; Platzhalter-Emblem mit
  eckigem Hintergrund → eigenes `emblem.svg`; Link-Knöpfe unterstrichen → behoben.
- Screenshots `kapitel1-layout-<handy|desktop>-<seite>.png`:
  start, startplatz, uebersicht, ressourcen, anlagen, forschung, werft, verteidigung, flotte, weltraum,
  weltraum-sektor, weltraum-system, dazu `kapitel1-layout-handy-menue-offen.png`.
