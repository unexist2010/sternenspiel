# Sternenspiel

**Stand:** 2026-10-19 (Europe/Vienna) · **Version:** 0.8.0 · **Status:** Kapitel 3 „Forschung“ erledigt (davor Kapitel 2 „Anlagen“ inkl. Nachbesserung und Sandros Antworten)  
**Für:** Sandro Orsaria · **Sprache:** Deutsch (Oberfläche, Doku, Kommentare) · **Repo:** github.com/unexist2010/sternenspiel · **Live:** https://unexist2010.github.io/sternenspiel/

## Kurzüberblick

**Sternenspiel** (Arbeitstitel, auch „Sternenreich“/„Weltraumspiel“) ist ein Offline-Aufbauspiel im Weltraum für den Browser
im Retro-Stil klassischer Browser-Weltraumspiele: links das Menü, in der Mitte das Inhaltsfeld, oben die Rohstoffe.
Grafiken sind **eigene SVGs** (`assets/`, erzeugt mit `tools/erzeuge-grafiken.js`) – keine fremden Assets.

- Reines **HTML/CSS/JavaScript** – kein Build, kein Server, keine externen Quellen (CDNs, Schriften).
- Läuft **offline** per Doppelklick auf `index.html`; Spielstand in `localStorage`.
- **Responsiv**: Desktop mit fester Menüleiste links, Handy mit ausklappbarem Menü (☰).

## Starten

1. `index.html` doppelklicken (öffnet im Browser über `file://`).
2. **Spielerauswahl:** vorhandenen Spieler mit „Spielen“ fortsetzen – oder unten „Neuen Spieler erschaffen“ (Name, optional
   Planetenname). Ein neuer Spieler startet automatisch auf einem Hauptplaneten (zufällige Koordinate) – ohne Auswahl.
3. Im Spiel wechselt „Spieler wechseln“ (Menü unten oder Übersicht) zurück zur Auswahl; vorher wird gespeichert.

**Nach einem Update** genügt normales Neuladen: Alle Dateien tragen `?v=<Version>`; passt etwas nicht zusammen, lädt die
Seite einmal selbst neu oder zeigt „Neu laden“. Spielstände bitte **nicht** löschen – alte Stände werden übernommen.

## Stand nach Kapitel 3 „Forschung“

- **Menü** links in fester Reihenfolge: Übersicht, Ressourcen, Anlagen, Forschung, Werft, Verteidigung, Flotte, Weltraum
- **Übersicht**: Hauptplanet mit Koordinaten (Sektor:System:Planet), Sektor, System; Punkte, laufender Bauauftrag;
  Knöpfe Speichern / Laden / Spieler wechseln / Zurücksetzen
- **Ressourcen**: Rohstofftabelle (Bestand, Produktion, Verbrauch, Netto je Std.), Energiebilanz mit Produktionsfaktor,
  Produktion je Gebäude mit Reglern 0–100 %
- **Anlagen**: Kacheln in 4 Gruppen – Ressourcenabbau (Metallmine, Siliziummine, Bohrstation), Energie (Solarfarm,
  Ölverbrennungsstation, Solarsatelliten), Kunststoffproduktion (Kunststoffwerk T1–T3), Weitere Anlagen (Geologiestation,
  Raumflughafen, Werft, Verteidigungswerft, Forschungseinrichtung); 1 Bauauftrag je Planet, läuft auch offline weiter
- **Raumflughafen** → Unterseite „Startplätze“ A–Z (26 × 10 Stufen, Freischaltung über Vorgänger Stufe 10 + Punkte, Gesamtkapazität)
- **Rohölvorkommen** (Hauptplanet 1.000.000), Bohrstation fördert daraus, **Geologiestation** findet alle 24 Std. ein Feld (Fund-Log)
- **Info-Fenster ⓘ** je Gebäude (aktuelle + nächste 5 Stufen) und **MASTER-Knopf** (Testmodus: sofort, kostenlos, ohne Sperren; je Profil)
- **Ressourcenleiste**: Metall, Silizium, Rohöl, Strom (Erzeugung / Bedarf), Kunststoff T1–T3; Antimaterie ausgeblendet
- **Forschung**: 18 Forschungen in 5 Gruppen in der Forschungseinrichtung, eine Forschung gleichzeitig (auch offline), Voraussetzungen
  grün/rot (inkl. ODER), ⓘ-Info; Energie-Technologie und Roboterforschung wirken bereits, die übrigen Wirkungen werden angezeigt
- Werft, Verteidigung, Flotte, Weltraum: noch Platzhalter (eigene Kapitel)
- **Spielerprofile**: mehrere Spieler pro Browser, je eigener Spielstand und Offline-Fortschritt
- Alle Werte zentral in `js/data/konstanten.js`, `js/data/gebaeude.js` und `js/data/forschung.js`; Formeln in `docs/SPEZIFIKATION.md` (Abschnitt C, Forschung C7)

## Testen

```bash
node --test tests/                       # 69 Node-Tests (Kosten, Produktion, Energie, Bauauftrag/Offline, Startplätze, Forschung, Migration, Profile …)
node tests/playtest-kapitel2.js          # Browser-Playtest Kapitel 2 (Chromium headless, file://), Screenshots kapitel2-*.png
node tests/playtest-kapitel2b.js         # Nachbesserung 0.7.0: Master, Info-Fenster, Geologie-Log, Raumflughafen A–Z (kapitel2b-*.png)
node tests/playtest-kapitel3.js          # Kapitel 3 Forschung: Seite, Voraussetzungen, Info, Offline, Master (kapitel3-*.png)
PLAYTEST_BROWSER=firefox node tests/playtest-kapitel2.js
node tests/playtest-kapitel1-profile.js  # Profile + Cache-Mix (Chromium/Firefox, file:// + lokaler Server)
LIVE_URL=https://unexist2010.github.io/sternenspiel/ node tests/playtest-kapitel2.js   # gegen die Live-Seite
LIVE_URL=https://unexist2010.github.io/sternenspiel/ node tests/playtest-kapitel1-profile.js
LIVE_URL=https://unexist2010.github.io/sternenspiel/ node tests/playtest-kapitel3.js
```

Der Playtest braucht `playwright-core` (sucht automatisch; sonst `npm i playwright-core` oder `PLAYWRIGHT_CORE=…`) und
Chrome/Chromium (`CHROME=…`). Er spielt auf **Handy 412×915** und **Desktop 1366×768**: Solarfarm und Metallmine bauen,
Zeit vorspulen, Stufe und Produktion steigen, Regler, Abbrechen, Raumflughafen + Startplatz, Offline-Fertigstellung; dazu
Konsolenfehler, externe Anfragen, waagrechter Überlauf und geladene Bilder.

Grafiken neu erzeugen: `node tools/erzeuge-grafiken.js`

## Ordnerstruktur

```
/workspace/sternenspiel/
  index.html              ← Einstieg (Doppelklick)
  css/style.css           ← Retro-Weltraum-Stil, mobil zuerst
  assets/                 ← EIGENE Grafiken (SVG): Logo, Emblem, Favicon, Sternenhimmel, Planeten, Sterne, Rohstoffe, Gebäude
  tools/erzeuge-grafiken.js ← erzeugt alle SVGs unter assets/
  js/data/                ← Konfiguration
    konstanten.js         ← ZENTRALE Balance (Bauzeit, Grundproduktion, Punkte, Startplätze) + Weltraum-Größen
    rohstoffe.js          ← 8 Rohstoffe (Kunststoff T1–T3 + Antimaterie mit Freischalt-Flag)
    startplaetze.js       ← Startplätze A–Z des Raumflughafens (Regeltexte, Anfangszustand)
    weltraum.js           ← Universum/Sektoren/Systeme/Planeten (deterministisch erzeugt), zufällige Start-Koordinate
    menue.js              ← 8 Menüpunkte (Reihenfolge FEST) + neutraler Platzhaltertext
    gebaeude.js           ← 13 Anlagen in 4 Gruppen (Kosten, Faktor, Wirkung) + Solarsatellit
    forschung.js          ← 18 Forschungen in 5 Gruppen (Kosten, Faktor, Voraussetzungen, Wirkung)
    schiffe.js            ← Andockpunkt für spätere Kapitel
  js/kern/                ← DOM-freie Logik (in Node testbar)
    zustand.js            ← Spielstand-Modell v6 (planeten[], forschung), Prüfung, Migration
    profile.js            ← Spielerprofile (Liste, Anlegen, Laden/Speichern je Spieler, Löschen, Übernahme Altstand)
    produktion.js         ← Raten, Energiebilanz, Kunststoff-Drosselung, Simulation, Offline-Fortschritt
    bau.js                ← Kosten, Bauzeit, Bauauftrag, Punkte, Startplätze, Master-Modus
    forschung.js          ← Forschungsauftrag, Voraussetzungen, Sichtbarkeit, Forschungszeit, Wirkungen/bonus()
    geologie.js           ← Rohölvorkommen-Funde der Geologiestation (24-Std.-Takt, Fund-Log)
    speicher.js           ← Speichern/Laden/Löschen
  js/ui/format.js, app.js ← Formate + Oberfläche (Menü, Seiten, Navigation per #anker)
  tests/                  ← Node-Tests + Browser-Playtest
  playtest/               ← Screenshots kapitel3-*.png, kapitel2*-*.png (und ältere kapitel1-*.png)
  docs/                   ← SPEZIFIKATION.md, KAPITELPLAN.md, OFFENE-PUNKTE.md
  CHANGELOG.md
```

## Kennzeichnung

- **FEST** = von Sandro vorgegeben (siehe `docs/SPEZIFIKATION.md`)
- **ANNAHME** = von mir gesetzt, bis Sandro entscheidet (gesammelt in `docs/OFFENE-PUNKTE.md`)

## Nächster Schritt

Das nächste Kapitel legt Sandro fest – Sammlung in `docs/KAPITELPLAN.md`; offene Fragen zu Kapitel 2 in `docs/OFFENE-PUNKTE.md`.
