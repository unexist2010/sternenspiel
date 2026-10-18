# Playtest-Notizen

## Kapitel 1 – Start-Fix + Spielerprofile – 2026-10-19
- **Fehlerbild live nachgestellt** (Chrome headless gegen https://unexist2010.github.io/sternenspiel/ und mit den Dateien von
  0.2.0/0.3.0): frischer Browser, nur v1-Spielstand, nur v2-Spielstand → Start ging. Fehler nur bei **gemischtem Cache**:
  neue `index.html` (0.3.0) + altes `app.js` (0.2.0) → `TypeError: Cannot read properties of null (reading 'addEventListener')`,
  keine Handler; Klick auf „Neues Spiel starten“ schickt das Formular ab → Seite lädt stumm als „/?“ neu = „geht nicht“.
  Umgekehrt (alte HTML + neues app.js) ebenso Absturz. GitHub Pages cacht 10 Min. (`max-age=600`), daher genau nach Updates.
- `node --test tests/`: 29/29 grün.
- `node tests/playtest-kapitel1-layout.js`: 168/168 grün (an Profile angepasst: „Spieler wechseln“, Offline über Profil-Schlüssel,
  Zurücksetzen bleibt im Spiel).
- `node tests/playtest-kapitel1-profile.js`: Chromium 67/67, Firefox 67/67 grün (file:// Desktop + Handy, Cache-Mix über lokalen
  Server). WebKit startet auf der Box nicht (fehlende Systembibliotheken) – nicht geprüft.
  Geprüft: leere Auswahl, Klick ohne Namen → Hinweis statt Neuladen, 2 Spieler, getrennter Fortschritt, Reload behält beide,
  Reload im Spiel speichert, Zurücksetzen nur aktiver Spieler, Löschen mit Abbrechen/Bestätigen, Altstand v2 (mit `startplatz`)
  → Profil inkl. Offline-Fortschritt, kaputter Alt-/Profilstand blockiert nicht, alle 8 Seiten, Cache-Mix A (alte HTML → einmal
  automatisch neu geladen) und B (altes app.js → Meldung mit „Neu laden“).
- Screenshots: `kapitel1-profile-desktop-spielerauswahl.png`, `kapitel1-profile-handy-spielerauswahl.png`; Layout-Screenshots neu.
- Live-Lauf nach dem Deploy: `LIVE_URL=https://unexist2010.github.io/sternenspiel/ node tests/playtest-kapitel1-profile.js`.

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
