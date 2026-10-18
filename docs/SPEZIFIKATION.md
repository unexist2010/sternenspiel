# Sternenspiel – Spezifikation

Stand: 2026-10-18 · Kapitel 1 (Layout-Grundgerüst)

**Wichtig:** Abschnitt A enthält nur, was Sandro festgelegt hat (**FEST**). Alles in Abschnitt B ist von mir
gesetzt (**ANNAHME**) und kann jederzeit geändert werden – Zahlen stehen zentral in `js/data/konstanten.js`.

---

## A. Verbindlich (FEST, aus Sandros Vorgaben)

### A1. Allgemein (erste Runde)

| # | Punkt | Kapitel |
|---|-------|---------|
| 1 | Rohstoffe: **Metall, Silizium, Rohöl, Strom, Kunststoff in Tier T1, T2, T3, Antimaterie** | 1 (Daten/Leiste) |
| 2 | **Geologiestation** (Gebäude, z. B. zum Erkunden/Bestimmen der Lagerstätten bzw. Rohstoffvorkommen) | 2 |
| 3 | **Startplätze A–Z**, jeder mit **Stufe 1–15** | 1 (Unterbau) |
| 4 | **23 Schiffe**, **5 Waffentypen**, **zwei Hüllentypen** | 4 |
| 5 | **Schutzschild-Autoaktivierung** als Solo-Regel | 5 |
| 6 | **Trümmer-Salvage: 50–75 % am Boden, 80 % im Orbit** | 5 |
| 7 | **Treibstoffregeln** (Inhalt noch nicht festgelegt) | 6 |
| 8 | **KI-Gegner: 5–10 Angriffe/Ereignisse täglich** | 7 |
| 9 | **Kapitelstruktur 1–7** plus Abschnitt „Offene Punkte“ | Doku |

### A2. Kapitel 1 = NUR Layout/Grundgerüst (Präzisierung)

| # | Punkt | Umsetzung |
|---|-------|-----------|
| 10 | Seitenstruktur: **linkes Menü + mittleres Inhaltsfeld** (Retro-Layout); auf dem Handy erreichbar (ausklappbar) | `index.html`, `css/style.css` (☰-Menü unter 860 px) |
| 11 | Menüpunkte **genau in dieser Reihenfolge**: **Übersicht, Ressourcen, Anlagen, Forschung, Werft, Verteidigung, Flotte, Weltraum** | `js/data/menue.js` |
| 12 | Weltraum-Hierarchie: **1 Universum, 5 Sektoren, 300 Sonnensysteme, 12 Planeten pro System**; im Datenmodell und auf der Weltraum-Seite navigierbar | `js/data/weltraum.js`, Seite „Weltraum“ |
| 13 | **Planetengrößen und Feldlimits werden komplett ignoriert** (nicht implementiert, nicht angezeigt) | kein Feld im Datenmodell (Test prüft das) |
| 14 | **Heimatplanet** des Spielers ist in der Hierarchie verortet | `zustand.heimat = {sektor, system, planet, name}` |
| 15 | Ressourcenleiste oben: **Metall, Silizium, Rohöl, Strom, Kunststoff T1, T2, T3**; **Antimaterie versteckt bis zur Freischaltung** | `zustand.freigeschaltet.antimaterie = false` |
| 16 | **Platzhalter-Seiten** für Anlagen, Forschung, Werft, Verteidigung, Flotte mit „kommt in Kapitel X“ | Seiten mit „Kommt in Kapitel 2…6“ |
| 17 | **Übersicht** zeigt Heimatplanet, Koordinaten (Sektor:System:Planet), Startplatz/Stufe; **Ressourcen** zeigt Rohstofftabelle | Seiten „Übersicht“, „Ressourcen“ |
| 18 | Retro-Weltraum-Stil (dunkles Weltall, Blau-/Türkistöne, Menüleiste links, Kopf mit Ressourcen) mit **eigenen Bildern**, keine fremden Assets, alles offline | `assets/` (eigene SVGs), `tools/erzeuge-grafiken.js` |
| 19 | **Keine** Gebäude, Schiffe, Kampf oder Forschung in Kapitel 1 | nur Platzhalter-Daten (`gebaeude.js`, `schiffe.js`) |
| 20 | Startplatz-Wahl A–Z mit Stufe 1–15 **darf bleiben**, Zuordnung zur Hierarchie als ANNAHME | siehe B1 |

---

## B. Annahmen (ANNAHME – nicht von Sandro festgelegt)

### B1. Weltraum & Startplätze

| Annahme | Wert |
|---------|------|
| Verteilung Systeme | **60 Systeme je Sektor** |
| Systemnummern | **global 1–300** (Sektor 1 = 1–60, Sektor 2 = 61–120, … Sektor 5 = 241–300) |
| Koordinaten-Format | `Sektor:System:Planet`, z. B. `3:133:5` |
| Namen | Universum „Sternenreich“; Sektoren Alpha, Beta, Gamma, Delta, Epsilon; System-/Planetennamen aus Silben erzeugt (Planet = Systemname + römische Position) |
| Sterntyp, Planetentyp | **nur Optik** (Lava, Wüste, Gestein, Ozean, Gas, Eis), deterministisch aus der Nummer – keine Spielwirkung, keine Größe |
| Andere Planeten | alle 3.600 Planeten existieren, außer dem Heimatplaneten „unbewohnt“ |
| **Startplatz → Heimatplanet** | `System = 6 + round(Index × 288 / 25)`, `Planet = 4 + (Index mod 5)` → A = 1:6:4, L = 3:133:5, Z = 5:294:4; A–E in Sektor 1, F–J in 2, K–P in 3, Q–U in 4, V–Z in 5 |
| Heimatplanet-Name | frei wählbar, sonst erzeugter Planetenname |
| Stufe je Startplatz | fest: `Stufe = ((Index × 4) mod 15) + 1` (A=1, B=5, … L=15 …) |
| Schwerpunkt-Rohstoff | reihum Metall → Silizium → Rohöl → Strom |
| Boni-Formel | `1 + (Stufe − 1) × 2 %` auf alle Grundrohstoffe, zusätzlich `Stufe × 3 %` auf den Schwerpunkt (Stufe 15: +28 % / +73 %) |

### B2. Wirtschafts-Unterbau (vorläufig, wird in Kapitel 2 durch Anlagen ersetzt/ergänzt)

| Annahme | Wert |
|---------|------|
| Grundproduktion/Std. ohne Gebäude | Metall 120, Silizium 80, Rohöl 60, Strom 100; Kunststoff T1–T3 und Antimaterie 0 |
| Startbestand | Metall 500, Silizium 300, Rohöl 200, Strom 100, Kunststoff T1 50, Rest 0 |
| Grund-Lager | Metall/Silizium/Rohöl 10.000, Strom 5.000, K1 2.000, K2 1.000, K3 500, Antimaterie 100 |
| Strom | lagerbarer Rohstoff (nicht Leistungsbilanz) |
| Offline-Fortschritt | seit letztem Speichern, max. 24 Std., volle Rate |
| Autospeichern | alle 30 s, beim Verstecken/Verlassen des Tabs, bei „Hauptmenü“ |

### B3. Gestaltung & Technik

| Annahme | Begründung |
|---------|------------|
| Menü unter 860 px Breite als ausklappbare Schublade (☰), darüber feste Leiste links | Handy-Bedienung |
| Platzhalter zeigen im Menü eine Marke „Kap. X“ | Orientierung |
| Navigation über Adress-Anker (`#weltraum/system/133`) | funktioniert offline über `file://`, Zurück-Taste des Browsers geht |
| Klassische `<script>`-Dateien mit Namensraum `SS` statt ES-Module | Chrome blockiert ES-Module über `file://` |
| Spielstand-Format v2 (`heimat`, `freigeschaltet`), automatische Migration von v1 | alte Spielstände bleiben ladbar |
| Grafiken als SVG, per Skript erzeugt | klein, scharf auf allen Bildschirmen, reproduzierbar |
