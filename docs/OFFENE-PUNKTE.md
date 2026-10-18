# Sternenspiel – Offene Punkte (Fragen an Sandro)

Stand: 2026-10-19 (0.7.0) · Alles hier ist bis zur Antwort als **ANNAHME** umgesetzt bzw. vorgemerkt.

## Wichtigste Fragen (bitte zuerst) – Kapitel-2-Nachbesserung 0.7.0

1. **Freischaltung Kunststoffwerk T2/T3:** Beide sind jetzt gesperrt („Wird später mit Spielfortschritt freigeschaltet.“). Wodurch sollen sie freigeschaltet werden (Forschung, Punkte, Stufe des T1-Werks, ein Ereignis …)? Im Code steht ein Flag bereit (`freigeschaltet.kunststoffwerk_t2/t3`).
2. **Geologie-Fundgröße ab Stufe 3:** Stufe 1/2 sind deine Werte. Ab Stufe 3 wächst der Bereich jetzt um **×1,25 je Stufe** (Stufe 3 = 100.000–156.000, Stufe 5 = 156.000–244.000, Stufe 10 = 477.000–745.000, Stufe 30 ≈ 41–65 Mio.). Passt das oder andere Formel/Obergrenze?
3. **Startplätze – Werte:** Kapazität (A10 = 100 … Z10 = 5,1 Mrd., Summe ≈ 9,99 Mrd.), Kosten (400/200/100 · 1,35^Stufe · 1,5^Buchstabe) und Punkte-Schwellen (B 75, E 600, J 6.000, P 60.000, Z 4 Mio.) sind meine Annahme. Die späten Buchstaben haben nach OGame-Bauzeitformel **sehr lange Bauzeiten** (P10 ≈ 65 Tage, Z10 ≈ 10 Jahre) – sollen Startplätze eine eigene, kürzere Bauzeit bekommen (oder kommt später eine Robotik-Forschung, die das verkürzt)?
4. **Geologie-Details:** Der 24-Std.-Takt beginnt mit dem Bau der Stufe 1 und wird durch Ausbau nicht zurückgesetzt; die Fundgröße richtet sich nach der Stufe zum Fundzeitpunkt; offline werden alle Funde nachgeholt (auch über die 24-Std.-Produktionskappung hinaus). Ok?
5. **Master-Modus:** Punkte für Master-Bauten werden gutgeschrieben, der Raumflughafen bleibt Voraussetzung für Startplätze. Soll Master stattdessen gar keine Punkte geben (sauberer Test) oder auch den Raumflughafen überspringen?

## Weitere offene Punkte

| # | Thema | Frage |
|---|---------|-------|
| 26 | Anlagen | Grundwerte/Kosten der Gebäude (Tabelle SPEZIFIKATION C2), Grundproduktion Hauptplanet 30 Metall / 15 Silizium, Startbestand 500/300/100 – ok? |
| 27 | Anlagen | Bauzeit zählt nur Metall + Silizium (OGame); sollen Rohöl/Kunststoff mitzählen? |
| 28 | Anlagen | Höchststufe 30 für alle Gebäude – Raumflughafen jetzt nur 1 Stufe (Container für Startplätze). Soll er selbst ausbaubar sein? |
| 29 | Anlagen | Solarsatellit: 30 Strom je Satellit (fest) oder abhängig von der Planetentemperatur wie in OGame? |
| 30 | Anlagen | Drosselung: Verbraucher drosseln den Ertrag, ziehen aber vollen Strom (OGame). Sollen Kunststoffwerke bei Rohstoffmangel auch weniger Strom ziehen? |
| 31 | Antimaterie | Wodurch wird Antimaterie freigeschaltet (Forschung, ein Gebäude, ein Ereignis)? |
| 6 | Grundgerüst | Start-Koordinate zufällig (jetzt so) – oder z. B. bevorzugt in einem bestimmten Sektor / weit weg von KI-Gegnern? |
| 7 | Grundgerüst | Systemnummern global 1–300 (`3:133:5`, jetzt so) oder je Sektor 1–60 (`3:13:5`)? |
| 9 | Grundgerüst | Namen ok (Universum „Sternenreich“, Sektoren Alpha–Epsilon, erzeugte System-/Planetennamen)? |
| 11 | Grundgerüst | Offline-Fortschritt: Kappung auf 24 Std. ok? Volle Rate oder reduziert? |
| 12 | Flotte/Startplätze | Hangar-Regel ist jetzt festgelegt (frei erst nach Rückkehr/Zerstörung/Umstationierung). Offen: Was passiert beim Versand, wenn die freie Kapazität nicht reicht – Versand nur bis zur Kapazität kürzen oder ablehnen? |
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
