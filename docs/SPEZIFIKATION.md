# Sternenspiel – Spezifikation

Stand: 2026-10-19 · Kapitel 1 = reine Seitenstruktur (0.5.0)

**Wichtig:** Abschnitt A enthält nur, was Sandro festgelegt hat (**FEST**). Alles in Abschnitt B ist von mir
gesetzt (**ANNAHME**) und kann jederzeit geändert werden – Zahlen stehen zentral in `js/data/konstanten.js`.

---

## A. Verbindlich (FEST, aus Sandros Vorgaben)

### A1. Allgemein (erste Runde)

| # | Punkt | Kapitel |
|---|-------|---------|
| 1 | Rohstoffe: **Metall, Silizium, Rohöl, Strom, Kunststoff in Tier T1, T2, T3, Antimaterie** | 1 (Datenmodell; Leiste zeigt nur Metall, Silizium, Rohöl, Strom) |
| 2 | **Geologiestation** (Gebäude, z. B. zum Erkunden/Bestimmen der Lagerstätten bzw. Rohstoffvorkommen) | später (eigenes Kapitel) |
| 3 | **Startplätze** mit **Stufe 1–15** (Bedeutung präzisiert, siehe A3) | später (eigenes Kapitel) |
| 4 | **23 Schiffe**, **5 Waffentypen**, **zwei Hüllentypen** | später (eigenes Kapitel) |
| 5 | **Schutzschild-Autoaktivierung** als Solo-Regel | später (eigenes Kapitel) |
| 6 | **Trümmer-Salvage: 50–75 % am Boden, 80 % im Orbit** | später (eigenes Kapitel) |
| 7 | **Treibstoffregeln** (Inhalt noch nicht festgelegt) | später (eigenes Kapitel) |
| 8 | **KI-Gegner: 5–10 Angriffe/Ereignisse täglich** | später (eigenes Kapitel) |
| 9 | ~~Kapitelstruktur 1–7~~ → ersetzt: jeder Menüpunkt / jede Mechanik bekommt ein eigenes Kapitel (A5) | Doku |

### A2. Kapitel 1 = NUR Layout/Grundgerüst (Präzisierung – Punkte 12, 15–17 durch A5 ersetzt)

| # | Punkt | Umsetzung |
|---|-------|-----------|
| 10 | Seitenstruktur: **linkes Menü + mittleres Inhaltsfeld** (Retro-Layout); auf dem Handy erreichbar (ausklappbar) | `index.html`, `css/style.css` (☰-Menü unter 860 px) |
| 11 | Menüpunkte **genau in dieser Reihenfolge**: **Übersicht, Ressourcen, Anlagen, Forschung, Werft, Verteidigung, Flotte, Weltraum** | `js/data/menue.js` |
| 12 | ~~Weltraum-Hierarchie: **1 Universum, 5 Sektoren, 300 Sonnensysteme, 12 Planeten pro System**; im Datenmodell und auf der Weltraum-Seite navigierbar~~ → ersetzt durch A5 | `js/data/weltraum.js`, Seite „Weltraum“ |
| 13 | **Planetengrößen und Feldlimits werden komplett ignoriert** (nicht implementiert, nicht angezeigt) | kein Feld im Datenmodell (Test prüft das) |
| 14 | **Hauptplanet** des Spielers ist in der Hierarchie verortet | `zustand.heimat = {sektor, system, planet, name}` |
| 15 | ~~Ressourcenleiste oben: **Metall, Silizium, Rohöl, Strom, Kunststoff T1, T2, T3**; **Antimaterie versteckt bis zur Freischaltung**~~ → ersetzt durch A5 | `zustand.freigeschaltet.antimaterie = false` |
| 16 | ~~**Platzhalter-Seiten** für Anlagen, Forschung, Werft, Verteidigung, Flotte mit „kommt in Kapitel X“~~ → ersetzt durch A5 | Seiten mit „Kommt in Kapitel 2…6“ |
| 17 | ~~**Übersicht** zeigt Hauptplanet + Koordinaten (Sektor:System:Planet) – **keine** Startplatz/Stufe-Anzeige; **Ressourcen** zeigt Rohstofftabelle~~ → ersetzt durch A5 | Seiten „Übersicht“, „Ressourcen“ |
| 18 | Retro-Weltraum-Stil (dunkles Weltall, Blau-/Türkistöne, Menüleiste links, Kopf mit Ressourcen) mit **eigenen Bildern**, keine fremden Assets, alles offline | `assets/` (eigene SVGs), `tools/erzeuge-grafiken.js` |
| 19 | **Keine** Gebäude, Schiffe, Kampf oder Forschung in Kapitel 1 | nur Platzhalter-Daten (`gebaeude.js`, `schiffe.js`) |

### A3. Spielstart und Startplätze (Korrektur, ersetzt die frühere Startplatz-Wahl A–Z; Punkt 31 durch A5 ersetzt)

| # | Punkt | Umsetzung |
|---|-------|-----------|
| 20 | Spielstart wie im klassischen Browser-Weltraumspiel: **automatisch auf EINEM Hauptplaneten, ohne jede Auswahl** | Startbildschirm → „Neues Spiel starten“ → direkt im Spiel |
| 21 | Spielername / Planetenname **optional** eingebbar, **keine Planetenauswahl** | Startbildschirm |
| 22 | **Keine Startplatz-Boni**; Produktion läuft mit der **Grundrate** (Boni-Formel komplett entfernt) | `js/kern/produktion.js` |
| 23 | **Startplätze = Start-/Abschussplattformen (Launch Pads) für Flotten** auf dem Planeten | späteres Kapitel (Startplätze) |
| 24 | **bis zu 10 Startplätze**, mit Buchstaben beschriftet | `BALANCE.STARTPLAETZE.MAX_ANZAHL = 10` |
| 25 | jeder Startplatz hat **eigene Ausbaustufen 1–15**, **Kosten steigen stark** | Konstanten-Platzhalter, Logik später |
| 26 | neue Startplätze werden **punktebasiert freigeschaltet** (Schwellen offen) | `zustand.punkte`, `FREISCHALT_PUNKTE: null` |
| 27 | **Kapazität zählt NUR die Anzahl Schiffe** (Größe egal) | später |
| 28 | die **Summe aller Startplätze** begrenzt, wie viele Schiffe **gleichzeitig starten** können | später |
| 29 | man muss sie **immer wieder ausbauen**, je größer die Flotte wird | später |
| 30 | **keine Zuordnung Schiff → Startbahn**, nur Kapazität | später |
| 31 | ~~Jetzt nur: Datenmodell-Platzhalter, Konstanten-Platzhalter, Info-Abschnitt „Startplätze (kommt in Kapitel 6)“ auf der Seite „Flotte“; **keine** Ausbau-/Kosten-/Flottenlogik~~ → ersetzt durch A5 | `zustand.startplaetze`, `js/data/startplaetze.js`, Seite „Flotte“ |

### A4. Start-Fix und Spielerprofile (Runde 4)

| # | Punkt | Umsetzung |
|---|-------|-----------|
| 32 | Der Start darf **nie** an Browser-Zwischenspeicher oder kaputtem Spielstand scheitern; Fehler werden **in der Oberfläche** angezeigt | `?v=`-Cache-Schutz, Versionsprüfung `data-version` ↔ `SS.VERSION` (einmal automatisch neu laden), Fehlerfang, Notfall-Meldung |
| 33 | **Startbildschirm = Spielerauswahl**: Liste aller Spieler (Name, Planet, Koordinaten, zuletzt gespielt) mit „Spielen“ | `#profil-liste` |
| 34 | Darunter **„Neuen Spieler erschaffen“** (Name, optional Planetenname) → automatischer Start auf zufälligem Hauptplaneten | `#form-neu`, `SS.kern.profile.erstelle` |
| 35 | **Jeder Spieler hat eigenen Spielstand** in `localStorage` mit **eigenem Offline-Fortschritt** | `sternenspiel_spielstand_p_<id>`, Index `sternenspiel_profile_v1` |
| 36 | Im Spiel **„Spieler wechseln“** (vorher speichern) | Menü unten + Übersicht |
| 37 | **Spieler löschen nur mit Bestätigung** | Dialog |
| 38 | **„Zurücksetzen“ betrifft nur den aktiven Spieler** | `SS.kern.profile.zuruecksetzen` |
| 39 | Alter **Einzel-Spielstand (v1/v2/v3)** wird automatisch zum **ersten Profil** | `migriereEinzelstand` (Original als `…_uebernommen` gesichert) |
| 40 | Weiterhin **keine** Gebäude, Schiffe, Kampf, Forschung | – |

### A5. Kapitel 1 = NUR Seitenstruktur + Layout (Klarstellung 2026-10-19, gilt vor A2/A3)

| # | Punkt | Umsetzung |
|---|-------|-----------|
| 41 | Alle 8 Menüseiten bleiben **eigene Seiten im gleichen Layout, aber ohne Inhalt**: nur Seitentitel + kurzer neutraler Platzhalter | `seitePlatzhalter`, Text „Wird in einem eigenen Kapitel ausgearbeitet.“ (`SS.DATEN.PLATZHALTER_TEXT`) |
| 42 | Entfernt: Rohstofftabelle (Ressourcen), Weltraum-Navigation/Systemansicht (Weltraum), Startplätze-Abschnitt (Flotte), Kapitelnummern-Hinweise (Menü + Seiten) | `js/ui/app.js`, `js/data/menue.js` |
| 43 | **Übersicht** maximal Hauptplanetname + Koordinaten und die nötigen Knöpfe (Speichern / Spieler wechseln) | Seite „Übersicht“ (+ „Zurücksetzen“, siehe B3) |
| 44 | **Ressourcenleiste nur als Platzhalter**: Metall, Silizium, Rohöl, Strom sichtbar; **Kunststoff T1–T3 und Antimaterie ausgeblendet per Flag** im Datenmodell (nicht gelöscht) | `zustand.freigeschaltet.{kunststoff_t1,kunststoff_t2,kunststoff_t3,antimaterie} = false`, `rohstoffe.js` `freischaltung` |
| 45 | **Keine Startplätze im Kapitel**: nichts davon sichtbar; Regeln dürfen als Doku in Datenmodell/Konstanten stehen | `js/data/startplaetze.js`, `BALANCE.STARTPLAETZE`, `zustand.startplaetze` (unsichtbar) |
| 46 | **Weltraum-Hierarchie 1/5/300/12 bleibt im Datenmodell** (Koordinaten des Hauptplaneten), nur nicht als Seite | `js/data/weltraum.js`, `zustand.heimat` |
| 47 | Spielerprofile, automatischer Start, Speichern, Start-Fix, Versionsmarke bleiben; **Version 0.5.0** | `SS.VERSION`, `data-version`, `?v=0.5.0` |
| 48 | **Jeder Menüpunkt bzw. einzelne Mechaniken bekommen später eigene Kapitel**; Weltraum-Ansicht und Startplätze später | `docs/KAPITELPLAN.md` |

---

## B. Annahmen (ANNAHME – nicht von Sandro festgelegt)

### B1. Weltraum & Hauptplanet

| Annahme | Wert |
|---------|------|
| Verteilung Systeme | **60 Systeme je Sektor** |
| Systemnummern | **global 1–300** (Sektor 1 = 1–60, Sektor 2 = 61–120, … Sektor 5 = 241–300) |
| Koordinaten-Format | `Sektor:System:Planet`, z. B. `3:133:5` |
| Namen | Universum „Sternenreich“; Sektoren Alpha, Beta, Gamma, Delta, Epsilon; System-/Planetennamen aus Silben erzeugt (Planet = Systemname + römische Position) |
| Sterntyp, Planetentyp | **nur Optik** (Lava, Wüste, Gestein, Ozean, Gas, Eis), deterministisch aus der Nummer – keine Spielwirkung, keine Größe |
| Andere Planeten | alle 3.600 Planeten existieren, außer dem Hauptplaneten „unbewohnt“ |
| **Start-Koordinate** | **zufällig** und gleichverteilt über alle 300 Systeme und 12 Positionen (im Solo-Spiel ist jede Koordinate frei; „besetzt“-Prüfung für KI ab Kapitel 7 vorbereitet) |
| Name des Hauptplaneten | frei wählbar, sonst erzeugter Planetenname |

### B1a. Startplätze (nur Doku/Datenmodell, nicht sichtbar – eigenes späteres Kapitel)

| Annahme | Wert |
|---------|------|
| Beschriftung | **A–J** für die 10 Startplätze (Sandro schrieb „bis zu 10, beschriftet A bis Z“ – Widerspruch, siehe OFFENE-PUNKTE) |
| Start | mit **Startplatz A auf Stufe 1** freigeschaltet, B–J gesperrt (Stufe 0) |
| Datenmodell | `zustand.startplaetze = [{ buchstabe: "A", stufe: 1, freigeschaltet: true }, { buchstabe: "B", stufe: 0, freigeschaltet: false }, …]` (immer 10 Einträge), `zustand.punkte = 0` |
| Offene Konstanten | `KAPAZITAET_PRO_STUFE`, `KOSTEN_FORMEL`, `FREISCHALT_PUNKTE` sind `null` bis zum Startplätze-Kapitel |

### B2. Wirtschafts-Unterbau (vorläufig, wird im Anlagen-Kapitel ersetzt/ergänzt)

| Annahme | Wert |
|---------|------|
| Grundproduktion/Std. ohne Gebäude (für alle gleich, keine Boni) | Metall 120, Silizium 80, Rohöl 60, Strom 100; Kunststoff T1–T3 und Antimaterie 0 |
| Startbestand | Metall 500, Silizium 300, Rohöl 200, Strom 100, Kunststoff T1 50, Rest 0 |
| Grund-Lager | Metall/Silizium/Rohöl 10.000, Strom 5.000, K1 2.000, K2 1.000, K3 500, Antimaterie 100 |
| Strom | lagerbarer Rohstoff (nicht Leistungsbilanz) |
| Offline-Fortschritt | seit letztem Speichern, max. 24 Std., volle Rate |
| Autospeichern | alle 30 s, beim Verstecken/Verlassen des Tabs, bei „Spieler wechseln“ |

### B3. Gestaltung & Technik

| Annahme | Begründung |
|---------|------------|
| Menü unter 860 px Breite als ausklappbare Schublade (☰), darüber feste Leiste links | Handy-Bedienung |
| Platzhalter zeigen im Menü eine Marke „Kap. X“ | Orientierung |
| Navigation über Adress-Anker (`#weltraum/system/133`) | funktioniert offline über `file://`, Zurück-Taste des Browsers geht |
| Klassische `<script>`-Dateien mit Namensraum `SS` statt ES-Module | Chrome blockiert ES-Module über `file://` |
| Spielstand-Format **v3** (`heimat`, `freigeschaltet`, `startplaetze`, `punkte`; kein `startplatz` mehr), automatische Migration von v1/v2: Heimat behalten (falls gültig, sonst zufällig neu), alte Startplatz-Felder verwerfen | alte Spielstände bleiben ladbar |
| Übersicht behält zusätzlich den Knopf **„Zurücksetzen“** (nur aktiver Spieler, aus den Spielerprofil-Vorgaben A4/38); „Laden“ entfällt (Laden = „Spielen“ in der Spielerauswahl) | Profil-Funktion bleibt erreichbar |
| Ressourcenleiste zeigt nur den Bestand (keine Rate „/h“); die vorläufige Grundproduktion läuft im Hintergrund weiter | Platzhalter, Unterbau für Offline-Fortschritt |
| Spielerprofile: **Name Pflicht**, keine doppelten Namen (Groß-/Kleinschreibung egal), höchstens **20** Spieler je Browser | übersichtliche Liste, eindeutige Anzeige |
| „Zurücksetzen“ behält **Name und Hauptplanet** des Spielers, setzt Rohstoffe/Fortschritt auf Start | Spieler bleibt erkennbar |
| Übernommener Altstand heißt bei Namensgleichheit „Name (alt)“; kaputte Stände werden als `…_defekt…` gesichert statt gelöscht | nichts geht verloren |
| Versionsnummer `SS.VERSION` = `data-version` in `index.html` = `?v=` an allen Dateien (Test prüft das) | Cache-Schutz nach Updates |
| Grafiken als SVG, per Skript erzeugt | klein, scharf auf allen Bildschirmen, reproduzierbar |
