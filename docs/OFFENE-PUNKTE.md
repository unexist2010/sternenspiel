# Sternenspiel – Offene Punkte (Fragen an Sandro)

Stand: 2026-10-19 (0.8.0) · Alles hier ist bis zur Antwort als **ANNAHME** umgesetzt bzw. vorgemerkt.

## Wichtigste Fragen (bitte zuerst)

_(werden mit Kapitel 3 neu gefüllt)_

## Weitere offene Punkte

| # | Thema | Frage |
|---|---------|-------|
| 32 | Geologie | Takt beginnt mit Bau der Stufe 1, Ausbau setzt nicht zurück; Fundgröße nach Stufe zum Fundzeitpunkt; offline alle Funde nachgeholt (auch über 24 Std. hinaus) – ok? |
| 33 | Master | Master-Bauten geben Punkte; Raumflughafen bzw. Forschungseinrichtung bleiben Voraussetzung – ok, oder Master ohne Punkte? |
| 26 | Anlagen | Grundwerte/Kosten der Gebäude (Tabelle SPEZIFIKATION C2), Grundproduktion Hauptplanet 30 Metall / 15 Silizium, Startbestand 500/300/100 – ok? |
| 27 | Anlagen | Bauzeit zählt nur Metall + Silizium (OGame); sollen Rohöl/Kunststoff mitzählen? |
| 29 | Anlagen | Solarsatellit: 30 Strom je Satellit (fest) oder abhängig von der Planetentemperatur wie in OGame? |
| 30 | Anlagen | Drosselung: Verbraucher drosseln den Ertrag, ziehen aber vollen Strom (OGame). Sollen Kunststoffwerke bei Rohstoffmangel auch weniger Strom ziehen? |
| 31 | Antimaterie | Wodurch wird Antimaterie freigeschaltet (Forschung, ein Gebäude, ein Ereignis)? |
| 6 | Grundgerüst | Start-Koordinate zufällig (jetzt so) – oder z. B. bevorzugt in einem bestimmten Sektor / weit weg von KI-Gegnern? |
| 7 | Grundgerüst | Systemnummern global 1–300 (`3:133:5`, jetzt so) oder je Sektor 1–60 (`3:13:5`)? |
| 9 | Grundgerüst | Namen ok (Universum „Sternenreich“, Sektoren Alpha–Epsilon, erzeugte System-/Planetennamen)? |
| 11 | Grundgerüst | Offline-Fortschritt: Kappung auf 24 Std. ok? Volle Rate oder reduziert? |
| 15 | Forschung | Kunststoff T1–T3 sind jetzt ohne Forschung sichtbar und herstellbar – braucht es später eine Forschungs-Freischaltung? |
| 16 | Werft | Namen/Werte der 23 Schiffe, 5 Waffentypen, 2 Hüllentypen – Vorgabe oder Vorschlag von mir? |
| 17 | Verteidigung | Schutzschild-Autoaktivierung: wann genau, Kosten, Abklingzeit? |
| 18 | Verteidigung | Trümmer am Boden 50–75 %: Zufall oder abhängig von etwas? Gilt Salvage für Schiffe und Verteidigung? |
| 19 | Flotte/Startplätze | Treibstoffregeln: welcher Rohstoff, Verbrauchsformel, was bei leerem Tank? |
| 20 | Flotte/KI | Sind andere Planeten von KI-Gegnern besetzt? Kann man weitere Planeten besiedeln? |
| 21 | KI | KI 5–10 Ereignisse täglich: nur Angriffe oder auch andere Ereignisse? Laufen sie offline weiter? |
| 23 | Grundgerüst | Spielerprofile: Name Pflicht und eindeutig, max. 20 Spieler, „Zurücksetzen“ behält Name + Hauptplanet (jetzt so) – passt das? |
| 24 | Grundgerüst | Sollen Profile später exportiert/importiert werden können (Sicherung, anderes Gerät)? |
| 25 | Kapitelplan | In welcher Reihenfolge sollen die späteren Kapitel kommen (je Menüpunkt bzw. Mechanik, z. B. Ressourcen → Anlagen → Forschung …)? |
| 22 | – | Endgültiger Name: „Sternenspiel“, „Sternenreich“ oder „Weltraumspiel“? |

## Erledigt

- ~~Freischaltung Kunststoffwerk T2/T3~~ → über Spielerpunkte (Sandro, 0.8.0); Schwellen T2 500 / T3 5.000 sind ANNAHME (SPEZIFIKATION A8).
- ~~Geologie-Fundgröße ab Stufe 3~~ → ×1,25 je Stufe bleibt (Sandro, 0.8.0).
- ~~Startplatz-Bauzeiten zu lang~~ → Bauzeit ÷ 11, Z10 ≈ 342 Tage (Sandro: ÷ ~10, höchstens ~1 Jahr; 0.8.0).
- ~~Höchststufe 30~~ → keine Obergrenze für Gebäude, Raumflughafen bleibt 1, Startplätze 10 (Sandro, 0.8.0).
- ~~Flottenversand mit zu wenig Kapazität~~ → Info „zu wenige Startplätze“ (Sandro, 0.8.0; Regel für das Flotten-Kapitel, SPEZIFIKATION A8/88).

- ~~Strom: Bilanz oder lagerbar?~~ → OGame-Bilanz passt so (Sandro, 0.7.0).
- ~~Kunststoff-Raten~~ → T2 = 40 Rohöl + 20 Metall, T3 = 1000 Rohöl + 500 Silizium + 500 Metall, T1 unverändert (Sandro, 0.7.0). Ausstoßmengen je Stufe bleiben ANNAHME (SPEZIFIKATION C2).
- ~~Startplätze 10 (A–J) oder 26 (A–Z)?~~ → 26 (A–Z), je 10 Stufen, B erst nach A Stufe 10 + Punkte, A10 ≈ 100, bis Z10 ≈ 10 Mrd. (Sandro, 0.7.0). Werte siehe Frage 3.
- ~~Punkte~~ → OGame-artig, 1 Punkt je 1.000 ausgegebene Rohstoffe (Sandro, 0.7.0). Gewichtung Kunststoff (T1 ×2, T2 ×4, T3 ×8) bleibt ANNAHME.
- ~~Geologiestation am Hauptplaneten~~ → Rohölvorkommen 1.000.000, Bohrstation fördert daraus, Geologie findet alle 24 Std. ein Feld (Sandro, 0.7.0). Abbrechen erstattet weiterhin 100 % (ANNAHME, ohne Einwand).

- ~~Startplätze: Flotte oder Anlagen?~~ → Raumflughafen unter Anlagen (Kapitel 2, Sandro).
- ~~Geologiestation~~ → findet Rohölfelder pro Stunde, begrenzt Bohrstationen auf Nicht-Hauptplaneten (Kapitel 2, Sandro).
- ~~Kunststoff-Kette~~ → T1 Rohöl, T2 Rohöl + Metall, T3 Rohöl + Silizium + Metall (Kapitel 2, Sandro).
- ~~Grundproduktion~~ → kleine Grundproduktion nur am Hauptplaneten (Kapitel 2, Sandro).
- ~~Startet man mit Startplatz A? / Punkteschwellen / Kapazität~~ → jetzt in Frage 3 und 4 oben (Kapitel 2).

- ~~Start-Knopf reagiert auf der Live-Seite nicht~~ → Ursache gemischter Browser-Zwischenspeicher nach Update; behoben mit `?v=`-Cache-Schutz + Versionsprüfung (0.4.0, 2026-10-19).

- ~~Startplatz-Wahl A–Z beim Spielstart / Startplatz-Boni / Stufe als Planeten-Eigenschaft~~ → war ein Missverständnis; Sandro hat klargestellt: automatischer Start, Startplätze = Flotten-Startplattformen (2026-10-19).
