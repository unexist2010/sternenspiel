# Sternenspiel – Kapitelplan

Stand: 2026-10-19 (0.8.0) · Jedes Kapitel ist für sich lauffähig, getestet (Node + Browser-Playtest Handy/Desktop) und wird einzeln committet.

**FEST (Sandro, 2026-10-19):** Kapitel 1 ist **nur Seitenstruktur + Layout**. **Jeder Menüpunkt bzw. einzelne Mechaniken
bekommen später eigene Kapitel.** Die Weltraum-Ansicht und die Startplätze kommen ebenfalls erst später.
Reihenfolge und Nummern der späteren Kapitel sind **noch offen** (legt Sandro fest) – die Liste unten ist nur eine Sammlung.

| Kapitel | Inhalt | Status |
|---------|--------|--------|
| 1 | **Reine Seitenstruktur**: 8 Menüseiten im gleichen Layout (ohne Inhalt), Ressourcenleiste als Platzhalter, Übersicht mit Hauptplanet + Koordinaten, Spielerprofile, automatischer Start, Speichern, Start-Fix/Versionsmarke | ✅ **erledigt** (0.5.0, 2026-10-19) |
| 2 | **Anlagen**: 13 Gebäude in 4 Gruppen, Bauauftrag (1 je Planet), Energie-Bilanz, Kunststoff-Kette, Raumflughafen mit Startplätzen A–Z, Punkte; Ressourcen-Seite + Übersicht zurück; Nachbesserung: Master-Modus, Info-Fenster, Rohölvorkommen + Geologie | ✅ **erledigt** (0.6.0 + 0.7.0, 2026-10-19) |
| 3 | **Forschung**: 18 Forschungen in 5 Gruppen, Forschungseinrichtung, 1 Forschung gleichzeitig (Echtzeit + offline), Voraussetzungen inkl. ODER, Energie-Technologie + Roboterforschung wirken, übrige Wirkungen über `bonus()`; vorher Sandros Antworten zu Kapitel 2 (T2/T3 über Punkte, keine Stufengrenze, Startplätze ÷ 11) | ✅ **erledigt** (0.8.0, 2026-10-19) |
| später | eigene Kapitel je Menüpunkt bzw. Mechanik (siehe unten) | offen |
| – | Offene Punkte | laufend: `docs/OFFENE-PUNKTE.md` |

---

## Kapitel 1 – reine Seitenstruktur ✅

- Linkes Menü (8 Punkte, feste Reihenfolge: Übersicht, Ressourcen, Anlagen, Forschung, Werft, Verteidigung, Flotte, Weltraum)
  + mittleres Inhaltsfeld; Handy: ausklappbares Menü (☰)
- Jede Menüseite ist eine eigene Seite im gleichen Layout: **nur Seitentitel + neutraler Platzhalter**
  („Wird in einem eigenen Kapitel ausgearbeitet.“) – keine Tabellen, keine Navigation, keine Kapitelnummern
- **Übersicht** (Grundgerüst): Hauptplanetname + Koordinaten, Knöpfe Speichern / Spieler wechseln / Zurücksetzen
- **Ressourcenleiste als Platzhalter**: Metall, Silizium, Rohöl, Strom sichtbar; Kunststoff T1–T3 und Antimaterie per Flag
  (`zustand.freigeschaltet.<id> = false`) ausgeblendet, im Datenmodell vorhanden
- Weltraum-Hierarchie 1 Universum / 5 Sektoren / 300 Systeme / 12 Planeten **nur im Datenmodell** (Koordinaten des Hauptplaneten)
- Startplätze: Regeln nur als Doku in `js/data/startplaetze.js` / `konstanten.js` / Datenmodell – **nichts sichtbar**
- **Spielerprofile** (Spielerauswahl, eigener Spielstand + Offline-Fortschritt je Spieler, Wechseln, Löschen mit Bestätigung)
- Automatischer Start auf zufälligem Hauptplaneten, Speichern/Autospeichern, Migration alter Spielstände
- Robuster Start: Cache-Schutz `?v=`, Versionsprüfung, Fehler sichtbar statt toter Knöpfe
- Retro-Weltraum-Stil mit eigenen SVG-Grafiken (`assets/`), alles offline
- Tests: Node-Tests, Browser-Playtests (Handy 412×915, Desktop 1366×768) → `playtest/kapitel1-final-*.png`, `playtest/kapitel1-profile-*.png`

## Kapitel 2 – Anlagen ✅

- **Ressourcen-Seite**: Rohstofftabelle (Bestand/Produktion/Verbrauch/Netto), Energiebilanz, Produktion je Gebäude mit Reglern
- **Übersicht**: Hauptplanet, Koordinaten, Sektor, System, Punkte, laufender Bauauftrag, Spielstand-Knöpfe
- **Ressourcenleiste**: Metall, Silizium, Rohöl, Strom (Erzeugung/Bedarf), Kunststoff T1–T3; Antimaterie ausgeblendet
- **Anlagen** (Kacheln in Gruppen): Metallmine, Siliziummine, Bohrstation · Solarfarm, Ölverbrennungsstation, Solarsatelliten
  (Anzeige) · Kunststoffwerk T1–T3 · Geologiestation, Raumflughafen, Werft, Verteidigungswerft, Forschungseinrichtung
- **Raumflughafen** mit Unterseite Startplätze A–Z (26 × 10 Stufen, Vorgänger Stufe 10 + Punkte, Kapazität) – 0.7.0
- **Nachbesserung 0.7.0:** MASTER-Testmodus, Info-Fenster je Gebäude, Rohölvorkommen + Geologie-Funde alle 24 Std., Kunststoff-Rezepte, T2/T3 gesperrt
- Bauzeit nach OGame-Formel (ab 0.8.0 mit Roboterforschung), keine Stufenobergrenze (0.8.0), 1 Bauplatz je Planet, Offline-Fertigstellung
- Forschung (bis Kapitel 3), Werft, Verteidigung, Flotte, Weltraum blieben Platzhalter
- Formeln/Werte: `docs/SPEZIFIKATION.md` Abschnitt C; Tests `tests/anlagen.test.js`, `tests/playtest-kapitel2.js` → `playtest/kapitel2-*.png`

## Kapitel 3 – Forschung ✅

- **Forschung-Seite**: Kasten laufende Forschung, Kasten Forschungseinrichtung, 5 Gruppen (Grundlagen, Waffen & Verteidigung,
  Antriebe, Flotte & Spionage, Fortgeschritten) mit Kacheln: eigenes SVG, Stufe, Beschreibung, Voraussetzungen grün/rot (ODER),
  Kosten, Dauer, Wirkung jetzt/nächste Stufe („wirkt jetzt“ / „ab späterem Kapitel“), Knopf „Forschen → Stufe n“ mit Sperrgrund, ⓘ
- Ausgeblendete Forschungen mit Zähler; Hinweis + Knopf „Forschungseinrichtung bauen“, wenn sie fehlt
- **Übersicht**: Kasten „Forschung“ mit Fortschritt, Restzeit, Abbrechen
- Energie-Technologie (+5 % Strom je Stufe) und Roboterforschung (Bauzeit ÷ (1 + 1,5 n)) wirken jetzt
- Master: sofort, kostenlos, ohne Voraussetzungen, alle 18 sichtbar
- Formeln/Werte: `docs/SPEZIFIKATION.md` A9 + C7; Tests `tests/forschung.test.js`, `tests/playtest-kapitel3.js` → `playtest/kapitel3-*.png`

## Spätere Kapitel (Sammlung, Reihenfolge offen)

| Thema | Menüseite | Bekannte Vorgaben (FEST) / Notizen |
|-------|-----------|------------------------------------|
| Forschungs-Wirkungen anwenden | Werft/Flotte/… | Waffen/Schild/Panzerung, Antriebe, Computer, Spionage, Astrophysik, Komprimierung, Graviton über `SS.kern.forschung.bonus()`; Antimaterie-Freischaltung offen |
| Werft | Werft | **23 Schiffe, 5 Waffentypen, 2 Hüllentypen**; Solarsatelliten bauen (Anzeige steht schon) |
| Verteidigung & Kampf | Verteidigung | **Schutzschild-Autoaktivierung (Solo-Regel)**, **Trümmer-Salvage 50–75 % Boden / 80 % Orbit** |
| Flotte | Flotte | **Treibstoffregeln** (Inhalt offen) |
| Startplätze im Flottenbetrieb | Flotte | Bau steht (Kapitel 2, Raumflughafen); Nutzung der Kapazität bei Starts + Hangar-Regel (SPEZIFIKATION A7/80) folgt mit der Flotte |
| **Weltraum-Ansicht** (Navigation Sektoren/Systeme/Planeten) | Weltraum | Hierarchie 1/5/300/12 (Datenmodell steht schon) |
| KI-Gegner | – | **5–10 Angriffe/Ereignisse täglich** |
| Balancing, Feinschliff | alle | – |

Die frühere Umsetzung von Rohstofftabelle, Weltraum-Navigation und Startplatz-Info (0.2.0–0.4.0) liegt in der Git-Historie
und kann beim jeweiligen Kapitel wiederverwendet werden.
