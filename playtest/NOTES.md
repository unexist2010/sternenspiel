# Playtest-Notizen

## Kapitel 3 – Forschung + Antworten zu Kapitel 2 (0.8.0) – 2026-10-19
- `node --test tests/`: 69/69 grün (neu `tests/antworten.test.js`: keine Stufengrenze, Startplatz Z10 ≤ 365 Tage, große Zahlen,
  T2/T3 über Punkte + Migration; neu `tests/forschung.test.js`: Kostenformeln, Voraussetzungen UND/ODER, Sichtbarkeit,
  Forschungszeit mit Einrichtung, ET-Energie, Roboter verkürzt Bau aber nicht Forschung, eine Forschung gleichzeitig,
  Einrichtung-Sperre, Offline, Master, bonus(), Migration v5 → v6).
- `node tests/playtest-kapitel3.js` (file://, Desktop 1366×768 + Handy 412×915): Chromium 78/78, Firefox 78/78.
  Geprüft: Hinweis ohne Einrichtung, 6 sichtbare Forschungen + Zähler, Dauer 16 Min. bei Einrichtung 2, Start, zweite Forschung
  gesperrt, Einrichtung in Anlagen gesperrt, Übersicht-Kasten, ET 1 → +5 % Strom, Voraussetzungen grün/rot und blockierend,
  Komprimierung ODER, Info-Fenster, Abbrechen erstattet voll, Offline-Fertigstellung mit Dialog, Master: 18 Kacheln, Graviton sofort,
  Roboter 1 → Metallmine 43 Sek.; kein Überlauf, keine Konsolenfehler.
- `playtest-kapitel2.js` 114/114 (Forschung nicht mehr Platzhalter), `playtest-kapitel2b.js` 94/94, `playtest-kapitel1-profile.js` 134/134.
- Gefunden & behoben: Desktop-Hover-Info nach Ganzseiten-Screenshot durch spätes Scroll-Ereignis geschlossen (Test zeigt erneut);
  Ganzseiten-Screenshot im Master zeigte den festen Kopf mitten im Bild → vorher nach oben scrollen; Text „immer nur eine Forschung“;
  Einzahl „1 kolonisierbarer Planet“ usw.
- Screenshots: `kapitel3-desktop-forschung.png`, `kapitel3-desktop-infofenster-forschung.png`, `kapitel3-handy-forschung.png`,
  `kapitel3-handy-infofenster-forschung.png`, `kapitel3-desktop-uebersicht-forschung.png`, `kapitel3-handy-uebersicht-forschung.png`,
  `kapitel3-master-alle-forschungen.png`, `kapitel3-handy-master-forschung.png`.

## Kapitel 2 – Nachbesserung (0.7.0) – 2026-10-19
- `node --test tests/`: 53/53 grün (neu `tests/nachbesserung.test.js`: Master überspringt Zeit/Kosten/Sperren, Geologie-Fund alle
  24 Std. inkl. mehrerer Offline-Funde, Fundbereich je Stufe, Bohrstation leert Vorkommen und stoppt bei 0, Kunststoff-Rezepte,
  T2/T3-Sperre, Startplätze A–Z mit B nach A10 + Punkten, Kapazität A10 = 100 / Summe ≈ 10 Mrd., Migration v4 → v5).
- `node tests/playtest-kapitel2b.js` (file://, Desktop 1366×768 + Handy 412×915): Chromium 94/94, Firefox 94/94.
  Geprüft: MASTER-Knopf im Kopf, Übersicht Vorkommen 1.000.000/Förderung/Countdown/Punkte, T2/T3 gesperrt, 13 Info-Knöpfe,
  Info-Fenster per Hover (Desktop) bzw. Antippen (Handy) sichtbar und vollständig im Bild (auch Randkacheln), 6 Tabellenzeilen,
  Anheften + × schließen; Master an → Hinweis, sofort und kostenlos bauen, Punkte gutgeschrieben, T3 trotz Sperre; Geologiestation,
  Test-Fund, 2 nachgeholte Funde, Fund-Log (neuester oben); Raumflughafen 26 Plätze, A auf 10 → Kapazität 100; Master aus →
  B „75 Punkte nötig“, C „B Stufe 10 nötig“; Master je Profil gespeichert; keine Konsolenfehler.
- `playtest-kapitel2.js` 118/118 und `playtest-kapitel1-profile.js` 134/134 (Erwartung auf Spielstand v5 angepasst).
- Gefunden & behoben: Fund-Log war nach Einfügereihenfolge statt Zeit sortiert (nachgeholte Funde unten) → nach Zeit sortiert;
  Info-Tabelle auf dem Handy breiter als das Fenster (Bauzeit abgeschnitten) → kompakte Tabelle unter 600 px.
- **Live** (https://unexist2010.github.io/sternenspiel/, nach Deploy von 2ebc53e, Pages ab 01:26 Uhr mit 0.7.0):
  Chromium + Firefox: `playtest-kapitel2b.js` 94/94, `playtest-kapitel2.js` 118/118, `playtest-kapitel1-profile.js` 67/67 (Live-Modus).
- Screenshots: `kapitel2b-desktop-anlagen-infofenster.png`, `kapitel2b-handy-infofenster.png`, `kapitel2b-desktop-uebersicht.png`,
  `kapitel2b-geologie-log.png`, `kapitel2b-handy-geologie-log.png`, `kapitel2b-raumflughafen.png`, `kapitel2b-handy-raumflughafen.png`,
  `kapitel2b-master-aktiv.png`, `kapitel2b-handy-master-aktiv.png`.

## Kapitel 2 – Anlagen (0.6.0) – 2026-10-19
- `node --test tests/`: 44/44 grün (davon 14 neu in `tests/anlagen.test.js`: Kosten, Produktion je Stufe, Energiedrosselung,
  Ölverbrennung, Kunststoff-Inputs/Drosselung, Bauauftrag inkl. Offline-Fertigstellung, Startplätze Freischaltung/Kapazität, Migration).
- `node tests/playtest-kapitel2.js` (file://, Desktop 1366×768 + Handy 412×915): Chromium 118/118, Firefox 118/118 grün.
  Geprüft: Version 0.6.0, Datenmodell v4, Leiste 7 Rohstoffe ohne Antimaterie (Desktop 1 Reihe, Handy 4+3), Strom „Erzeugung / Bedarf“,
  Übersicht (Planet, Koordinaten, Sektor, System, Punkte, Bauauftrag, 4 Knöpfe, keine Startplätze), 5 Platzhalterseiten,
  Anlagen (4 Gruppen, 14 Kacheln, alle SVGs geladen, deaktivierte Knöpfe mit Grund), Solarfarm → Metallmine bauen + vorspulen
  (Stufe 1, Metall 30 → 63/h), 1 Std. Produktion vorgespult, Abbrechen mit voller Erstattung, Ressourcen-Tabellen, Regler 50 %,
  Raumflughafen + Startplatz A (Kapazität 5), J gesperrt, Offline-Fertigstellung nach Neuladen (Dialog „Metallmine Stufe 2
  fertiggestellt“), kein Überlauf, keine Konsolenfehler/externen Anfragen.
- `node tests/playtest-kapitel1-profile.js`: Chromium + Firefox 134/134 (Erwartung „Altspieler migriert“ auf v4 angepasst).
- `tests/playtest-kapitel1-struktur.js` entfernt (prüfte Ressourcen/Anlagen als Platzhalter) – ersetzt durch `playtest-kapitel2.js`.
- Gefunden & behoben: Umgebungsvariable `BROWSER` ist auf der Box vorbelegt → Playtests nutzen jetzt `PLAYTEST_BROWSER`;
  Knopf „Zu den Anlagen“ wurde auch auf der Anlagen-Seite angezeigt → dort ausgeblendet.
- **Live** (https://unexist2010.github.io/sternenspiel/, nach Deploy von f471f8d, Pages ab 00:44 Uhr mit 0.6.0):
  `playtest-kapitel2.js` Chromium 118/118; Firefox 3 von 4 Läufen 118/118, ein Lauf 117/118 (einmaliger Konsolen-/Netzfehler,
  nicht reproduzierbar); `playtest-kapitel1-profile.js` Chromium + Firefox 134/134.
- Screenshots: `kapitel2-desktop-anlagen.png`, `kapitel2-desktop-ressourcen.png`, `kapitel2-desktop-uebersicht.png`,
  `kapitel2-handy-anlagen.png`, `kapitel2-raumflughafen.png` (Desktop), `kapitel2-handy-raumflughafen.png`.

## Kapitel 1 – reine Seitenstruktur (0.5.0) – 2026-10-19
- `node --test tests/`: 29/29 grün.
- `node tests/playtest-kapitel1-struktur.js` (Chrome headless, `file://`): Handy 412×915 + Desktop 1366×768 – 8 Seiten in fester
  Reihenfolge, Seiten außer Übersicht exakt „Titel + Platzhalter“ (keine Tabellen/Formulare/Bilder/Links), keine
  Kapitelnummern/Startplätze/Weltraum-Navigation/Rohstofftabelle, Übersicht nur Planet + Koordinaten + 3 Knöpfe, Ressourcenleiste
  einreihig mit 4 Rohstoffen, alter Link `#weltraum/system/133` zeigt nur Platzhalter, Hierarchie 1/5/300/12 im Datenmodell,
  Menü auf/zu (Handy), kein Überlauf, keine Konsolenfehler/fremden Anfragen, Speichern/Offline/Zurücksetzen.
- `node tests/playtest-kapitel1-profile.js`: Chromium + Firefox grün (Profile, Altstand-Übernahme, Cache-Mix).
- Live-Lauf nach dem Deploy mit `LIVE_URL=https://unexist2010.github.io/sternenspiel/` (beide Playtests).
- Screenshots: `kapitel1-final-desktop-uebersicht.png`, `kapitel1-final-desktop-leere-seite.png` (Ressourcen),
  `kapitel1-final-handy-uebersicht.png`, `kapitel1-final-handy-menue-offen.png`; alte `kapitel1-layout-*.png` entfernt.

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
