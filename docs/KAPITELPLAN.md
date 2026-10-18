# Sternenspiel – Kapitelplan

Stand: 2026-10-19 · Jedes Kapitel ist für sich lauffähig, getestet (Node + Browser-Playtest Handy/Desktop) und wird einzeln committet.

**FEST (Sandro, 2026-10-19):** Kapitel 1 ist **nur Seitenstruktur + Layout**. **Jeder Menüpunkt bzw. einzelne Mechaniken
bekommen später eigene Kapitel.** Die Weltraum-Ansicht und die Startplätze kommen ebenfalls erst später.
Reihenfolge und Nummern der späteren Kapitel sind **noch offen** (legt Sandro fest) – die Liste unten ist nur eine Sammlung.

| Kapitel | Inhalt | Status |
|---------|--------|--------|
| 1 | **Reine Seitenstruktur**: 8 Menüseiten im gleichen Layout (ohne Inhalt), Ressourcenleiste als Platzhalter, Übersicht mit Hauptplanet + Koordinaten, Spielerprofile, automatischer Start, Speichern, Start-Fix/Versionsmarke | ✅ **erledigt** (0.5.0, 2026-10-19) |
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

## Spätere Kapitel (Sammlung, Reihenfolge offen)

| Thema | Menüseite | Bekannte Vorgaben (FEST) / Notizen |
|-------|-----------|------------------------------------|
| Ressourcen-Seite (Rohstofftabelle, Produktion, Lager) | Ressourcen | Rohstoffe Metall, Silizium, Rohöl, Strom, Kunststoff T1–T3, Antimaterie |
| Anlagen | Anlagen | **Geologiestation** |
| Forschung | Forschung | Freischaltung Kunststoff T1–T3 / Antimaterie (Wodurch? offen) |
| Werft | Werft | **23 Schiffe, 5 Waffentypen, 2 Hüllentypen** |
| Verteidigung & Kampf | Verteidigung | **Schutzschild-Autoaktivierung (Solo-Regel)**, **Trümmer-Salvage 50–75 % Boden / 80 % Orbit** |
| Flotte | Flotte | **Treibstoffregeln** (Inhalt offen) |
| **Startplätze** (eigene Mechanik) | Flotte o. Anlagen (offen) | bis zu 10, Stufe 1–15, stark steigende Kosten, punktebasierte Freischaltung, Kapazität = nur Anzahl Schiffe, Summe = gleichzeitige Starts, keine Zuordnung Schiff → Startplatz |
| **Weltraum-Ansicht** (Navigation Sektoren/Systeme/Planeten) | Weltraum | Hierarchie 1/5/300/12 (Datenmodell steht schon) |
| KI-Gegner | – | **5–10 Angriffe/Ereignisse täglich** |
| Balancing, Feinschliff | alle | – |

Die frühere Umsetzung von Rohstofftabelle, Weltraum-Navigation und Startplatz-Info (0.2.0–0.4.0) liegt in der Git-Historie
und kann beim jeweiligen Kapitel wiederverwendet werden.
