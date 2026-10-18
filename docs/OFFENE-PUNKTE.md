# Sternenspiel – Offene Punkte (Fragen an Sandro)

Stand: 2026-10-19 (0.6.0) · Alles hier ist bis zur Antwort als **ANNAHME** umgesetzt bzw. vorgemerkt.

## Wichtigste Fragen (bitte zuerst) – Kapitel 2 „Anlagen“

1. **Strom:** Jetzt OGame-Bilanz (nicht lagerbar, Produktionsfaktor drosselt Minen/Werke bei Mangel). Passt das – oder soll Strom doch lagerbar sein?
2. **Kunststoff-Raten:** T3 nutzt deine 2000 Rohöl + 2000 Silizium + 750 Metall je Einheit. Für T1 (10 Rohöl je Einheit) und T2 (40 Rohöl + 20 Metall) sowie die Ausstoßmengen (T1 2/h, T2 0,5/h, T3 0,02/h je Stufe-1-Basis) habe ich Werte gesetzt – ok oder andere Verhältnisse?
3. **Startplätze:** 10 (A–J) oder 26 (A–Z)? Dazu meine Annahmen: Raumflughafen ist ein einstufiges Gebäude, man startet **ohne** Startplatz, Kapazität 5 Schiffe je Stufe, Kosten ×2 je Stufe (+25 % je weiterem Platz), Punkte-Schwellen 0/50/150/400/1.000/2.500/5.000/10.000/20.000/40.000.
4. **Punkte:** 1 Punkt je 1.000 verbaute Rohstoffe, Kunststoff höher gewichtet (T1 ×2, T2 ×4, T3 ×8), gutgeschrieben bei Fertigstellung – passt das? Zählen später auch Forschung/Flotte?
5. **Geologiestation am Hauptplaneten & Abbrechen:** Am Hauptplaneten findet sie Felder nur zur Anzeige (Rohöl dort unbegrenzt) – soll sie dort etwas bewirken? Und: Abbrechen eines Bauauftrags erstattet jetzt 100 % – ok oder weniger?

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
| 12 | Flotte/Startplätze | Startplätze: Gilt die Kapazität auch für Landungen/Rückkehr oder nur für Starts? Was passiert, wenn mehr Schiffe starten sollen als Kapazität frei ist (Warteschlange / nicht erlaubt)? |
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

- ~~Startplätze: Flotte oder Anlagen?~~ → Raumflughafen unter Anlagen (Kapitel 2, Sandro).
- ~~Geologiestation~~ → findet Rohölfelder pro Stunde, begrenzt Bohrstationen auf Nicht-Hauptplaneten (Kapitel 2, Sandro).
- ~~Kunststoff-Kette~~ → T1 Rohöl, T2 Rohöl + Metall, T3 Rohöl + Silizium + Metall (Kapitel 2, Sandro).
- ~~Grundproduktion~~ → kleine Grundproduktion nur am Hauptplaneten (Kapitel 2, Sandro).
- ~~Startet man mit Startplatz A? / Punkteschwellen / Kapazität~~ → jetzt in Frage 3 und 4 oben (Kapitel 2).

- ~~Start-Knopf reagiert auf der Live-Seite nicht~~ → Ursache gemischter Browser-Zwischenspeicher nach Update; behoben mit `?v=`-Cache-Schutz + Versionsprüfung (0.4.0, 2026-10-19).

- ~~Startplatz-Wahl A–Z beim Spielstart / Startplatz-Boni / Stufe als Planeten-Eigenschaft~~ → war ein Missverständnis; Sandro hat klargestellt: automatischer Start, Startplätze = Flotten-Startplattformen (2026-10-19).
