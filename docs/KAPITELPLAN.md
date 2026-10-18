# Sternenspiel – Kapitelplan

Stand: 2026-10-19 · Jedes Kapitel ist für sich lauffähig, getestet (Node + Browser-Playtest Handy/Desktop) und wird einzeln committet.

| Kapitel | Inhalt | Menüseite(n) | Status |
|---------|--------|--------------|--------|
| 1 | **Layout-Grundgerüst**: Menü, Weltraum-Hierarchie, Ressourcenleiste, Platzhalter, Retro-Stil | Übersicht, Ressourcen, Weltraum | ✅ **erledigt** (2026-10-18) |
| 2 | Ressourcen & Anlagen: Gebäude inkl. Geologiestation, Förderung, Lager, Ausbau | Anlagen, Ressourcen | offen |
| 3 | Forschung: Kunststoff-Tiers T1–T3, Freischaltung der Antimaterie | Forschung | offen |
| 4 | Werft: 23 Schiffe, 2 Hüllentypen, 5 Waffentypen | Werft | offen |
| 5 | Verteidigung & Kampf: Schutzschild-Autoaktivierung (Solo-Regel), Trümmer/Salvage | Verteidigung | offen |
| 6 | Flotte & Weltraum-Missionen: **Startplätze (A–J, Stufe 1–15, Kapazität)**, Flotten, Treibstoffregeln, Flüge | Flotte, Weltraum | offen |
| 7 | KI-Gegner (5–10 Angriffe/Ereignisse täglich), Balancing, Feinschliff | alle | offen |
| – | Offene Punkte | – | laufend: `docs/OFFENE-PUNKTE.md` |

---

## Kapitel 1 – Layout-Grundgerüst ✅

- Linkes Menü (8 Punkte, feste Reihenfolge) + mittleres Inhaltsfeld; Handy: ausklappbares Menü (☰)
- Kopf mit Logo und Ressourcenleiste (7 Rohstoffe; Antimaterie versteckt bis `freigeschaltet.antimaterie`)
- Weltraum-Hierarchie 1 Universum / 5 Sektoren / 300 Systeme / 12 Planeten (3.600), navigierbar; Heimatplanet verortet
- Übersicht (Heimatplanet, Koordinaten, Startplatz/Stufe), Ressourcen (Tabelle), Platzhalter für Kapitel 2–6
- Retro-Weltraum-Stil mit eigenen SVG-Grafiken (`assets/`), alles offline
- **Automatischer Spielstart** auf einem Hauptplaneten (zufällige Koordinate), optional Spieler-/Planetenname, keine Auswahl
- Startplätze nur als Datenmodell-/Konstanten-Platzhalter + Info-Abschnitt auf „Flotte“ (Korrektur: keine Startplatz-Wahl/-Boni)
- Unterbau: vorläufige Grundproduktion (ohne Boni), Offline-Fortschritt, Speichern/Laden/Zurücksetzen, Migration bis v3
- Planetengrößen/Feldlimits bewusst nicht vorhanden
- Tests: 20 Node-Tests, Browser-Playtest (Handy 412×915, Desktop 1366×768) → `playtest/kapitel1-layout-*.png`

## Kapitel 2 – Ressourcen & Anlagen

- Gebäude-Konfiguration in `js/data/gebaeude.js` (Kosten, Bauzeit, Wirkung je Stufe), Seite „Anlagen“
- **Geologiestation (FEST):** erkundet/bestimmt Lagerstätten → `zustand.lagerstaetten`, beeinflusst Förderung
- Förderanlagen (Metall, Silizium, Rohöl), Kraftwerk (Strom), Lager – ersetzen die vorläufige Grundproduktion (ANNAHME)
- Bauzeit läuft auch offline weiter

## Kapitel 3 – Forschung

- Forschungsbaum (`js/data/forschung.js`), Seite „Forschung“
- Kunststoff-Kette Rohöl (+ Strom) → T1 → T2 → T3 (ANNAHME)
- **Freischaltung der Antimaterie** (setzt `freigeschaltet.antimaterie = true` → erscheint in der Ressourcenleiste)

## Kapitel 4 – Werft

- **23 Schiffe, 2 Hüllentypen, 5 Waffentypen (FEST)** in `js/data/schiffe.js`, Seite „Werft“, Bauwarteschlange

## Kapitel 5 – Verteidigung & Kampf

- Verteidigungsanlagen, Kampfsimulation (Waffentyp gegen Hüllentyp), Kampfbericht
- **Schutzschild-Autoaktivierung als Solo-Regel (FEST)**
- **Trümmer-Salvage (FEST): 50–75 % am Boden, 80 % im Orbit**

## Kapitel 6 – Flotte & Weltraum-Missionen

- **Startplätze (FEST):** Start-/Abschussplattformen für Flotten, bis zu 10 (A–J, ANNAHME), je Stufe 1–15 mit stark
  steigenden Kosten, punktebasierte Freischaltung; Kapazität = nur Anzahl Schiffe; Summe aller Startplätze = max.
  gleichzeitig startende Schiffe; keine Zuordnung Schiff → Startplatz. Datenmodell `zustand.startplaetze` ist schon da.
- Flotten zusammenstellen, Missionen zu Koordinaten (Sektor:System:Planet) aus der Weltraum-Seite starten
- **Treibstoffregeln (FEST, Inhalt offen)**

## Kapitel 7 – KI-Gegner, Balancing, Feinschliff

- **KI-Gegner mit 5–10 Angriffen/Ereignissen pro Tag (FEST)**, Besiedlung anderer Planeten durch KI (ANNAHME)
- Balancing aller Konstanten, Tutorial, ggf. PWA/Export-Import des Spielstands
