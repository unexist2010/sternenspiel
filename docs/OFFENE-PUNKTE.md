# Sternenspiel – Offene Punkte (Fragen an Sandro)

Stand: 2026-10-19 · Alles hier ist bis zur Antwort als **ANNAHME** umgesetzt bzw. vorgemerkt.

## Wichtigste Fragen (bitte zuerst)

1. **Startplätze: 10 oder A–Z?** Du schriebst „bis zu 10, beschriftet A bis Z“. Jetzt umgesetzt: 10 Startplätze A–J. Sollen es 10 (A–J) oder 26 (A–Z) sein?
2. **Startet man mit Startplatz A?** Jetzt: A ist von Beginn an da (Stufe 1), B–J gesperrt. Oder startet man ohne Startplatz und muss den ersten bauen?
3. **Punkteschwellen:** Ab wie vielen Punkten wird der 2., 3., … 10. Startplatz freigeschaltet? Und wofür gibt es Punkte (verbaute Rohstoffe, Gebäude, Forschung, Flotte)?
4. **Kapazität pro Stufe:** Wie viele Schiffe kann ein Startplatz je Stufe gleichzeitig starten lassen (z. B. Stufe 1 = 5 Schiffe, +5 je Stufe)? Und wie stark steigen die Ausbaukosten (Faktor je Stufe, z. B. ×2)?
5. **Antimaterie-Freischaltung:** Wodurch wird sie freigeschaltet (Forschung in Kapitel 3, ein Gebäude, ein Ereignis)?

## Weitere offene Punkte

| # | Kapitel | Frage |
|---|---------|-------|
| 6 | 1 | Start-Koordinate zufällig (jetzt so) – oder z. B. bevorzugt in einem bestimmten Sektor / weit weg von KI-Gegnern? |
| 7 | 1 | Systemnummern global 1–300 (`3:133:5`, jetzt so) oder je Sektor 1–60 (`3:13:5`)? |
| 8 | 1 | Strom: lagerbarer Rohstoff (jetzt so) oder Leistungsbilanz (Erzeugung minus Verbrauch)? |
| 9 | 1 | Namen ok (Universum „Sternenreich“, Sektoren Alpha–Epsilon, erzeugte System-/Planetennamen)? |
| 10 | 1/2 | Vorläufige Grundproduktion ohne Gebäude behalten oder ab Kapitel 2 ganz durch Anlagen ersetzen? |
| 11 | 1 | Offline-Fortschritt: Kappung auf 24 Std. ok? Volle Rate oder reduziert? |
| 12 | 6 | Startplätze: Gilt die Kapazität auch für Landungen/Rückkehr oder nur für Starts? Was passiert, wenn mehr Schiffe starten sollen als Kapazität frei ist (Warteschlange / nicht erlaubt)? |
| 13 | 6 | Werden Startplätze über die Seite „Flotte“ oder als Gebäude unter „Anlagen“ ausgebaut? |
| 14 | 2 | Was genau macht die Geologiestation (Vorkommen aufdecken, Förderbonus, neue Lagerstätten)? Weitere Gebäude? |
| 15 | 3 | Wie entstehen Kunststoff T1/T2/T3 (Rohstoffkette)? |
| 16 | 4 | Namen/Werte der 23 Schiffe, 5 Waffentypen, 2 Hüllentypen – Vorgabe oder Vorschlag von mir? |
| 17 | 5 | Schutzschild-Autoaktivierung: wann genau, Kosten, Abklingzeit? |
| 18 | 5 | Trümmer am Boden 50–75 %: Zufall oder abhängig von etwas? Gilt Salvage für Schiffe und Verteidigung? |
| 19 | 6 | Treibstoffregeln: welcher Rohstoff, Verbrauchsformel, was bei leerem Tank? |
| 20 | 6/7 | Sind andere Planeten von KI-Gegnern besetzt? Kann man weitere Planeten besiedeln? |
| 21 | 7 | KI 5–10 Ereignisse täglich: nur Angriffe oder auch andere Ereignisse? Laufen sie offline weiter? |
| 23 | 1 | Spielerprofile: Name Pflicht und eindeutig, max. 20 Spieler, „Zurücksetzen“ behält Name + Hauptplanet (jetzt so) – passt das? |
| 24 | 1 | Sollen Profile später exportiert/importiert werden können (Sicherung, anderes Gerät)? |
| 22 | – | Endgültiger Name: „Sternenspiel“, „Sternenreich“ oder „Weltraumspiel“? |

## Erledigt

- ~~Start-Knopf reagiert auf der Live-Seite nicht~~ → Ursache gemischter Browser-Zwischenspeicher nach Update; behoben mit `?v=`-Cache-Schutz + Versionsprüfung (0.4.0, 2026-10-19).

- ~~Startplatz-Wahl A–Z beim Spielstart / Startplatz-Boni / Stufe als Planeten-Eigenschaft~~ → war ein Missverständnis; Sandro hat klargestellt: automatischer Start, Startplätze = Flotten-Startplattformen (2026-10-19).
