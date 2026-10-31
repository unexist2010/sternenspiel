# Changelog – Sternenspiel

## [0.21.1] – 2026-10-31 – Start-Siedler/Piraten, Rivalen über Sektor 1 (Sandro pt62u)

- **Start belebt:** Beim ersten KI-Tick entstehen sofort **4 Siedler** und **2 Piraten** rund um das Heimatsystem (`K.START_SIEDLER`, `K.START_PIRATEN`).
- **Rivalen:** bleiben bei **5** (keine neuen). Verteilt über den **ganzen Heimatsektor (Sektor 1, Systeme 1–60)**; davon nur **1–2 nah** (≤ 6 Systeme vom Heimatsystem), der Rest weiter weg im Sektor.
- Pro Spieltag kommen weiterhin nur Siedler/Piraten langsam dazu (2–5/Tag).
- **Migration:** Bestehende Spielstände – Rivalen werden einmalig umverteilt (gleiche IDs/Stärke), fehlende Start-Siedler/Piraten ergänzt.
- Tests: `tests/ki-start.test.js`; Cache-Schutz `?v=0.21.1`.

## [0.21.0] – 2026-10-31 – Start 1:50, KI rund um den Spieler, Rangliste (Sandro pt61u)

- **Neuer Start:** Neue Spieler starten immer auf **Sektor 1, System 50**, Planet zufällig 1–12 (`BALANCE.WELTRAUM.START_SYSTEM`). Bestehende Spielstände behalten ihre Koordinaten – für 1:50 „Neues Spiel“/neuen Spieler anlegen.
- **KI-Verteilung:** Siedler/Piraten/Rivalen siedeln nicht mehr zufällig im Universum, sondern rund um das Heimatsystem (auf- und abwärts, über Sektorgrenzen). Abstand = 1 + ⌊r²·Streu⌋, Streu = 2 + Anzahl KI/6 → nahe Systeme füllen sich zuerst, die Welt wächst langsam nach außen. Rivalen: Streu 12. Heimatsystem bleibt KI-frei.
- **Stärke nach Abstand:** bis 5 Systeme normale Verteilung (wächst mit dem Spieler); weiter weg −2 %/System (min. 45 %), 30 % der fernen KI bleiben ungedämpft (durchmischt).
- **Rangliste** (neuer Menüpunkt): Gesamt, Gebäude, Forschung, Flotte, Verteidigung – Spieler, KI und Alpha/Beta. Klick auf Name/Koordinate → Weltraum-Ansicht des Sonnensystems. Spielerpunkte aus dem aktuellen Bestand (wie OGame); KI: Flotte/Verteidigung aus Bestand, Rest 65/35 Gebäude/Forschung (ANNAHME).
- Tests: `tests/rangliste-start.test.js`.

## [0.20.2] – 2026-10-31 – Hotfix Versionsanzeige (Sandro pt59u)
- Startbildschirm (Spielerauswahl) zeigte fest „0.11.4“. `#version-anzeige` wird jetzt beim Start aus `SS.VERSION` gesetzt; HTML-Default auf aktuelle Version. Test in `tests/profile.test.js` erweitert. Cache-Schutz `?v=0.20.2`.

## [0.20.1] – 2026-10-31 – KI nur an aktiven Spieltagen + „Neues Spiel“ (Sandro pt57u)
- **FEST (pt57u): Die KI-Welt lebt nur an Tagen, an denen du aktiv spielst.** Pro Kalendertag mit geöffnetem/geladenem Spiel wird genau **ein** Welt-Tag simuliert (neue Planeten 2–5, Wachstum, Piraten-Überfälle, TF-Alter, Rivalen-Countdown). Spielst du einen Tag nicht, steht alles still – beim nächsten Laden wird **nichts** nachgezogen (vorher bis zu 120 Tage).
- KI-Tagesangaben (Rivale 14 Tage inaktiv, TF 7 Tage) zählen jetzt in **Spieltagen** (`z.ki.spieltag`). Alte 0.20.0-Stände werden stetig übernommen.
- Unverändert: Offline-Produktion der Minen, Flotten-Ankünfte, Bau-/Forschungszeiten laufen weiter wie bisher.
- **Neues Spiel (alles löschen):** Knopf „Neues Spiel“ unten im Menü und in der Übersicht (Box Spielstand). Löscht nach Rückfrage alle `sternenspiel*`-Daten im Browser (alle Spieler, Master, KI-Welt) und lädt neu → Startbildschirm, komplett von vorn. „Zurücksetzen“ (nur aktueller Spieler, Name+Koordinaten bleiben) gibt es weiterhin.

## [0.20.0] – 2026-10-31 – KI-Grundlage: Siedler, Piraten, Rivalen (Sandro t53–t55u)
- Neues Modul `js/kern/ki.js`; KI-Planeten in `z.ki.npc` (Alpha/Beta bleiben in `z.gegner`). Spionage, Angriff, Beute, Bergung funktionieren gegen KI-Planeten wie gegen Testgegner.
- **Siedler:** viel Verteidigung, Schiffe überwiegend zivil (Frachter), viele Rohstoffe (lukrativ), wachsen langsam nach (15 % des Defizits/Tag).
- **Piraten:** wenige Planeten (~10 % der Siedler), Kampfschiffe; „überfallen“ Siedler (35 %/Tag) → nur wachsendes Orbit-Trümmerfeld am Siedler sichtbar, kein Kampfbericht, kein Flug.
- **Rivalen:** 5 im Universum (je Sektor einer), 14 Tage inaktiv (halbe Stärke, kein Wachstum), dann aktiv. Keine Angriffe auf den Spieler.
- **Stärke folgt Spielerpunkten:** max. +10 %; ≈10 % stärker, ≈15 % gleich/leicht schwächer, Rest 35–90 %. Neue Planeten starten bei 40 % ihres Solls (leichtes Early Game).
- **Wachstum:** 2–5 neue Planeten/Tag (≤5), ≤50 % KI-Belegung je System, keine direkten Nachbarpositionen; 70 % im Heimatsektor; nie in Systemen mit eigenen Planeten/Testgegnern (ANNAHME). Tage werden beim Laden nachgezogen (max. 120).
- **TF-Alter:** Trümmerfelder an KI-Planeten verschwinden nach 7 Tagen (Tooltip „Tag x/7“ im Weltraum).
- **Spionage-Drift:** Berichte über KI-Planeten weichen täglich deterministisch um bis zu ±5 % ab; Bericht zeigt Art + Punkte.
- **Weltraum:** Spalte Spieler zeigt Art (Siedler/Pirat/Rivale, ggf. „inaktiv“) + Punkte.
- Kein Diplo/Allianzen, keine KI-Expedition, kein KI-Koloniekrieg. Spielstand-Version unverändert (11), `z.ki` wird bei Bedarf angelegt.
- Tests: `tests/ki.test.js`; 135/135 grün, alle Playtests grün.

## [0.19.0] – 2026-10-31 – Beute, Rückruf, Angriffsschild, Bergung (Sandro t52u)
- **Beute** nach gewonnenem Angriff, begrenzt durch den Laderaum der Angreiferflotte (Sammler zählen nicht, mitgeführte Ladung wird abgezogen). Verteilung Metall:Silizium:Rohöl 3:2:1; Kunststoff nur, wenn das Ziel welchen hat: Budget 5 % des Laderaums, T1:T2:T3 = 6:3:1. Max. 50 % des Zielbestands. Kein Strom, keine Antimaterie. Neues Modul `js/kern/bergung.js`, Konstanten `BEUTE`. Beute-Zeile im Kampfbericht. Testgegner haben jetzt Rohstoffe.
- **Rückruf** fliegender Flotten (Hinflug/Halten) ohne Zusatzkosten: sofortige Umkehr, Rückflug = bereits geflogene Zeit, Rohöl-Erstattung = Anteil der ungeflogenen Hinstrecke (beim Halten 0). Knopf „↩ Rückruf“ in der Flottenliste.
- **Angriffsschild** (Bonusgegenstand, vorläufig): je eigenem Planeten in der Übersicht aktivierbar, 24 Std. aktiv, 1.000 Rohöl, danach 24 Std. Abklingzeit (Master: gratis, ohne Abklingzeit). Schild-Symbol in Übersicht, Planetenliste und Weltraum. Eigener Angriff vom Planeten beendet den Schild. Hook `angriffBlockiert()` für künftige KI-Angriffe.
- **Bergung:** Mission „Wracksammlung“ (id `sammeln`, nur Wracksammler, eigene Koordinaten oder fremdes Trümmerfeld) und neue Mission „Bodensammlung“ (nur Bodensammler, nur eigene Koordinaten, Boden-Schrott). Ziel = Startplanet erlaubt. Zwei Symbole auf der Flottenseite und in der Weltraum-Ansicht (Spalte TF) bei Trümmern/Boden-Schrott, Klick öffnet das Sendefenster mit Mission, Koordinaten und passenden Sammlern.
- Tests: `tests/beute-rueckruf.test.js`; 130/130 grün, alle Playtests grün.

## [0.18.1] – 2026-10-31 – Hotfix Kolonie-Startplätze
- **Fix:** Neue Kolonie startet mit Raumflughafen 1 und Startplatz A Stufe 1 – vorher Kapazität 0 („Nur 0 Startplätze frei“), stationierte Flotte konnte nicht starten. Test ergänzt.

## [0.18.0] – 2026-10-31 – Kolonisieren wie OGame + Balance (Sandro t49u)
- **Kolonisieren:** Bei Ankunft entsteht ein neuer Planet (Position 1–12, frei), das Kolonieschiff wird verbraucht, restliche Schiffe bleiben dort stationiert, Ladung wird entladen (gemeinsames Lager). Limit Astrophysik: ⌈Stufe/2⌉ Kolonien. Neue Kolonie = gleiche Gebäudeliste (startet leer, mit Grundproduktion). Speichern/Laden ok.
- **Planetenliste links** (klickbar, Wechsel des aktiven Planeten für Übersicht/Anlagen/Flotte); **Schnellwahl eigener Planeten** im Sendefenster (→ Stationieren).
- **Expedition:** Anflug auf :13 im eigenen System von jeder Position gleich weit (≈60 min mit Kleinem Frachter ohne Antriebsforschung, Forschung verkürzt); andere Systeme wie bisher. Cap Punkte×25 (mind. 10 000) statt ×100. Haltezeit: Fundgröße +5 %/h (max ×2), Fundchance gedrosselt (+2 %/h, max 75 %). Piraten stärker (35–90 % der Flotte, häufiger).
- **Bomber:** Kunststoff T2 (3000) statt T3. **Startbestand Rohöl** 600 statt 100.
- Tests: 125 Unit-Tests + neuer Playtest `tests/playtest-kolonie.js` (Desktop + Handy).

## [0.17.0] – 2026-10-31 – Waffen neu: MG/Raketen/Laser/Ionen/Plasma/Railgun + EMP am Titan (Sandro t47u)

- **Papier-Balance zuerst:** `tools/balance-sim.js` (gleiche Regeln wie `kampf.js`), viele Probeläufe, Ergebnis in `docs/BALANCE-WAFFEN.md` (Faktoren, Hüllenziele, Bewaffnung, Matrizen, Beispielkämpfe Early/Mid/Late).
- **6 Waffentypen:** Maschinengewehr (E 0,3 / M 0,9), Raketen (0,2/1,1), Laser (1,0/0,45), Ionen (1,5/0,25), Plasma (1,0/1,0), **Railgun** (ignoriert Energiehülle, Metall 1,0, immer ×1,5). Graviton entfernt; Maschinenkanone → Maschinengewehr, Magnetkanone → Railgun (Verteidigung „Railgun-Turm“, id bleibt `magnetkanone`).
- **Metallhülle 0 = tot**, auch mit Rest-Energiehülle (explizit dokumentiert + getestet). Kein Schnellfeuer.
- **EMP nur am Titan:** Forschung „EMP-Technologie“ ersetzt Graviton (gleiche Kosten/Voraussetzungen, Spielstand-Migration). Je Stufe L: vor jeder Phase Energiehülle von bis zu 25·L Einheiten mit Energiehülle ≤ 1.000·L auf 0; Planetenschilde immun; Hinweis im Kampfbericht.
- **Neue Werte:** alle 14 Kampfschiffe + 8 Verteidigungsanlagen (Angriff, Energiehülle ≈ 15–30 % der Metallhülle ab Korvette, frühe Schiffe Metallfokus), Info-Texte angepasst.
- Tests: 121 grün (neu: Railgun-Durchschlag, Metall-tot, EMP-Stufen); Playtests 3/4/5 angepasst und grün.

## [0.16.2] – 2026-10-31 – Spionagesonde OGame-schnell (Sandro t44u)

- **Spionagesonde:** Grundtempo 125.000 → **100.000.000** (OGame-Niveau) – Spionageflüge dauern nur noch Sekunden.
- Bewusst unverändert: Kleiner Frachter bleibt früh schnell (bestätigt), Titan/große Schiffe langsam, aber nicht RIP-extrem.

## [0.16.1] – 2026-10-31 – Weltraum: nur Nummern, Testgegner im Heimatsystem (Sandro t41u)

- **Keine Eigennamen** mehr: Sektoren heißen „Sektor 1“ … „Sektor 5“, Sonnensysteme „System N“, Planeten „Planet P“; Navigation nur per Nummer (Auswahl, Fenster, Übersicht, Systemkopf). Universum heißt schlicht „Universum“.
- Datenmodell unverändert: 5 Sektoren à 60 Sonnensysteme (300), 12 Positionen.
- **Testphase laden:** Testgegner **Alpha → Position 5**, **Beta → Position 9**, Testkolonie → Position 3, alle im **Heimatsystem**. Kollidiert eine Position mit der Heimat, wird die nächste freie Position (1–12) genommen (`SS.kern.testphase.TEST_POSITIONEN`).
- Tests: neuer Test (Namen + Alpha/Beta für alle 12 Heimatpositionen), 120 grün; Playtests angepasst (Weltraum nicht mehr Platzhalter, Fußzeile).

## [0.16.0] – 2026-10-31 – Weltraum-Ansicht: Sektor → Sonnensystem → Planet (Sandro pt40u)

- Menü „Weltraum“ aktiv (kein Platzhalter mehr). Begriffe in der UI: **Sektor**, **Sonnensystem**, **Planet** (kein „Galaxie“).
- Navigation: Sektor-Auswahl, Sonnensystem-Nummer mit ◀/▶, „⌂ Heimat“, Fenster mit **5 Sonnensystemen** des Sektors (Anzahl besetzter Planeten als Zähler). Deeplinks `#weltraum/system/N`, `#weltraum/sektor/S`.
- Systemansicht OGame-artig: Positionen 1–12 (Planet/frei, Koordinaten, Spieler) + Zeile 13 „Expeditionsraum“.
- Knöpfe: Gegner → **Spionage**, **Angriff**, **Transport**; eigene Planeten → **Transport**, **Stationieren**; leere Position → **Kolonisieren**; Zeile 13 → **Expedition**.
- Flotten-Deeplink `#flotte/senden/<mission>/<S:SYS:P>`: Mission + Koordinaten vorausgefüllt, Sendefenster wird angesprungen.
- **Spionage** schickt wie OGame sofort **1 Spionagesonde** (danach Flottenfenster mit vorausgefüllter Mission); ohne Sonde: Flottenfenster + Hinweis.
- Neu: `js/ui/seite-weltraum.js`, `tests/weltraum-ansicht.test.js` (119 Tests grün), Browser-Playtest `tests/playtest-weltraum.js` (Desktop + Handy, 38/38 OK, Alpha/Beta Spionage + Angriff).

## [0.15.1] – 2026-10-31 – Expeditionen: Playtest-Fixes (Sandro pt38u)

- Piraten „1 Schiff entkommt“: jetzt klar **Niederlage – Flotte vernichtet, 1 X entkommen (N von M Schiffen verloren)**; Kampfbericht-Kopf passend („Niederlage – Expeditionsflotte vernichtet, 1 X entkommt“ + Hinweis), Expeditions-Sieger-Texte aus Spielersicht.
- Verzögerung: Normalmodus Rückflug weiterhin ×2 (Text nennt Faktor); Master-Modus ehrlich: „würde 2× so lang dauern (Master-Modus: entfällt, sofort zurück)“ – keine Flugzeit-Lüge.
- Kampfberichte: neue Liste `z.kampfberichte` (neueste 10, inkl. Piraten + Testphase); Flottenseite: „Ältere Kampfberichte“ aufklappbar.
- Laderaum: gekappter Fund → „X Metall gefunden, Y aufgenommen – Laderaum voll“; Sendefenster-Hinweis „Laderaum begrenzt Rohstofffunde“.
- Position 13: Mission „Expedition“ füllt Koordinaten mit Expeditionsraum (System des Planeten, `:13`) vor; Knopf „Expeditionsraum“.
- Zähler: „Expeditionen unterwegs x / n“, im Master Zusatz „sofort abgeschlossen – Ergebnis unter Letzte Expeditionen“.
- Tests: 3 neue in `expedition.test.js` (116 grün).

## [0.15.0] – 2026-10-31 – Expeditionen (Sandro pt36u)

- Neue Mission „Expedition“: Ziel Expeditionsraum `S:SYS:13`, Haltezeit 1…Astrophysik-Stufe h (Auswahl im Sendefenster mit Fundchance), parallel ⌊√Astrophysik⌋.
- Ereignisse am Ende der Haltezeit: Rohstoffe (Metall/Si/Öl/Kunststoff T1+T2, Cap an Punkte + Laderaum), Schiffe (Pool baubar + 1, ohne Kolonieschiff), Piraten (echter Kampf, nie Totalverlust), Verzögerung, nichts.
- Flottenliste: Phase „hält“; Box „Letzte Expeditionen“; Kampfbericht bei Piraten.
- Spielstand: `z.letzteExpeditionen`, Flug-Phase `halten` (abwärtskompatibel, Version bleibt v11).
- Tests: `expedition.test.js`. Offene Punkte: Ausschlussliste Schiffsfunde u. a. (docs/OFFENE-PUNKTE.md).

## [0.14.3] – 2026-10-31 – Hangar-Schutz + Spionage-Bodenbewegungen (Sandro t34u)

- FEST: Verteidiger-Zivilschiffe werden bei verlorenem Orbit nur vernichtet, wenn sie zur Kampf-Flotte gehören (Startplätze); Zivil im Hangar bleibt immer erhalten. Solarsatelliten (Orbit) fallen mit dem Orbit.
- Spionagebericht zeigt nur Schiffe auf den Startplätzen (gleiche Preset-/Kapazitätslogik wie im Kampf), Verteidigung, Trümmer. Hangar-Typen/-Zahlen werden nie angezeigt; stattdessen Hinweis „Bodenbewegungen erkennbar – möglicherweise weitere Schiffe im Hangar.“ bzw. „Keine Bodenbewegungen erkennbar.“
- Testgegner: optionale `startplaetze` (Standard weiterhin 300 Plätze → Hangar leer).
- Tests: `hangar-spionage.test.js`.

## [0.14.2] – 2026-10-31 – Zivilschiffe + Trümmer bergen (Sandro t33u)

- Kampfkern: Zivilschiffe (`gruppe !== "kampf"`) kämpfen nicht und sind keine Ziele; bei Totalverlust des Angreifers vernichtet; Verteidiger-Zivil fällt mit dem Orbit (ANNAHME). Bericht `zivil`.
- Auto-Bergung: Angriff mit Wracksammlern + Sieg → Orbit-Trümmer nach Phase 2 eingesammelt (`geborgen`, Kampfbericht „Orbit geborgen“). Boden-Schrott bleibt beim Besitzer.
- Neue Mission „Trümmer bergen“ (`sammeln`, braucht Wracksammler, Kapazität 100.000 je Schiff). Ladung wird bei Rückkehr gutgeschrieben.
- Test-Seed: 4 Wracksammler am Heimatplaneten.
- Tests: `zivil-bergung.test.js` (kompletter Testablauf + Totalverlust + Verteidiger-Zivil); Playtest-Testphase erweitert.

## [0.14.1] – 2026-10-31 – Testphase: Gegner + echte Spionage/Angriffe (Sandro t32u)

- Minimales Gegnermodell `z.gegner` (Spielstand v11 mit Migration), `letzterKampfbericht`, `letzterSpionagebericht`.
- `SS.kern.testphase.legeTestphaseAn(z, jetzt)`: Master an, starker Heimatplanet (Flotte + Verteidigung), Testkolonie, 2 Gegner (Alpha/Beta, je ≤5 Einheiten), Favoriten, 100 Mio. Ressourcen. Überschreibt bestehende Daten.
- Spionage + Angriff auf Gegner: echter Kampf (Phase 1 Orbit, Phase 2 Boden), Bericht gespeichert, Verluste beidseitig, Trümmerfeld, Überlebende fliegen heim.
- UI: Knopf „Testphase laden“, Optgroup „Gegner“ im Zielmenü, Box „Letzter Kampfbericht“ (kampfbericht.js) + Spionagebericht.
- Tests: `testphase.test.js`, Playtest `playtest-testphase.js` (Screenshots `playtest/testphase-*.png`).

## [0.14.0] – 2026-10-31 – Kapitel Kampfsystem / Kampfbericht (Sandro t31u)

- Spezifikation C11: Phasen (Orbit → Boden nur bei ≥1 überlebendem Angreifer), Orbitalverteidigung als eigenes System, Zwei-Hüllen + Waffentypen als FEST; Zahlen bleiben ANNAHME.
- Kampfkern: Rundenprotokoll je Einheitentyp – Startanzahl, Verluste, Rest, Hüllenstände (Energie/Metall), zugefügter Schaden je Seite, Waffeneinsatz je Waffentyp; Phase 2 als „findet nicht statt“ markiert, wenn kein Angreifer übrig ist. Bisherige Summenfelder bleiben (rückwärtskompatibel).
- Neuer Kampfbericht (`js/ui/kampfbericht.js`) im Kampf-Simulator: Sieger + Gesamtverluste ganz oben, Phase 1/2 mit Rundentabellen (Verluste grün = eigene/Verteidiger, rot = Angreifer), Details-Dropdown je Phase (Schaden, Hüllen, Waffen), Trümmerfelder am Ende (Orbit/Wracksammler, Boden/Bodensammler).
- Offene Punkte 67–73 (Schnellfeuer, Zufall, Beute, Salvage, Def-Werte, Orbital-Zerstörung, Universumsgeschwindigkeit/KI-Angriffe): später.
- Tests: neue Unit-Tests `kampfbericht.test.js`, Playtest Kapitel 5 prüft den Bericht (Screenshots `playtest/kapitel-kampfsystem-*.png`).

## [0.13.1] – 2026-10-31 – Flotte: Antworten t30u (Offene Punkte 58–66)

- Verteidigung: Keine Verteidigungsflotte nur noch, wenn **alle** Startplätze durch Flotten unterwegs belegt sind; sonst verteidigen die freien Startbahn-Schiffe (Kampfkern + Simulator).
- OGame-Flugformeln + unterschiedliche Schiffstempi als FEST dokumentiert.
- Master: Flugzeit sofort (Ankunft/Rückkehr sofort).
- Missionen: Stationieren nur hin, Transport hin und zurück; Transport-Ladung im Sendeformular, am Ziel sofort entladen, automatische Rückkehr.
- Flottenfenster: Tabs Startplatz/Hangar als große zuklappbare Dropdowns, Senden integriert (keine separate Seite mehr).
- Presets: unverändert, Offener Punkt 58 „später“.
- Tests: Unit + Playtest Kapitel 6 angepasst/erweitert.

## [0.13.0] – 2026-10-31 – Kapitel 6: Flotte
- **Menüpunkt Flotte** jetzt echt. **Flottenfenster:** Startbahnen (Kapazität = Startplatz-Kapazität in Schiffen) und Hangar; Preset-Dropdown *Gesunder Mix / Starke Energiehülle / Starke Metallhülle / Maximale Feuerkraft* füllt die Startbahnen automatisch (Standard: Gesunder Mix). Die Startbahn-Schiffe sind die Verteidigungsflotte.
- **Sendefenster** („Flotte senden“): freie Schiffswahl bis zu den freien Startplätzen (max/Alle/Keine), Ziel per Dropdown (eigene Planeten + Favoriten) oder Koordinaten, Favorit speichern, 6 Missionen (Kolonisieren, Transportieren, Stationieren, Spionieren, Angriff, Unterstützen), Vorschau Entfernung/Tempo/Flugzeit/Ankunft/Rohöl, Knopf **Lossenden**.
- Nach dem Start zeigt das Flottenfenster belegte/freie Startplätze; die Rest-Startbahn wird nach Preset neu gefüllt.
- **Solange eine eigene Flotte unterwegs ist:** keine Orbit-Verteidigungsflotte – Phase 1 nur Orbitalverteidigungsplattform (+ Solarsatelliten), Phase 2 Bodenverteidigung (Kampfkern + Simulator).
- **Rechte Seitenleiste** (immer sichtbar; Handy: unten): Flotten im Flug mit Mission, Ziel, Restzeit (live, h:mm:ss) und Fortschritt %.
- Flugzeit/Entfernung/Verbrauch nach OGame-Formeln (ANNAHME), Rückkehr der Schiffe, Meldung bei Ankunft/Rückkehr.
- Infofenster: passt es weder unter noch über den Knopf, erscheint es seitlich daneben.
- Spielstand **v10** (planet.flotte.preset, z.flotten, z.favoriten). Tests `tests/flotte.test.js`, Playtest `tests/playtest-kapitel6.js` (Screenshots `playtest/kapitel6-*.png`).

## [0.12.1] – 2026-10-31 – Antworten t27u (Offene Punkte 51–57)
- Kampf: Bonus ×1,5 / Malus ×0,5 gilt auch für Ziele **ohne** Energiehülle (wie „Hülle gebrochen“). 6 Runden/Phase bestätigt.
- Planetenschild (Schildkuppel/Festungsschild): kein Cooldown, nach jedem Angriff automatisch wieder aktiv (nie zerstört).
- Orbitalverteidigungsplattform: nach Angriff immer 100 % wieder da (wie OGame-Mond), außer ein Titan überlebt beim Angreifer → dann normale Verluste/Trümmer.
- Trümmer/Bergung/Werte (54/56) und Verteidigungs-Bilder (57) als „später“ markiert; Platzhalter bleiben.
- Neuer Test; Version 0.12.1.

## [0.12.0] – 2026-10-31 – Kapitel 5: Verteidigung
- **Menüpunkt Verteidigung** jetzt echt (Retro-Layout wie Werft): Verteidigungswerft-Info, Aufträge, Anlagen in Gruppen Geschütze/Schilde/Orbit, Waffen-&-Hüllen-Tabelle, Kampf-Simulator.
- **10 Anlagen:** Maschinen-Nest, Raketenbatterie, Laser-Turm, Puls-Laser, Magnetkanone, Ionen-Geschütz, Plasma-Turm, Schildkuppel, Festungsschild, Orbitalverteidigungsplattform (aus der Werft umgezogen, 6 Stufenbilder bleiben) → **24 Schiffe**.
- **Zwei-Hüllen-System** (Metall + Energie gleichzeitig) und **7 Waffentypen** (neu: Maschinenkanone/Gatling, Magnetkanone/Railgun) mit Profilen; Schiffe neu bewaffnet (Drohnen nur Metall + Gatling/Raketen, späte Schiffe starke Energiehüllen).
- **Kampfkern** `SS.kern.kampf`: Phase Orbit → Phase Boden, Hangar geschützt, Nachrücken nach dem Kampf, Planetenschild, Reparatur/Schrott/Trümmer (Zahlen ANNAHME). Echte Angriffe folgen mit Kapitel 6.
- Spielstand **v9** mit Migration (Orbitalplattform-Bestand → Verteidigung, offene Werft-Aufträge erstattet).
- Tests: `tests/verteidigung.test.js`, Playtest `tests/playtest-kapitel5.js` (Screenshots `playtest/kapitel5-*.png`).

## [0.11.4] – 2026-10-31 – Frachter-Leiter (25 Schiffe)
- **Neu: Großer Frachter** (`grosser_frachter`, Hilfsschiff, Transporter) – 250.000 Ladung, Bild = Vorschlag H (PNG 400×400).
- **Massengutfrachter** (`massengutfrachter`, ID unverändert): Ladung 250.000 → **1.000.000**, Kosten/Werft/Forschung angehoben (Endgame), Bild = Vorschlag G (PNG).
- Frachter-Leiter: Klein 5.000 · Mittel 50.000 · Groß 250.000 · Massengut 1.000.000. Kosten/Tempo/Verbrauch des Großen Frachters = ANNAHME.
- Feste Schiffsanzahl jetzt **25** (bewusst, Sandro). Alte Saves: keine Migration nötig (neue ID startet mit 0, Massengut-Bestand bleibt).
- Vorgemerkt: Orbitalverteidigungsplattform wandert künftig in die Verteidigung (Kapitel 5).
- Playtest Kapitel 4: Screenshots `playtest/kapitel4g-*.png`.

## [0.11.1] – 2026-10-31 – Erste echte Schiffsbilder
- 17 von Sandro freigegebene Schiffsbilder als PNG (400×400) eingebaut; übrige Schiffe weiter SVG-Platzhalter (`SS.DATEN.schiffPngFreigegeben`).
- `tools/erzeuge-grafiken.js` überschreibt freigegebene PNG-Schiffe nicht.
- Neue Bildvorschläge C/D für Bomber, Titan, Kleiner Frachter, Massengutfrachter, Bodensammler, Solarsatellit, Orbitalverteidigungsplattform (noch nicht eingebaut).
- Playtest Kapitel 4: Screenshots `playtest/kapitel4d-*.png`.

## [0.11.0] – 2026-10-31 – Werft im OGame-Retro-Layout

- Werft-Seite neu im Stil des klassischen OGame: **ein Schiff je Zeile** über die volle Breite, **großes Schiffsbild links** (200 px Desktop, 120 px Handy), rechts Name/Info, Anzahl, Beschreibung, Voraussetzungen, Werte und Bau-Steuerung; Gruppen-Boxen innen als Liste (Zebra-Zeilen) statt Kachel-Raster
- Sandro bestätigt: 24 Schiffe fest, Bodensammler-Werte, alte Schiffe ohne Entsprechung verwerfen (Fragen 43–45 erledigt)
- Bildvorschläge (2 je Schiff) erzeugt, noch nicht eingebaut – liegen unter `/workspace/sternenspiel-bildvorschlaege/`
- Playtest Kapitel 4 → Screenshots `kapitel4c-*.png`

## [0.10.0] – 2026-10-30 – Kapitel 4: Schiffsliste nach Sandro

- Werft neu nach Sandros Schiffsliste v2: **24 Schiffe** (23 aus v2 + **Bodensammler**, von Sandro ergänzt – ersetzt die frühere FEST-Zahl 23)
  in den Gruppen **Kampfschiffe** (14), **Hilfsschiffe** (5, inkl. Wracksammler/Orbit und Bodensammler/Boden), **Spezial** (5)
- Neu u. a.: Aufklärer, Kleine/Mittlere/Schwere Drohne, Korvette, Fregatte, Koloss, Titan, Massengutfrachter; Träger mit Hangar (50 Drohnen)
- **Orbitalverteidigungsplattform** (vorher Orbitalplattform): stationär, Waffenslots + Sondenabwehr als Daten, Bestückung folgt (Platzhalter)
- Solarsatellit braucht jetzt Energie-Technologie 1; Verbund-Hüllenfaktor 1,25
- **Werft-Warteschlange unbegrenzt** (vorher 5); Sperre Werft-Ausbau ↔ Schiffbau bleibt
- Nur **neutrale Platzhalterbilder** je Schiff; Bildvorschläge für Sandro folgen
- Spielstand **v8** mit Migration: alte IDs 1:1 umbenannt, wo eindeutig, sonst verworfen (Aufträge erstattet)
- Tests: `tests/werft.test.js` erweitert, `tests/playtest-kapitel4.js` → Screenshots `kapitel4b-*.png`

## [0.9.0] – 2026-10-30 – Kapitel 4: Werft

- Menüpunkt **Werft** gefüllt: **23 Schiffe** in 3 Gruppen (zivil, Kampf, Spezial), je eigenes SVG (`assets/schiffe/`), Anzahl, Kosten, Bauzeit,
  Antrieb, Waffentyp(en) farbig, Hülle, Voraussetzungen grün/rot, Menge + „Max“, Knopf mit Sperrgrund, ⓘ-Info mit Kampfwerten und Schnellfeuer
- **5 Waffentypen** (Laser, Ionen, Plasma, Raketen, Graviton), **2 Hüllentypen** (Leichtmetall, Verbund) – Anzahlen FEST, Werte ANNAHME
- **Solarsatelliten** werden jetzt in der Werft gebaut
- Werftaufträge: bis 5 je Planet, nacheinander, Echtzeit + offline, Abbrechen erstattet Rest; Werft während des Baus nicht ausbaubar (ANNAHME)
- Übersicht zeigt den laufenden Werftauftrag; Master-Modus stellt Aufträge sofort fertig
- Spielstand **v7** mit Migration; Fragen 34/35/36/38 geschlossen (von Sandro bestätigt)
- Tests: `tests/werft.test.js`, `tests/playtest-kapitel4.js`

## [0.8.0] – 2026-10-19 – Kapitel 2: Antworten umgesetzt · Kapitel 3: Forschung

### Kapitel 2 – Sandros Antworten
- Kunststoffwerk T2/T3 werden über Spielerpunkte freigeschaltet: **T2 ab 500**, **T3 ab 5.000 Punkten** (ANNAHME), Anzeige „Ab X Punkten.“;
  einmal erreicht bleibt das Werk frei (Flag im Spielstand)
- **Keine Stufenobergrenze** mehr für Gebäude (Raumflughafen bleibt 1, Startplätze 10); Zahlen mit Mrd./Bio./Brd./Trio., Zeiten mit Tagen/Jahren
- **Startplatz-Bauzeiten ÷ 11** (Z Stufe 10 ≈ 342 Tage statt ≈ 10 Jahre); andere Gebäude unverändert
- Regel „zu wenige Startplätze“ für den späteren Flottenversand dokumentiert
- Spielstand **v6** (Migration je Profil: T2/T3-Flags nach Punkten)

### Kapitel 3 – Forschung
- Menüpunkt **Forschung** gefüllt: genau **18 Forschungen** in 5 Gruppen, je eigenes SVG (`assets/forschung/`), Stufe, Beschreibung,
  Voraussetzungen grün/rot (Komprimierung mit ODER), Kosten, Dauer, Wirkung jetzt/nächste Stufe, Knopf mit Sperrgrund, ⓘ-Info mit den nächsten 5 Stufen
- Alle Forschungen in der **Forschungseinrichtung** (Stufe ≥ 1); Zeit = (M + Si) / (1000 · (1 + Stufe)) Std.; **eine Forschung gleichzeitig**,
  unabhängig vom Bauauftrag; Einrichtung während einer Forschung nicht ausbaubar (und umgekehrt); Echtzeit + offline; Abbrechen erstattet voll
- **Energie-Technologie** wirkt jetzt: +5 % Stromerzeugung je Stufe (Solarfarm, Ölverbrennung, Satelliten; ANNAHME)
- **Roboterforschung** wirkt jetzt: Gebäude- und Startplatz-Bauzeit ÷ (1 + 1,5 · Stufe) (ANNAHME), **nicht** auf Forschung
- Übrige Wirkungen berechnet und angezeigt (zentrale `SS.kern.forschung.bonus()`), angewendet in späteren Kapiteln
- Sichtbarkeit: ausgeblendet, bis mindestens eine Voraussetzung erfüllt ist (ANNAHME); Master zeigt alle, forscht sofort und kostenlos
- Übersicht: Kasten „Forschung“ mit Fortschritt/Abbrechen bzw. Hinweis „Forschungseinrichtung bauen“; Ressourcen: Energie-Technik-Zeile
- Spielstand v6: `forschung` (18 Stufen) + `forschungsauftrag`
- Tests: `tests/forschung.test.js` (12), `tests/antworten.test.js` (4) → 69 Node-Tests; `tests/playtest-kapitel3.js` (78 Prüfungen Desktop + Handy)

## [0.7.0] – 2026-10-19 – Kapitel 2: Master-Modus, Infofenster, Geologie, Startplätze A–Z

Sandro hat Kapitel 2 gesehen („sehr gut“) und Nachbesserungen vor Kapitel 3 vorgegeben.

### Neu
- **MASTER-Knopf** (Testmodus) im Kopfbereich, je Profil gespeichert: keine Bauzeiten (auch laufende Aufträge sofort fertig),
  keine Kosten, Punkte-/Freischalt-Sperren ignoriert; gelber Hinweis „MASTER aktiv“ mit „Ausschalten“
- **Info-Fenster ⓘ** an allen Gebäuden und Startplätzen (Desktop Hover, Handy Antippen, Schließen ×, Esc): ausführliche
  Beschreibung + Tabelle aktuelle und nächste 5 Stufen mit Ertrag/Wirkung, Differenz, Strom, Kosten, Bauzeit; bleibt im Bildschirm
- **Rohölvorkommen** je Planet (Hauptplanet 1.000.000): Bohrstation fördert `min(Rate, Vorkommen)`, auch offline
- **Geologiestation** findet alle 24 Std. (Echtzeit, offline nachgeholt) ein Feld: Stufe 1 = 50.000–100.000, Stufe 2 = 80.000–125.000,
  ab Stufe 3 ×1,25 je Stufe (ANNAHME); Fund-Log mit Datum/Stufe/Menge + Countdown; Master: „Fund sofort auslösen“
- **Übersicht**: Punkte groß, Kasten „Rohölvorkommen“ (Vorkommen, Förderung/h, Reichweite, nächster Fund)
- **Startplätze A–Z** (26 × 10 Stufen): nächster Buchstabe nach Vorgänger Stufe 10 + Punkte-Schwelle; A10 = 100 Schiffe,
  Summe bis Z10 ≈ 10 Mrd.; Raumflughafen-Unterseite neu (26 kompakte Karten, Sperrgrund, Gesamtkapazität)
- Hangar-Regel für das Flotten-Kapitel dokumentiert und im Modell vorbereitet (`planet.hangar`, nicht aktiv)

### Geändert
- Kunststoff T2 = 40 Rohöl + 20 Metall, T3 = **1000 Rohöl + 500 Silizium + 500 Metall** je Einheit
- Kunststoffwerk T2/T3 gesperrt („Wird später mit Spielfortschritt freigeschaltet.“), Master ignoriert die Sperre
- Rohölfelder/h und „Rohöl unbegrenzt am Hauptplaneten“ entfernt
- **Spielstand v5** mit automatischer Migration je Profil (Vorkommen, Geologie-Takt, 26 Startplätze, Startplätze > 10 → 10, Master aus)
- Version 0.7.0 mit `?v=0.7.0` an allen Dateien

### Tests
- Node: 53 Tests (neu `tests/nachbesserung.test.js`); Browser: `tests/playtest-kapitel2b.js` (94 Prüfungen Desktop + Handy)


## [0.6.0] – 2026-10-19 – Kapitel 2: Anlagen

Sandro hat Kapitel 1 abgenommen und Kapitel 2 „Anlagen“ freigegeben.

### Neu
- **Anlagen** als OGame-ähnliche Kacheln in 4 Gruppen (Ressourcenabbau, Energie, Kunststoffproduktion, Weitere Anlagen):
  Metallmine, Siliziummine, Bohrstation, Solarfarm, Ölverbrennungsstation, Solarsatelliten (nur Anzeige), Kunststoffwerk T1–T3,
  Geologiestation, Raumflughafen, Werft, Verteidigungswerft, Forschungseinrichtung – je eigenes SVG (`assets/gebaeude/`),
  Stufe, Beschreibung, Kosten/Bauzeit der nächsten Stufe, Wirkung jetzt/nächste Stufe, Knopf „Bauen/Ausbauen“ (deaktiviert mit Grund)
- **Bauauftrag**: 1 Bauplatz je Planet, Echtzeit + Offline (stückweise simuliert, Aufträge enden genau pünktlich),
  Fortschrittsbalken, Abbrechen mit voller Erstattung (ANNAHME)
- **Energie**: Strom als Bilanz mit Produktionsfaktor (OGame-Stil); Regler 0–100 % je Gebäude (Seite Ressourcen)
- **Kunststoff-Kette** T1 (Rohöl), T2 (Rohöl + Metall), T3 (2000 Rohöl + 2000 Silizium + 750 Metall je Einheit) mit Drosselung,
  Bestände nie negativ
- **Raumflughafen** mit Unterseite `#anlagen/raumflughafen`: Startplätze A–J, Stufe 1–15, Punkte-Freischaltung, Gesamtkapazität
- **Punkte** (1 je 1.000 verbaute, gewichtete Rohstoffe), Geologiestation (Rohölfelder/h), Datenmodell `planeten[]` mit
  `istHauptplanet`, `rohoelfelder`, `bauauftrag`, `startplaetze`
- Neue Kernmodule `js/kern/bau.js`; `js/kern/produktion.js` neu (Raten, Energie, Simulation)

### Zurück (aus 0.4.0, erweitert)
- **Ressourcen-Seite**: Rohstofftabelle (Bestand, Produktion, Verbrauch, Netto je Std.), Energiebilanz, Produktion je Gebäude
- **Übersicht**: Hauptplanet mit Koordinaten, Sektor, System, Position; Kommandant (Punkte), Bauauftrag, Spielstand-Knöpfe
  inkl. „Laden“
- **Ressourcenleiste** mit Rate „/h“; Kunststoff T1–T3 sichtbar (Antimaterie weiter ausgeblendet); Strom als „Erzeugung / Bedarf“

### Geändert / Entfernt
- Lagergrenzen entfernt (keine Speichergebäude); vorläufige Grundproduktion ersetzt durch kleine Grundproduktion am
  Hauptplaneten (Metall 30, Silizium 15/h); Startbestand Metall 500, Silizium 300, Rohöl 100
- Spielstand **v4** mit Migration von v1–v3 (alte Startplatz-/Gebäude-/Lager-Felder verworfen, Strom = 0)
- Version **0.6.0** (Cache-Schutz `?v=0.6.0`)
- Tests: neue Node-Tests `tests/anlagen.test.js` (44 Node-Tests gesamt); Playtest `tests/playtest-kapitel2.js` ersetzt
  `playtest-kapitel1-struktur.js`; Umgebungsvariable für die Browserwahl heißt jetzt `PLAYTEST_BROWSER`
- Screenshots `playtest/kapitel2-*.png`

## [0.5.0] – 2026-10-19 – Kapitel 1: reine Seitenstruktur

Sandros Klarstellung: Kapitel 1 ist **nur Seitenstruktur + Layout**; jeder Menüpunkt bzw. jede Mechanik bekommt ein eigenes Kapitel.

### Geändert
- Alle Menüseiten außer Übersicht zeigen nur noch **Seitentitel + neutralen Platzhalter** („Wird in einem eigenen Kapitel ausgearbeitet.“)
- **Übersicht** reduziert auf Hauptplanetname + Koordinaten und Knöpfe Speichern / Spieler wechseln / Zurücksetzen
- **Ressourcenleiste** als Platzhalter: nur Metall, Silizium, Rohöl, Strom (nur Bestand, keine Rate); Kunststoff T1–T3 und
  Antimaterie per Flag `freigeschaltet.<id>` ausgeblendet (bleiben im Datenmodell; alte Spielstände bekommen die Flags per Migration)
- Version **0.5.0** (Cache-Schutz `?v=0.5.0`, `data-version`, `SS.VERSION`)
- Doku: SPEZIFIKATION (A5), KAPITELPLAN (Kapitel 1 + Sammlung späterer Kapitel, Reihenfolge offen), README, OFFENE-PUNKTE, NOTES
- Tests: Node-Tests angepasst (Menü ohne Kapitelnummern, Ressourcen-Flags); Playtest `tests/playtest-kapitel1-struktur.js`
  (ersetzt `playtest-kapitel1-layout.js`, mit `LIVE_URL`-Modus); Screenshots `playtest/kapitel1-final-*.png`

### Entfernt (aus der Oberfläche; Code liegt in der Git-Historie)
- Rohstofftabelle (Ressourcen), Weltraum-Navigation/Sektor-/Systemansicht (Weltraum), Startplätze-Abschnitt (Flotte),
  Kapitelnummern-Hinweise („Kap. X“, „Kommt in Kapitel X“), Knopf „Laden“ in der Übersicht, zugehöriges CSS
- Alte Screenshots `playtest/kapitel1-layout-*.png`

### Unverändert
- Spielerprofile, automatischer Start, Speichern/Autospeichern/Offline-Fortschritt, Start-Fix, Versionsprüfung
- Weltraum-Hierarchie 1/5/300/12 und Startplatz-Regeln im Datenmodell/den Konstanten (nicht sichtbar)

## [0.4.0] – 2026-10-19 – Kapitel 1: Start-Fix + Spielerprofile

### Behoben
- **„Klick auf Start geht nicht“ (Live-Seite):** Ursache war ein **gemischter Browser-Zwischenspeicher** nach dem Update
  (GitHub Pages liefert mit `max-age=600`): neue `index.html` + altes `js/ui/app.js` (oder umgekehrt) → `app.js` brach beim
  Start mit „Cannot read properties of null (reading 'addEventListener')“ ab, kein Knopf bekam seine Funktion; der
  Formular-Knopf lud die Seite nur stumm neu („/?“).
- Alle Skript-/CSS-Verweise mit **Cache-Schutz `?v=<Version>`**; `<html data-version>` wird mit `SS.VERSION` verglichen –
  bei Abweichung oder fehlendem Modul **einmal automatisch neu laden** (mit `?neu=<Zeit>`), sonst sichtbare Meldung mit „Neu laden“
- Knöpfe werden „sicher“ verbunden (fehlende Elemente brechen den Start nicht mehr ab), Fehlerfang um Start/Laden/Speichern,
  Formular mit `onsubmit="return false"`, Notfall-Meldung direkt im HTML, falls `app.js` nicht startet
- Kaputte/fremde Spielstände blockieren nie: werden als `…_defekt…` gesichert, Meldung in der Oberfläche, Neuanlage geht weiter

### Neu
- **Spielerprofile:** Startbildschirm = Spielerauswahl (Name, Planet, Koordinaten, zuletzt gespielt, „Spielen“, „Löschen“ mit
  Bestätigung) + „Neuen Spieler erschaffen“ (Name, optional Planetenname, automatischer Start)
- Jeder Spieler hat einen eigenen Spielstand (`sternenspiel_spielstand_p_<id>`) mit eigenem Offline-Fortschritt;
  Spielerliste in `sternenspiel_profile_v1`
- Im Spiel: „Spieler wechseln“ (speichert vorher) im Menü und in der Übersicht; „Zurücksetzen“ betrifft nur den aktiven Spieler
- Alter Einzel-Spielstand (v1/v2/v3) wird beim ersten Start automatisch zum ersten Profil (Original bleibt als
  `sternenspiel_spielstand_v1_uebernommen` gesichert)
- Tests: 29 Node-Tests (9 neu für Profile/Migration/Cache-Schutz), neuer Browser-Playtest `tests/playtest-kapitel1-profile.js`
  (file://, lokaler Server für Cache-Mix, `LIVE_URL=` für die Live-Seite; Chromium + Firefox)

### Entfernt
- „Weiterspielen“/„Hauptmenü“ (ersetzt durch Spielerauswahl / „Spieler wechseln“)

## [0.3.0] – 2026-10-19 – Kapitel 1: Startplatz-Korrektur (automatischer Start, Startplätze als Flotten-Kapazität)

### Geändert
- **Spielstart automatisch** auf einem Hauptplaneten (zufällige Koordinate Sektor:System:Planet) – keine Planeten-/Startplatz-Auswahl
  mehr; Spieler- und Planetenname optional direkt auf dem Startbildschirm
- **Produktion = Grundrate** für alle (Startplatz-Boni-Formel komplett entfernt); Ressourcen-Tabelle ohne Bonus-Spalte
- Übersicht zeigt nur noch Hauptplanet + Koordinaten (keine Startplatz/Stufe/Schwerpunkt-Anzeige)
- `js/data/startplaetze.js` neu: Startplätze = Start-/Abschussplattformen für Flotten (Regeltexte, Buchstaben A–J, Anfangszustand)
- Konstanten: `STARTPLATZ` (Boni) entfernt, `STARTPLAETZE` (max. 10, Stufe 1–15, Kapazität/Kosten/Punkte = offen) neu
- Spielstand **v3**: `startplaetze` (10 Einträge, A Stufe 1 frei – ANNAHME), `punkte`; Migration v1/v2 → v3 behält die Heimat und verwirft das alte `startplatz`-Feld
- Seite „Flotte“: Info-Abschnitt „Startplätze (kommt in Kapitel 6)“ mit Regeln und Vorschau A–J
- Ressourcenleiste auf dem Desktop wieder einreihig (CSS-Spezifität der Handy-Regel überschrieb die Desktop-Regel)
- Doku (SPEZIFIKATION A3/B1/B1a, KAPITELPLAN, OFFENE-PUNKTE, README, NOTES) angepasst
- Tests: 20 Node-Tests, Playtest mit 168 Prüfungen; neue Screenshots

### Entfernt
- Startplatz-Wahl-Bildschirm A–Z, Startplatz-Boni, Zuordnung Startplatz → Heimatplanet

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
