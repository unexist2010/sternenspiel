# Playtest-Notizen

## Kapitel 1 – Startplatz-Korrektur – 2026-10-19
- `node tests/playtest-kapitel1-layout.js` (Chrome headless, `file://`): 168/168 Prüfungen grün (Handy 412×915, Desktop 1366×768).
- Geprüft u. a.: keine Startplatz-/Planetenauswahl mehr, „Neues Spiel starten“ führt direkt ins Spiel, Hauptplanet auf gültiger
  zufälliger Koordinate, Übersicht ohne Startplatz/Stufe, Ressourcen = Grundrate ohne Bonus-Spalte, Flotte zeigt Info-Abschnitt
  „Startplätze (kommt in Kapitel 6)“ mit A–J (nur A frei), alle 8 Seiten ohne Konsolenfehler/externe Anfragen/Überlauf.
- Gefunden & behoben: Ressourcenleiste auf dem Desktop war zweizeilig (Handy-Regel `:nth-child` hatte höhere CSS-Spezifität) →
  Desktop-Regel angeglichen; neue Prüfung „Ressourcenleiste 1 Reihe (Desktop) / 2 Reihen (Handy)“.
- Startplatz-Screenshots (`kapitel1-layout-*-startplatz.png`) gelöscht; alle `kapitel1-layout-*.png` neu erzeugt
  (Koordinaten im Bild sind zufällig je Lauf).

## Kapitel 1 „Layout-Grundgerüst“ – 2026-10-18
- `node tests/playtest-kapitel1-layout.js` (Chrome headless, `file://…/index.html`, ohne Server): 154/154 Prüfungen grün.
- Handy 412×915 (2×) und Desktop 1366×768: alle 8 Menüseiten geöffnet, keine Konsolenfehler/-warnungen, keine externen
  Anfragen, kein waagrechter Überlauf, alle sichtbaren Bilder geladen; Handy-Menü öffnet/schließt.
- Gefunden & behoben: Ressourcenleiste auf dem Handy mit Lücke (4+3) → 12er-Raster ohne Lücke; Platzhalter-Emblem mit
  eckigem Hintergrund → eigenes `emblem.svg`; Link-Knöpfe unterstrichen → behoben.
- Screenshots `kapitel1-layout-<handy|desktop>-<seite>.png`:
  start, startplatz, uebersicht, ressourcen, anlagen, forschung, werft, verteidigung, flotte, weltraum,
  weltraum-sektor, weltraum-system, dazu `kapitel1-layout-handy-menue-offen.png`.
