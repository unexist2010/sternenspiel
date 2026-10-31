
## 0.14.1 – Testphase (t32u)
- **Erledigt:** Testphase mit 2 Minimal-Gegnern, echte Spionage/Angriffe.
- **Später:** vollständiges Weltraum-Kapitel, KI-Gegner/Wellen, Beute, Schnellfeuer, Zufall, Kolonisierung.
- **Offen:** Orbitalverteidigungsplattform für schwache Gegner zu stark (bei Alpha deshalb weggelassen, sonst Unentschieden).
- **Offen:** Spionagesonden-Verluste/Sichtbarkeit ohne Master; Reparaturquote rundet bei 1 Anlage auf „repariert“ (ANNAHME).

## 0.14.2 – Zivilschiffe + Trümmer bergen (t33u)
- **Erledigt:** Zivilschiffe kämpfen nicht; Totalverlust vernichtet sie; Mission „Trümmer bergen“; Auto-Bergung mit Wracksammlern nach Sieg; Boden-Schrott nur für Besitzer.
- **Beantwortet (t34u):** Verteidiger-Zivil auf Startplätzen vernichtet, im Hangar geschützt (siehe 0.14.3).
- **ANNAHME (bleibt):** Bergung nur Trümmer des aktuellen Kampfes oder ganzes Feld (ANNAHME: ganzes Feld bis Kapazität)?
- **Offen:** Bodensammler-Mission für eigenen Boden-Schrott; Bergung vom eigenen Planeten; Verteilung der Kapazität auf Metall/Silizium (aktuell Metall zuerst).

## 0.14.3 – Hangar-Schutz + Spionage (t34u)
- **Erledigt (FEST):** Verteidiger-Zivil nur auf Startplätzen vernichtet, Hangar bleibt; Spionage ohne Hangar-Inhalt, nur Hinweis auf Bodenbewegungen.
- **ANNAHME (unverändert):** Bergung nimmt das ganze Orbit-Feld bis Kapazität, Metall zuerst, Silizium danach; Gutschrift bei Rückkehr.
- **Offen:** Hinweis später abhängig von Spionage-Forschung/Sondenanzahl abstufen?

## 0.15.1 – Expeditions-Playtest-Fixes (pt38u)
- **Erledigt:** Rettungs-Text/Bericht stimmig, Master-Verzögerung ehrlich, Kampfberichte-Liste (10), Laderaum-Kappung im Text, Expeditionsraum-Vorausfüllung + Knopf, Zähler-Label.
- **Erledigt (0.16.0):** Position 13 wird in der Weltraum-Ansicht als „Expeditionsraum“ mit Knopf „Expedition“ angezeigt.
- **Unverändert:** Ausschlussliste Schiffsfunde nur Kolonieschiff + stationär (bis Sandro liefert); keine Balance-Änderung.

## 0.16.0 – Weltraum-Ansicht (pt40u)
- **Erledigt:** Menü Weltraum, Systemansicht 1–12 + 13, Knöpfe Spionage (Auto-Sonde)/Angriff/Transport/Stationieren/Kolonisieren/Expedition, Flotten-Deeplink, Alpha/Beta klickbar.
- **Klärung nötig (Sandro):** „4–5 Sonnensysteme pro Sektor“ vs. bestehendes FEST-Datenmodell (5 Sektoren, 300 Sonnensysteme gesamt = 60 je Sektor). ANNAHME: Datenmodell bleibt (keine Spielstand-Migration nötig), die Ansicht zeigt je Sektor ein Fenster von **5 Sonnensystemen** um das gewählte; „ca. 300 Sonnensysteme“ = Universum gesamt. Falls gemeint ist: 300 Systeme *je Sektor* oder wirklich nur 4–5 Systeme je Sektor → Konstanten `SS.BALANCE.WELTRAUM` anpassen (betrifft Koordinaten bestehender Spielstände).
- **ANNAHME:** Spionage schickt genau 1 Sonde (OGame-Standard) und öffnet danach das Flottenfenster; Anzahl später einstellbar?
- **ANNAHME:** Spionage/Angriff nur bei fremden Planeten (Testgegner); eigene Planeten haben Transport + Stationieren. Transport auch zu Gegnern möglich.
- **Offen:** Kolonisieren-Wirkung am Ziel (neue Kolonie) folgt eigenem Kapitel; Trümmerfeld-Anzeige je Position; Spieler-/Allianz-Infos.

## 0.16.2 – Tempo-Leitlinie (Sandro t44u, FEST)
- **Kleiner Frachter** bewusst early-schnell (ähnlich kleinen Kampfschiffen) – bestätigt, keine Änderung.
- **Spionagesonde** OGame-schnell (Tempo 100.000.000, Flüge in Sekunden).
- **Große Schiffe** (Koloss, Titan) langsam, aber nicht RIP-extrem – Titan ohne Auftrag nicht ändern.

## 0.17.0 – Waffen neu + EMP (t47u)
- **ANNAHME:** EMP-Zahlen 25 Einheiten und Energiehülle ≤ 1.000 je Stufe; Graviton-Forschung wird zu EMP-Technologie (gleiche Kosten, Stufen migriert).
- **ANNAHME:** Titan ist von kostengleicher Flotte in einem Kampf nicht zu besiegen (Hülle aus Kostenformel) – ok oder Titan-Hülle senken?
- **Offen:** Ionengeschütz bleibt schwach (Spezialist gegen Energiehüllen); Schlachtkreuzer Glaskanone mit mehr Angriff als Schlachtschiff; Zerstörer ≈ Kreuzer im Angriff.
- **ANNAHME:** Verteidigungs-id `magnetkanone` bleibt (Anzeige „Railgun-Turm“) für Spielstand-Kompatibilität.
