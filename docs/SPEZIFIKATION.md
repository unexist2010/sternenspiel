# Sternenspiel – Spezifikation

Stand: 2026-10-19 · Kapitel 2 = Anlagen (0.6.0) · Kapitel 1 = reine Seitenstruktur (0.5.0)

**Wichtig:** Abschnitt A enthält nur, was Sandro festgelegt hat (**FEST**). Alles in Abschnitt B ist von mir
gesetzt (**ANNAHME**) und kann jederzeit geändert werden – Zahlen stehen zentral in `js/data/konstanten.js`. Abschnitt C beschreibt die Formeln und Werte von Kapitel 2; Zahlen dort sind ANNAHME, außer wo FEST steht.

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

### A6. Kapitel 2 „Anlagen“ (Freigabe 2026-10-19, gilt vor A5 für Ressourcen/Anlagen/Übersicht)

| # | Punkt | Umsetzung |
|---|-------|-----------|
| 49 | **Ressourcen-Seite zurück** (Rohstofftabelle Bestand/Produktion/Verbrauch/Netto je Std.), ergänzt um Produktion je Gebäude, Energiebilanz, Verbrauch | `seiteRessourcen` in `js/ui/app.js` |
| 50 | **Übersicht** wie früher: Hauptplanet, Koordinaten, Sektor, System, Spielstand-Knöpfe – **ohne** Startplatz/Stufe; zusätzlich laufender Bauauftrag + Punkte | `seiteUebersicht` |
| 51 | Forschung, Werft, Verteidigung, Flotte, Weltraum bleiben **leere Platzhalter** | `seitePlatzhalter` |
| 52 | Ressourcenleiste: Metall, Silizium, Rohöl, Strom **+ Kunststoff T1–T3 sichtbar**; Antimaterie bleibt ausgeblendet | `freigeschaltet.kunststoff_t1..t3 = true`, `antimaterie = false` |
| 53 | **Metallmine, Siliziummine** (gleiche Mechanik), **Bohrstation**: am Hauptplaneten unbegrenzt, auf anderen Planeten begrenzt durch Rohölfelder der Geologiestation | `planet.istHauptplanet`, `planet.rohoelfelder`, `produktion.nutzbareBohrStufe` |
| 54 | **Solarfarm** ohne laufende Kosten; **Ölverbrennungsstation** mehr Strom, verbraucht dauerhaft Rohöl | `gebaeude.js` |
| 55 | **Solarsatelliten** nur Anzeige/Verwaltung (Anzahl, Energie je Satellit, Regler) – Bau später in der Werft | `SS.DATEN.solarsatellit`, `planet.solarsatelliten` |
| 56 | **Kunststoffwerk T1–T3** mit eigenen Stufen: T1 aus Rohöl, T2 aus Rohöl + Metall, T3 je Einheit **2000 Rohöl + 2000 Silizium + 750 Metall**; bei Mangel drosseln/stoppen, nie negativ | `werk.input`, `produktion.raten` |
| 57 | **Geologiestation** findet Rohölfelder pro Stunde | `geologie`, `felderProStunde` |
| 58 | **Raumflughafen mit Startplätzen**: bis zu 10 (A–J, A–Z offen), Stufe 1–15, je Stufe deutlich teurer, neue Plätze über Spielerpunkte, Kapazität = Anzahl Schiffe, Gesamtkapazität angezeigt | `#anlagen/raumflughafen`, `bau.startplatzKosten/startplatzFrei/kapazitaet` |
| 59 | **Werft, Verteidigungswerft, Forschungseinrichtung**: nur Gebäude; Forschungseinrichtung zeigt den Forschungszeit-Wert | `forschungszeit: true`, `bau.forschungszeitFaktor` |
| 60 | Stufen bis **mindestens 30**, zentral konfiguriert; Kostenfaktor **1,5–2,0** je Stufe | `GEBAEUDE_MAX_STUFE = 30`, `faktor` je Gebäude |
| 61 | Bauzeit nach **OGame-Formel**, Haken-Faktor = 1 für spätere Robotik-Forschung | `bau.bauzeitMs`, `BAUZEIT.FAKTOR`, `bauzeitFaktorForschung()` |
| 62 | **Keine** Speichergebäude, Allianzdepot, Roboter-/Nanitenfabrik; Lagergrenzen entfernt | `lagerKapazitaet() = Infinity`, Migration |
| 63 | **Strom** als OGame-Bilanz mit Produktionsfaktor; Leiste zeigt verfügbar / Bedarf | `raten().strom` |
| 64 | **Ein Bauplatz je Planet**, Echtzeit + Offline (stückweise berechnet) | `planet.bauauftrag`, `produktion.simuliereBis` |
| 65 | Kleine **Grundproduktion am Hauptplaneten**, Startbestand reicht für erste Minen; Punkte = verbaute Rohstoffe | `GRUNDPRODUKTION_HAUPTPLANET`, `STARTBESTAND`, `PUNKTE` |
| 66 | **Keine** Schiffe, Verteidigung, Forschung, Kampf, Flottenbewegung | – |
| 67 | Anlagen-Oberfläche als **Kacheln in Gruppen** (Ressourcenabbau, Energie, Kunststoffproduktion, Weitere Anlagen) mit eigenem SVG, Stufe, Beschreibung, Kosten nächste Stufe, Bauzeit, Produktion/Verbrauch jetzt + nächste Stufe, Knopf „Ausbauen“ (deaktiviert mit Grund) | `seiteAnlagen`, `anlageKachel`, `assets/gebaeude/*.svg` |
| 68 | Alle Werte zentral in `js/data`, Formeln hier dokumentiert (Abschnitt C) | `konstanten.js`, `gebaeude.js`, `startplaetze.js` |

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

### B1a. Startplätze (Stand 0.5.0 – **ersetzt durch C4**)

| Annahme | Wert |
|---------|------|
| Beschriftung | **A–J** für die 10 Startplätze (Sandro schrieb „bis zu 10, beschriftet A bis Z“ – Widerspruch, siehe OFFENE-PUNKTE) |
| Start | mit **Startplatz A auf Stufe 1** freigeschaltet, B–J gesperrt (Stufe 0) |
| Datenmodell | `zustand.startplaetze = [{ buchstabe: "A", stufe: 1, freigeschaltet: true }, { buchstabe: "B", stufe: 0, freigeschaltet: false }, …]` (immer 10 Einträge), `zustand.punkte = 0` |
| Offene Konstanten | `KAPAZITAET_PRO_STUFE`, `KOSTEN_FORMEL`, `FREISCHALT_PUNKTE` sind `null` bis zum Startplätze-Kapitel |

### B2. Wirtschafts-Unterbau (Stand 0.5.0 – **ersetzt durch Abschnitt C**)

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
| Spielstand-Format **v4** (ab 0.6.0, siehe C6); früher **v3** (`heimat`, `freigeschaltet`, `startplaetze`, `punkte`; kein `startplatz` mehr), automatische Migration von v1/v2: Heimat behalten (falls gültig, sonst zufällig neu), alte Startplatz-Felder verwerfen | alte Spielstände bleiben ladbar |
| Übersicht behält zusätzlich den Knopf **„Zurücksetzen“** (nur aktiver Spieler, aus den Spielerprofil-Vorgaben A4/38); ab 0.6.0 wieder Knopf „Laden“ (letzten Speicherstand laden) | Profil-Funktion bleibt erreichbar |
| Ressourcenleiste zeigt Bestand + Netto-Rate „/h“ (ab 0.6.0); Strom als „Erzeugung / Bedarf“ | Kapitel 2 |
| Spielerprofile: **Name Pflicht**, keine doppelten Namen (Groß-/Kleinschreibung egal), höchstens **20** Spieler je Browser | übersichtliche Liste, eindeutige Anzeige |
| „Zurücksetzen“ behält **Name und Hauptplanet** des Spielers, setzt Rohstoffe/Fortschritt auf Start | Spieler bleibt erkennbar |
| Übernommener Altstand heißt bei Namensgleichheit „Name (alt)“; kaputte Stände werden als `…_defekt…` gesichert statt gelöscht | nichts geht verloren |
| Versionsnummer `SS.VERSION` = `data-version` in `index.html` = `?v=` an allen Dateien (Test prüft das) | Cache-Schutz nach Updates |
| Grafiken als SVG, per Skript erzeugt | klein, scharf auf allen Bildschirmen, reproduzierbar |

---

## C. Kapitel 2 „Anlagen“ – Formeln und Werte

Alle Zahlen stehen zentral in `js/data/konstanten.js` (`SS.BALANCE`) und `js/data/gebaeude.js`. Formeln sind OGame-ähnlich;
**konkrete Zahlen sind ANNAHME**, sofern nicht in A6 genannt.

### C1. Formeln

| Größe | Formel | Code |
|-------|--------|------|
| Kosten Stufe n | `floor(Grundkosten · Faktor^(n−1))` je Rohstoff | `bau.gebaeudeKosten` |
| Ertrag / Strombedarf / Stromerzeugung / Ölverbrauch bei Stufe n | `Basis · n · 1,1^n` (× Regler) | `produktion.wachstum` |
| Bauzeit | `(Metall + Silizium) / 2500` Std. × `BAUZEIT.FAKTOR` (1) × `bauzeitFaktorForschung()` (1, Haken für Robotik), mindestens 5 s | `bau.bauzeitMs` |
| Produktionsfaktor Strom | `f = min(1, Erzeugung / Bedarf)`; Bedarf = Σ Strombedarf der Verbraucher bei Regler-Stufe | `produktion.raten` |
| Gedrosselte Erträge | Minen, Bohrstation, Kunststoffwerke, Geologie × f; Strombedarf bleibt voll (OGame) | 〃 |
| Ölverbrennung | Strom und Ölverbrauch × Anteil verfügbaren Rohöls (Fixpunkt-Iteration mit der Energiebilanz) | 〃 |
| Kunststoffwerk | Ausstoß = `Basis · n · 1,1^n · f · Regler`; Input = Ausstoß × Input je Einheit; reicht der Bestand nicht, teilen sich alle Werke den Rohstoff anteilig, Bestand nie negativ | 〃 |
| Bohrstation Nicht-Hauptplanet | nutzbare Stufe = `min(Stufe, floor(rohoelfelder))` | `nutzbareBohrStufe` |
| Simulation | Schritte zu 60 s (`SIM_SCHRITT_MS`); Bauaufträge werden genau zum Endzeitpunkt fertig, danach gilt die neue Stufe | `produktion.simuliereBis` |
| Offline | Produktion max. 24 Std. angerechnet; Bauaufträge werden **immer** fertiggestellt | `offlineFortschritt` |
| Punkte | `Σ (Kosten je Rohstoff · Gewicht) / 1000`, bei Fertigstellung gutgeschrieben | `bau.punkteFuer` |
| Forschungszeit-Faktor | `1 / (1 + Stufe Forschungseinrichtung)` (Anzeige, Forschung folgt) | `bau.forschungszeitFaktor` |

### C2. Gebäude (Stufe 1, Faktor je Stufe, Wirkung)

| Gebäude | Kosten Stufe 1 (M/Si/Öl/K) | Faktor | Wirkung (Basis für `·n·1,1^n`) | Strombedarf |
|---------|------------------|--------|------------------|------|
| Metallmine | 60 / 15 | 1,5 | +30 Metall/h | 10 |
| Siliziummine | 48 / 24 | 1,5 | +20 Silizium/h | 10 |
| Bohrstation | 225 / 75 | 1,5 | +15 Rohöl/h | 20 |
| Solarfarm | 75 / 30 | 1,5 | +20 Strom | – |
| Ölverbrennungsstation | 900 / 360 / 180 | 1,8 | +40 Strom, −10 Rohöl/h | – |
| Kunststoffwerk T1 | 300 / 200 / 100 | 2,0 | +2 K1/h; je K1: 10 Rohöl | 10 |
| Kunststoffwerk T2 | 1.200 / 800 / 400 + 50 K1 | 2,0 | +0,5 K2/h; je K2: 40 Rohöl + 20 Metall | 15 |
| Kunststoffwerk T3 | 5.000 / 4.000 / 2.000 + 25 K2 | 2,0 | +0,02 K3/h; je K3: **2000 Rohöl + 2000 Silizium + 750 Metall** (FEST) | 20 |
| Geologiestation | 400 / 300 / 100 | 1,75 | +0,1 Rohölfelder/h | 10 |
| Raumflughafen | 1.000 / 600 / 300 | – | Höchststufe 1, schaltet Startplätze frei | – |
| Werft | 400 / 200 / 100 | 2,0 | – (Funktion später) | – |
| Verteidigungswerft | 300 / 300 / 100 | 2,0 | – (Funktion später) | – |
| Forschungseinrichtung | 200 / 400 / 200 | 2,0 | Forschungszeit × 1/(1+n) | – |
| Solarsatellit (Anzeige) | Bau später in der Werft | – | +30 Strom je Satellit | – |

Höchststufe aller Gebäude: 30 (`GEBAEUDE_MAX_STUFE`), außer Raumflughafen (1). Beispiele Bauzeit Stufe 1: Metallmine 1 Min. 48 s, Solarfarm 2 Min. 31 s, Bohrstation 7 Min. 12 s.

### C3. Start und Wirtschaft

| Wert | ANNAHME |
|------|---------|
| Grundproduktion Hauptplanet | Metall 30, Silizium 15 pro Std. (ohne Strom) |
| Startbestand | Metall 500, Silizium 300, Rohöl 100, sonst 0 |
| Lager | unbegrenzt (keine Speichergebäude) |
| Strom | nicht lagerbar, reine Bilanz (alte gespeicherte Strommenge wird bei der Migration 0) |
| Punkte-Gewichte | Metall/Silizium/Rohöl 1, Kunststoff T1 2, T2 4, T3 8, Antimaterie 10 – 1 Punkt je 1.000 gewichtete Rohstoffe |
| Bauplatz | 1 Auftrag je Planet; Abbrechen erstattet **100 %** |
| Regler | 0–100 % in 10er-Schritten für alle Erzeuger und Solarsatelliten (Seite Ressourcen) |
| Geologiestation am Hauptplaneten | sammelt Rohölfelder nur als Anzeige (Rohöl dort unbegrenzt) |

### C4. Raumflughafen und Startplätze

| Wert | ANNAHME |
|------|---------|
| Container | Raumflughafen (1 Stufe) muss stehen, dann Startplätze A–J als eigene Ausbauten (Unterseite `#anlagen/raumflughafen`) |
| Stufen | 1–15 je Startplatz (FEST), Start mit **keinem** Startplatz |
| Kosten Startplatz | `Grund (2000 M / 1000 Si / 500 Öl) · 2^(Stufe−1) · (1 + 0,25 · Platzindex)` (A = Index 0) |
| Freischaltung | Punkte-Schwellen A–J: 0, 50, 150, 400, 1.000, 2.500, 5.000, 10.000, 20.000, 40.000 |
| Kapazität | 5 Schiffe je Stufe; Gesamtkapazität = Summe aller Startplätze |

### C5. Bauauftrag

`planet.bauauftrag = { art: "gebaeude" | "startplatz", id, buchstabe, name, stufe, kosten, start, ende }` – Kosten werden beim
Start abgezogen, Punkte bei Fertigstellung gutgeschrieben. Gründe für deaktivierte Knöpfe: „Höchststufe X erreicht.“,
„Zuerst den Raumflughafen errichten.“, „Gesperrt bis X Punkte.“, „Es läuft bereits ein Bauauftrag.“, „Es fehlen: …“.

### C6. Spielstand v4 und Migration

- `zustand.planeten = [{ id: "hp", istHauptplanet: true, rohoelfelder: 0, gebaeude: {…: 0}, regler: {…: 100}, solarsatelliten: 0, bauauftrag: null, startplaetze: [{ buchstabe, stufe }] × 10 }]`
- Migration v1/v2/v3 → v4: Rohstoffe und Heimat bleiben, neuer Hauptplanet ohne Gebäude, Strom = 0, Kunststoff-Flags an;
  alte Felder `startplaetze`, `gebaeude`, `lagerstaetten` (v3, oben im Spielstand) werden verworfen; Lagergrenzen entfallen.
- Profile: jeder Spieler wird beim Laden einzeln migriert.
