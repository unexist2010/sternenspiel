# Sternenspiel – Offene Punkte (Fragen an Sandro)

Stand: 2026-10-31 (0.11.0, Kapitel 4 Schiffsliste nach Sandro) · Alles hier ist bis zur Antwort als **ANNAHME** umgesetzt bzw. vorgemerkt.

## Wichtigste Fragen (bitte zuerst)

| # | Thema | Frage |
|---|-------|-------|
| 41 | Werft | **Bauzeit** je Schiff = (Metall + Silizium) / (2.500 · (1 + Werftstufe)) Std. × Roboterfaktor, mindestens 1 Sek. – ok? |
| 46 | Bilder | **Wartet auf Auswahl:** alle 48 Bildvorschläge (24 Schiffe × A/B) liegen unter `/workspace/sternenspiel-bildvorschlaege/<id>-a.png` / `-b.png` (Box, nicht im Repo). Sandro wählt je Schiff aus; im Spiel bleiben bis dahin Platzhalter-SVGs. |
| 37 | Forschung | **Sichtbarkeit:** Forschung erscheint, sobald mindestens eine Voraussetzung erfüllt ist (vorher ausgeblendet, Zähler „X weitere Forschungen“) – so gemeint? |

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
| 16 | Werft | Schiffsliste nach Sandro umgesetzt (0.10.0, 24 Schiffe); offen nur noch Einzelwerte (Tempo-Skala ×125, Kampfwerte) – Tabelle in SPEZIFIKATION C8. Waffen: 5 Waffentypen (Laser, Ionen, Plasma, Raketen, Graviton), 2 Hüllen (Leichtmetall, Verbund); alle Namen, Kosten, Kampfwerte, Voraussetzungen = ANNAHME, Tabelle in SPEZIFIKATION C8. |
| 17 | Verteidigung | Schutzschild-Autoaktivierung: wann genau, Kosten, Abklingzeit? |
| 18 | Verteidigung | Trümmer am Boden 50–75 %: Zufall oder abhängig von etwas? Gilt Salvage für Schiffe und Verteidigung? |
| 19 | Flotte/Startplätze | Treibstoffregeln: welcher Rohstoff, Verbrauchsformel, was bei leerem Tank? |
| 20 | Flotte/KI | Sind andere Planeten von KI-Gegnern besetzt? Kann man weitere Planeten besiedeln? |
| 21 | KI | KI 5–10 Ereignisse täglich: nur Angriffe oder auch andere Ereignisse? Laufen sie offline weiter? |
| 23 | Grundgerüst | Spielerprofile: Name Pflicht und eindeutig, max. 20 Spieler, „Zurücksetzen“ behält Name + Hauptplanet (jetzt so) – passt das? |
| 24 | Grundgerüst | Sollen Profile später exportiert/importiert werden können (Sicherung, anderes Gerät)? |
| 25 | Kapitelplan | In welcher Reihenfolge sollen die späteren Kapitel kommen (je Menüpunkt bzw. Mechanik, z. B. Ressourcen → Anlagen → Forschung …)? |
| 22 | – | Endgültiger Name: „Sternenspiel“, „Sternenreich“ oder „Weltraumspiel“? |

## Merken für das Verteidigungs-/Kampf-Kapitel (Sandro: „merken wir uns für später“)

| # | Thema | Merkpunkt |
|---|-------|-----------|
| 47 | Kampf | Kampfablauf alles gleichzeitig (OGame-Stil, Sandros Tendenz) oder getrennt? |
| 48 | Kampf | Startplätze starten bei Angriff automatisch; Hangar ist geschützt. |
| 49 | Kampf | Trümmer: Orbit → Wracksammler, Boden → Bodensammler. |
| 50 | Verteidigung | Verteidigung wird zu Schrott: max. 50 %, abhängig von Forschung. |

## Erledigt

- ~~39 Werft-Warteschlange~~ → **unbegrenzt** (Sandro, 0.10.0).
- ~~43 23 oder 24 Schiffe~~ → **24 bleibt fest** (Sandro, 0.11.0).
- ~~44 Bodensammler-Werte~~ → bestätigt (12.000 M / 8.000 Si / 3.000 Öl, Ladung 75.000) (Sandro, 0.11.0).
- ~~45 Alte Schiffe ohne Entsprechung~~ → dürfen verworfen werden (Sandro, 0.11.0).
- ~~40 Sperre Werft-Ausbau ↔ Schiffbau~~ → ja, bleibt (Sandro, 0.10.0).
- ~~42 Zivile Schiffe mit Raketen / Antimaterie-Frachter~~ → durch Sandros Schiffsliste ersetzt (Hilfsschiffe unbewaffnet, kein Antimaterie-Frachter).

- ~~Forschung (Kapitel 3)~~ → freigegeben und umgesetzt (0.8.0): 18 Forschungen, Forschungseinrichtung, ET/Roboter wirken, Rest berechnet.
- ~~Kunststoff-Freischaltung durch Forschung?~~ → nein, T2/T3 über Punkte (Sandro, 0.8.0).

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

- ~~Fragen 34, 35, 36, 38 (Roboter, Energie-/Waffenwerte, Kosten/Graviton, Master braucht Einrichtung)~~ → von Sandro bestätigt (2026-10-30, 0.9.0).
