# Changelog – Sternenspiel

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
