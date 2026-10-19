# Sternenspiel – Spezifikation

Stand: 2026-10-19 · Kapitel 3 = Forschung (0.8.0) · Kapitel 2 = Anlagen (0.6.0, Nachbesserung 0.7.0, Antworten 0.8.0) · Kapitel 1 = reine Seitenstruktur (0.5.0)

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
| 53 | ~~(ersetzt durch A7/73–74)~~ **Metallmine, Siliziummine** (gleiche Mechanik), **Bohrstation**: am Hauptplaneten unbegrenzt, auf anderen Planeten begrenzt durch Rohölfelder der Geologiestation | `planet.istHauptplanet`, `planet.rohoelfelder`, `produktion.nutzbareBohrStufe` |
| 54 | **Solarfarm** ohne laufende Kosten; **Ölverbrennungsstation** mehr Strom, verbraucht dauerhaft Rohöl | `gebaeude.js` |
| 55 | **Solarsatelliten** nur Anzeige/Verwaltung (Anzahl, Energie je Satellit, Regler) – Bau später in der Werft | `SS.DATEN.solarsatellit`, `planet.solarsatelliten` |
| 56 | ~~(Rezepte ersetzt durch A7/77)~~ **Kunststoffwerk T1–T3** mit eigenen Stufen: T1 aus Rohöl, T2 aus Rohöl + Metall, T3 je Einheit **2000 Rohöl + 2000 Silizium + 750 Metall**; bei Mangel drosseln/stoppen, nie negativ | `werk.input`, `produktion.raten` |
| 57 | ~~(ersetzt durch A7/75–76)~~ **Geologiestation** findet Rohölfelder pro Stunde | `geologie`, `felderProStunde` |
| 58 | ~~(ersetzt durch A7/79)~~ **Raumflughafen mit Startplätzen**: bis zu 10 (A–J, A–Z offen), Stufe 1–15, je Stufe deutlich teurer, neue Plätze über Spielerpunkte, Kapazität = Anzahl Schiffe, Gesamtkapazität angezeigt | `#anlagen/raumflughafen`, `bau.startplatzKosten/startplatzFrei/kapazitaet` |
| 59 | **Werft, Verteidigungswerft, Forschungseinrichtung**: nur Gebäude; Forschungseinrichtung zeigt den Forschungszeit-Wert | `forschungszeit: true`, `bau.forschungszeitFaktor` |
| 60 | ~~(ersetzt durch A8/86: keine Obergrenze)~~ Stufen bis **mindestens 30**, zentral konfiguriert; Kostenfaktor **1,5–2,0** je Stufe | `GEBAEUDE_MAX_STUFE = 30`, `faktor` je Gebäude |
| 61 | Bauzeit nach **OGame-Formel**, Haken-Faktor = 1 für spätere Robotik-Forschung | `bau.bauzeitMs`, `BAUZEIT.FAKTOR`, `bauzeitFaktorForschung()` |
| 62 | **Keine** Speichergebäude, Allianzdepot, Roboter-/Nanitenfabrik; Lagergrenzen entfernt | `lagerKapazitaet() = Infinity`, Migration |
| 63 | **Strom** als OGame-Bilanz mit Produktionsfaktor; Leiste zeigt verfügbar / Bedarf | `raten().strom` |
| 64 | **Ein Bauplatz je Planet**, Echtzeit + Offline (stückweise berechnet) | `planet.bauauftrag`, `produktion.simuliereBis` |
| 65 | Kleine **Grundproduktion am Hauptplaneten**, Startbestand reicht für erste Minen; Punkte = verbaute Rohstoffe | `GRUNDPRODUKTION_HAUPTPLANET`, `STARTBESTAND`, `PUNKTE` |
| 66 | **Keine** Schiffe, Verteidigung, Forschung, Kampf, Flottenbewegung | – |
| 67 | Anlagen-Oberfläche als **Kacheln in Gruppen** (Ressourcenabbau, Energie, Kunststoffproduktion, Weitere Anlagen) mit eigenem SVG, Stufe, Beschreibung, Kosten nächste Stufe, Bauzeit, Produktion/Verbrauch jetzt + nächste Stufe, Knopf „Ausbauen“ (deaktiviert mit Grund) | `seiteAnlagen`, `anlageKachel`, `assets/gebaeude/*.svg` |
| 68 | Alle Werte zentral in `js/data`, Formeln hier dokumentiert (Abschnitt C) | `konstanten.js`, `gebaeude.js`, `startplaetze.js` |

### A7. Kapitel-2-Nachbesserung (Sandro, 2026-10-19, Version 0.7.0 – gilt vor A6)

| # | Punkt | Umsetzung |
|---|-------|-----------|
| 69 | **MASTER-Knopf (Testmodus)** gut erreichbar im Kopfbereich, an/aus, **je Profil gespeichert** | `#knopf-master`, `einstellungen.master`, `bau.masterSetzen` |
| 70 | Master an: **keine Bauzeiten** (sofort, auch laufende Aufträge werden sofort fertig), **keine Kosten** (nichts abgezogen, Knöpfe nie wegen Rohstoffmangel gesperrt), **Punkte-/Freischalt-Sperren ignoriert** (Startplätze, Kunststoffwerk T2/T3) | `bau.pruefe/starte`, `produktion.simuliereBis` |
| 71 | Sichtbarer Hinweis **„MASTER aktiv“** | `#master-hinweis`, `body.master-an` |
| 72 | **Info-Fenster ⓘ** neben jedem Gebäudenamen (Desktop Hover, Handy Antippen + Schließen ×), OGame-artig: ausführliche Beschreibung + Tabelle aktuelle Stufe und nächste 5 Stufen mit Ertrag/Wirkung, Differenz (+X/h), Strombedarf/-erzeugung, Kosten, Bauzeit; Geologie mit Fundgrößen, Startplätze mit Kapazität; bleibt im Bildschirm | `infoGebaeude`, `infoStartplatz`, `positioniereInfo` |
| 73 | **Rohölvorkommen je Planet**: Hauptplanet startet mit **1.000.000** | `planet.rohoelVorkommen`, `GEOLOGIE.START_VORKOMMEN_HAUPTPLANET` |
| 74 | **Bohrstation** fördert aus dem Vorkommen, das schrumpft: Förderung = `min(Rate, Vorkommen)`, auch offline korrekt; leer → Stillstand | `produktion.bohrGrenze` |
| 75 | **Geologiestation** findet **alle 24 Std.** (Echtzeit, offline nachgeholt, je volle 24 Std. seit Bau bzw. letztem Fund) ein neues Feld; Größe zufällig im Bereich der Stufe: **Stufe 1 = 50.000–100.000, Stufe 2 = 80.000–125.000**, höher sinnvoll steigend; Fund kommt zum Vorkommen; ohne Station keine Funde; theoretisch unbegrenzt | `SS.kern.geologie`, `GEOLOGIE.FUND_BEREICH_FEST` |
| 76 | **Fund-Log** (Datum/Uhrzeit, Stufe, Menge) beim Klick auf die Geologiestation + Countdown; Übersicht zeigt Vorkommen, Förderung/h, Zeit bis nächster Fund; Master: Knopf **„Fund sofort auslösen“**; andere Planeten (später) Vorkommen 0, Geologiestation nötig – im Modell vorbereitet | `fundLog`, `#rohoel-box`, `geologie.fundAusloesen`, `START_VORKOMMEN_ANDERE = 0` |
| 77 | **Kunststoff:** T2 = **40 Rohöl + 20 Metall** je Einheit; T3 = **1000 Rohöl + 500 Silizium + 500 Metall** (ersetzt 2000/2000/750); T1 unverändert | `gebaeude.js` `input` |
| 78 | ~~(Bedingung ersetzt durch A8/84)~~ **Kunststoffwerk T2/T3 gesperrt**: „Wird später mit Spielfortschritt freigeschaltet.“ (Bedingung offen, Flag vorbereitet); Master ignoriert die Sperre; Ressourcenleiste zeigt T2/T3 weiter | `sperre`, `freigeschaltet.kunststoffwerk_t2/t3` |
| 79 | **Startplätze A–Z** (26), je **10 Stufen**; nächster Buchstabe erst baubar, wenn der vorige **Stufe 10** hat **und** die Mindestpunkte erreicht sind; Kapazität = gleichzeitig startende Schiffe; Ziel **A10 ≈ 100 Schiffe**, **alles bis Z10 ≈ 10 Milliarden**; Kosten anfangs gering, steigend; Tabelle in C4 | `STARTPLAETZE`, `bau.startplatzStatus/kapazitaet` |
| 80 | **Hangar-Regel** (nur dokumentiert/vorbereitet, Umsetzung im Flotten-Kapitel): Schiffe, die nicht auf die Startplätze passen, stehen automatisch im Hangar und sind vor Angriffen geschützt (keine Wahl); beim Flottenversand sind alle Schiffe sichtbar, nur die Zahl gleichzeitig fliegender Schiffe ist durch die Kapazität begrenzt; Kapazität wird erst frei, wenn Schiffe zurück, zerstört oder umstationiert sind | `planet.hangar`, `STARTPLAETZE.HANGAR_AKTIV = false` |
| 81 | Raumflughafen-Unterseite neu: 26 Plätze kompakt, handytauglich, gesperrte mit Grund („A Stufe 10 nötig“ / „X Punkte nötig“), Gesamtkapazität | `seiteRaumflughafen` |
| 82 | **Punkte OGame-artig** (1 je 1.000 ausgegebene Rohstoffe), in der Übersicht prominent | `bau.punkteFuer`, `#uebersicht-punkte` |
| 83 | Strom-Bilanz (OGame) bleibt so – von Sandro bestätigt | – |

**ANNAHMEN zu A7:** Für Master-Bauten werden Punkte trotzdem gutgeschrieben (wie bei normalem Bau); der Raumflughafen bleibt auch im Master-Modus Voraussetzung für Startplätze; Master-Aufträge erstatten beim Abbrechen nichts (sie laufen ohnehin nicht); der Test-Fund im Master-Modus verschiebt den 24-Std.-Takt nicht und ist im Log als „Test“ markiert.

### A8. Sandros Antworten zu Kapitel 2 (2026-10-19, Version 0.8.0 – gilt vor A6/A7)

| # | Punkt | Umsetzung |
|---|-------|-----------|
| 84 | **Kunststoffwerk T2/T3 werden durch Spielerpunkte freigeschaltet**; Anzeige „Ab X Punkten“ | Schwellen ANNAHME: **T2 ab 500**, **T3 ab 5.000 Punkten** (`KUNSTSTOFFWERK_FREISCHALT_PUNKTE`); Flag `freigeschaltet.kunststoffwerk_t2/t3` wird beim Erreichen dauerhaft gesetzt |
| 85 | Geologie-Formel (×1,25 ab Stufe 3) **bleibt** | `geologie.fundBereich` |
| 86 | **Keine Stufenobergrenze** für Gebäude (Stufe 33+ möglich), außer ausdrücklich begrenzt: Startplätze 10 Stufen, Raumflughafen 1 | `GEBAEUDE_MAX_STUFE = null`, `maxStufe() = Infinity`; Zahlen mit Mrd./Bio./Brd./Trio., Zeiten mit Tagen/Jahren |
| 87 | **Startplatz-Bauzeiten ÷ ~10**, Z Stufe 10 höchstens ~1 Jahr; andere Gebäude unverändert | `STARTPLAETZE.BAUZEIT_TEILER = 11` (Z10 ≈ 342 Tage), `bau.startplatzBauzeitMs` |
| 88 | **Regel Flottenversand (Flotten-Kapitel, noch nicht gebaut):** Reicht die freie Startplatz-Kapazität nicht, erscheint die Info **„zu wenige Startplätze“** | nur Doku |

**Begründung der T2/T3-Schwellen (ANNAHME):** 1 Punkt = 1.000 verbaute Rohstoffe. 500 Punkte ≈ 500.000 verbaute Rohstoffe – Minen etwa Stufe 12–14,
zeitlich zwischen Startplatz D (400) und E (600); das T2-Werk kostet dann nur noch ≈ 0,5 % davon. 5.000 Punkte ≈ 5 Mio. – zwischen Startplatz I (4.000)
und J (6.000); erst dann trägt die Rohölwirtschaft die 1.000 Rohöl je T3-Einheit.

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

### B1a. Startplätze (Stand 0.5.0 – **ersetzt durch A7 und C4**)

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
| Spielstand-Format **v5** (ab 0.7.0, siehe C6; v4 ab 0.6.0); früher **v3** (`heimat`, `freigeschaltet`, `startplaetze`, `punkte`; kein `startplatz` mehr), automatische Migration von v1/v2: Heimat behalten (falls gültig, sonst zufällig neu), alte Startplatz-Felder verwerfen | alte Spielstände bleiben ladbar |
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
| Gedrosselte Erträge | Minen, Bohrstation, Kunststoffwerke × f (Geologie-Funde hängen nicht am Strom, ANNAHME); Strombedarf bleibt voll (OGame) | 〃 |
| Ölverbrennung | Strom und Ölverbrauch × Anteil verfügbaren Rohöls (Fixpunkt-Iteration mit der Energiebilanz) | 〃 |
| Kunststoffwerk | Ausstoß = `Basis · n · 1,1^n · f · Regler`; Input = Ausstoß × Input je Einheit; reicht der Bestand nicht, teilen sich alle Werke den Rohstoff anteilig, Bestand nie negativ | 〃 |
| Bohrstation (FEST A7) | Förderung = `min(Basis · n · 1,1^n · f · Regler, Vorkommen / Δt)` – das Vorkommen sinkt um die Förderung, nie unter 0; auch im Ölzufluss der Werke berücksichtigt | `produktion.bohrGrenze` |
| Geologie-Fund (A7, Stufe ≥ 3 ANNAHME) | alle 24 Std. ein Fund, Größe gleichverteilt im Bereich der **aktuellen** Stufe, auf 1 Rohöl gerundet; Bereich Stufe 1 = 50.000–100.000, Stufe 2 = 80.000–125.000 (FEST), ab Stufe 3: `Bereich(2) · 1,25^(n−2)`, Grenzen auf 1.000 gerundet | `geologie.fundBereich` |
| Geologie-Takt (ANNAHME) | erster Fund 24 Std. nach Fertigstellung der Stufe 1; Ausbau setzt den Takt nicht zurück; offline werden **alle** fälligen Funde nachgeholt (auch über die 24-Std.-Produktionskappung hinaus); Zufall mit Startwert je Planet (gespeichert) | `geologie.faelligeFunde`, `simuliereBis` |
| Simulation | Schritte zu 60 s (`SIM_SCHRITT_MS`); Bauaufträge und Geologie-Funde teilen die Schritte und gelten genau zu ihrem Zeitpunkt | `produktion.simuliereBis` |
| Offline | Produktion max. 24 Std. angerechnet; Bauaufträge und Geologie-Funde werden **immer** verarbeitet | `offlineFortschritt` |
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
| Kunststoffwerk T2 | 1.200 / 800 / 400 + 50 K1 | 2,0 | +0,5 K2/h; je K2: **40 Rohöl + 20 Metall** (FEST); ab 500 Punkten (A8) | 15 |
| Kunststoffwerk T3 | 5.000 / 4.000 / 2.000 + 25 K2 | 2,0 | +0,02 K3/h; je K3: **1000 Rohöl + 500 Silizium + 500 Metall** (FEST A7); ab 5.000 Punkten (A8) | 20 |
| Geologiestation | 400 / 300 / 100 | 1,75 | alle 24 Std. ein Fund (Größe siehe C1/C4a) | 10 |
| Raumflughafen | 1.000 / 600 / 300 | – | Höchststufe 1, schaltet Startplätze frei | – |
| Werft | 400 / 200 / 100 | 2,0 | – (Funktion später) | – |
| Verteidigungswerft | 300 / 300 / 100 | 2,0 | – (Funktion später) | – |
| Forschungseinrichtung | 200 / 400 / 200 | 2,0 | Forschungszeit × 1/(1+n) | – |
| Solarsatellit (Anzeige) | Bau später in der Werft | – | +30 Strom je Satellit | – |

Höchststufe: **keine** (FEST 0.8.0), außer Raumflughafen (1) und Startplätze (10). Beispiele Bauzeit Stufe 1: Metallmine 1 Min. 48 s, Solarfarm 2 Min. 31 s, Bohrstation 7 Min. 12 s.

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
| Rohölvorkommen | Hauptplanet 1.000.000 (FEST), andere Planeten 0 (FEST, später) |

### C4. Raumflughafen und Startplätze A–Z

Raumflughafen (1 Stufe) muss stehen; dann 26 Startplätze A–Z mit je 10 Stufen (FEST). Freischaltung: Vorgänger auf Stufe 10
(FEST) **und** Punkte-Schwelle (Werte ANNAHME). Start ohne Startplatz.

| Wert | ANNAHME |
|------|---------|
| Kapazität | je Buchstabe ein fester Zuwachs je Stufe (gleich für alle 10 Stufen); Zuwachs wächst je Buchstabe etwa ×2,03 (glatte Zahlen, 2 gültige Stellen), damit A10 = 100 und Summe A10…Z10 ≈ 10 Mrd. (9.990.785.850) |
| Kosten | `floor(400 M / 200 Si / 100 Öl · 1,5^Index · 1,35^(Stufe−1))` (A = Index 0) |
| Bauzeit | OGame-Formel wie Gebäude, **geteilt durch 11** (FEST 0.8.0: Faktor ≈ 10, Z10 ≤ 1 Jahr; 10 hätte 376 Tage ergeben → 11 gewählt, Z10 ≈ 342 Tage); Roboterforschung verkürzt zusätzlich (ANNAHME) |
| Punkte-Schwelle | etwa doppelte kumulierte Kosten der vorigen Buchstaben / 1.000, gerundet |
| Alte Spielstände | Startplätze über Stufe 10 werden auf 10 gekürzt |

| Platz | Kapazität je Stufe | Kapazität bei Stufe 10 | kumuliert (A bis hier, alle Stufe 10) | Kosten Stufe 1 (M / Si / Öl) | Kosten Stufe 10 (M / Si / Öl) | Bauzeit Stufe 10 (÷ 11) | Punkte-Schwelle |
|---|---:|---:|---:|---|---|---:|---:|
| A | 10 | 100 | 100 | 400 / 200 / 100 | 5.957 / 2.978 / 1.489 | 19 Min. | 0 |
| B | 20 | 200 | 300 | 600 / 300 / 150 | 8.936 / 4.468 / 2.234 | 29 Min. | 75 |
| C | 41 | 410 | 710 | 900 / 450 / 225 | 13.404 / 6.702 / 3.351 | 44 Min. | 200 |
| D | 84 | 840 | 1.550 | 1.350 / 675 / 337 | 20.106 / 10.053 / 5.026 | 1,1 Std. | 400 |
| E | 170 | 1.700 | 3.250 | 2.025 / 1.012 / 506 | 30.159 / 15.079 / 7.539 | 1,6 Std. | 600 |
| F | 350 | 3.500 | 6.750 | 3.037 / 1.518 / 759 | 45.239 / 22.619 / 11.309 | 2,5 Std. | 1.000 |
| G | 710 | 7.100 | 13.850 | 4.556 / 2.278 / 1.139 | 67.859 / 33.929 / 16.964 | 3,7 Std. | 1.500 |
| H | 1.400 | 14.000 | 27.850 | 6.834 / 3.417 / 1.708 | 101.789 / 50.894 / 25.447 | 5,6 Std. | 2.500 |
| I | 2.900 | 29.000 | 56.850 | 10.251 / 5.125 / 2.562 | 152.684 / 76.342 / 38.171 | 8,3 Std. | 4.000 |
| J | 5.900 | 59.000 | 115.850 | 15.377 / 7.688 / 3.844 | 229.026 / 114.513 / 57.256 | 12,5 Std. | 6.000 |
| K | 12.000 | 120.000 | 235.850 | 23.066 / 11.533 / 5.766 | 343.539 / 171.769 / 85.884 | 18,7 Std. | 10.000 |
| L | 25.000 | 250.000 | 485.850 | 34.599 / 17.299 / 8.649 | 515.309 / 257.654 / 128.827 | 28,1 Std. | 15.000 |
| M | 50.000 | 500.000 | 985.850 | 51.898 / 25.949 / 12.974 | 772.963 / 386.481 / 193.240 | 42,2 Std. | 20.000 |
| N | 100.000 | 1.000.000 | 1.985.850 | 77.847 / 38.923 / 19.461 | 1.159.445 / 579.722 / 289.861 | 3 Tage | 30.000 |
| O | 210.000 | 2.100.000 | 4.085.850 | 116.771 / 58.385 / 29.192 | 1.739.167 / 869.583 / 434.791 | 4 Tage | 40.000 |
| P | 420.000 | 4.200.000 | 8.285.850 | 175.157 / 87.578 / 43.789 | 2.608.751 / 1.304.375 / 652.187 | 6 Tage | 60.000 |
| Q | 850.000 | 8.500.000 | 16.785.850 | 262.736 / 131.368 / 65.684 | 3.913.127 / 1.956.563 / 978.281 | 9 Tage | 100.000 |
| R | 1.700.000 | 17.000.000 | 33.785.850 | 394.104 / 197.052 / 98.526 | 5.869.691 / 2.934.845 / 1.467.422 | 13 Tage | 150.000 |
| S | 3.500.000 | 35.000.000 | 68.785.850 | 591.156 / 295.578 / 147.789 | 8.804.537 / 4.402.268 / 2.201.134 | 20 Tage | 250.000 |
| T | 7.200.000 | 72.000.000 | 140.785.850 | 886.735 / 443.367 / 221.683 | 13.206.806 / 6.603.403 / 3.301.701 | 30 Tage | 300.000 |
| U | 15.000.000 | 150.000.000 | 290.785.850 | 1.330.102 / 665.051 / 332.525 | 19.810.210 / 9.905.105 / 4.952.552 | 45 Tage | 500.000 |
| V | 30.000.000 | 300.000.000 | 590.785.850 | 1.995.154 / 997.577 / 498.788 | 29.715.315 / 14.857.657 / 7.428.828 | 68 Tage | 750.000 |
| W | 60.000.000 | 600.000.000 | 1.190.785.850 | 2.992.731 / 1.496.365 / 748.182 | 44.572.973 / 22.286.486 / 11.143.243 | 101 Tage | 1.000.000 |
| X | 120.000.000 | 1.200.000.000 | 2.390.785.850 | 4.489.096 / 2.244.548 / 1.122.274 | 66.859.460 / 33.429.730 / 16.714.865 | 152 Tage | 1.500.000 |
| Y | 250.000.000 | 2.500.000.000 | 4.890.785.850 | 6.733.644 / 3.366.822 / 1.683.411 | 100.289.190 / 50.144.595 / 25.072.297 | 228 Tage | 2.500.000 |
| Z | 510.000.000 | 5.100.000.000 | 9.990.785.850 | 10.100.467 / 5.050.233 / 2.525.116 | 150.433.785 / 75.216.892 / 37.608.446 | 342 Tage | 4.000.000 |

### C4a. Geologie-Fundgrößen je Stufe

| Stufe | Fundgröße (Rohöl) |
|---|---|
| 1 | 50.000 – 100.000 (FEST) |
| 2 | 80.000 – 125.000 (FEST) |
| 3 | 100.000 – 156.000 (ANNAHME) |
| 4 | 125.000 – 195.000 |
| 5 | 156.000 – 244.000 |
| 10 | 477.000 – 745.000 |
| 30 | 41.359.000 – 64.623.000 |

### C4b. Master-Modus

`zustand.einstellungen.master` (je Profil). Bauzeit 0, Kosten 0 (nichts abgezogen), Sperren (Punkte, Vorgänger-Stufe,
Kunststoffwerk T2/T3) ignoriert; laufende Aufträge werden beim Einschalten sofort fertig. Geologie-Takt läuft normal; zusätzlich
„Fund sofort auslösen“. Punkte werden gutgeschrieben (ANNAHME).

### C5. Bauauftrag

`planet.bauauftrag = { art: "gebaeude" | "startplatz", id, buchstabe, name, stufe, kosten, start, ende }` – Kosten werden beim
Start abgezogen, Punkte bei Fertigstellung gutgeschrieben. Gründe für deaktivierte Knöpfe: „Höchststufe X erreicht.“,
„Zuerst den Raumflughafen errichten.“, „Gesperrt: A Stufe 10 nötig · X Punkte nötig.“, „Wird später mit Spielfortschritt freigeschaltet.“, „Es läuft bereits ein Bauauftrag.“, „Es fehlen: …“.

### C6. Spielstand v5 und Migration (ab 0.7.0)

- `zustand.planeten = [{ id: "hp", istHauptplanet: true, rohoelVorkommen: 1000000, geologie: { naechsterFund, funde: [{ zeit, stufe, menge, test? }], zufall }, hangar: { schiffe: {} }, gebaeude, regler, solarsatelliten, bauauftrag, startplaetze: [{ buchstabe, stufe }] × 26 }]`
- `zustand.freigeschaltet.kunststoffwerk_t2/t3 = false`, `zustand.einstellungen.master = false`
- Migration v4 → v5 (jedes Profil einzeln beim Laden): Rohölvorkommen 1.000.000 am Hauptplaneten, alte `rohoelfelder` verworfen;
  vorhandene Geologiestation startet ihren 24-Std.-Takt ab dem letzten Tick; Startplätze auf 26 erweitert und auf Stufe 10 gekürzt;
  Master aus; bereits gebaute Kunststoffwerke T2/T3 produzieren weiter (nur weiterer Ausbau gesperrt).
- Migration v1/v2/v3 → v4 → v5: Rohstoffe und Heimat bleiben, neuer Hauptplanet ohne Gebäude, Strom = 0; Lagergrenzen entfallen.
