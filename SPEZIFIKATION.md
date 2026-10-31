
## Testphase (0.14.1, ANNAHME)
`legeTestphaseAn` erzeugt einen Testspielstand mit Gegnern Alpha/Beta (`z.gegner`). Spionage zeigt Schiffe/Verteidigung; Angriff nutzt den Kampfkern (Phase 1/2) mit Verlusten, Trümmerfeld und Heimflug. Kein Beute-/KI-System.

## Zivilschiffe + Trümmer bergen (0.14.2, Sandro t33u)
**FEST:**
- Zivilschiffe = alle Schiffe mit `gruppe !== "kampf"` (Frachter, Wracksammler, Bodensammler, Spionagesonden, Kolonieschiff, Treibstofftanker, Solarsatelliten). Sie kämpfen nie und sind keine Ziele („fliegen hinten in der Formation“).
- Solange noch eigene Kampfschiffe leben: keine Zivil-Verluste. Angriff total verloren (0 angreifende Kampfschiffe übrig) → alle Zivilschiffe der Angriffsflotte vernichtet.
- Orbit-Trümmer (Schiffe) → Wracksammler. Boden-Schrott (Verteidigung) gehört immer dem Planetenbesitzer (Bodensammler) – der Angreifer kann ihn nie sammeln.
- Angriff mit Wracksammlern + Sieg (`sieger === "angreifer"`): nach Phase 2 automatische Bergung der Orbit-Trümmer (`bericht.geborgen`), Gutschrift bei Rückkehr.
- Ohne Wracksammler bleiben die Orbit-Trümmer am Ziel; neue Mission **„Trümmer bergen“** (`sammeln`, braucht Wracksammler) holt sie später.

**ANNAHME:**
- Verteidiger-Zivil (Startplätze + Solarsatelliten): kämpft nicht; vernichtet, wenn nach Phase 1 keine Verteidiger-Orbit-Kampfeinheit mehr steht und der Angreifer noch Kampfschiffe hat. Hangar bleibt geschützt (FEST t34u).
- Sieger-Wertung zählt nur Kampfschiffe/Verteidigung.
- Bergung nimmt das gesamte Orbit-Feld am Ziel (nicht nur „dieses Kampfes“), bis Kapazität = 100.000 × Wracksammler (Feld `ladung`), Metall vor Silizium. Gutschrift in `z.rohstoffe` bei Rückkehr.

## Hangar-Schutz + Spionage (0.14.3, Sandro t34u – FEST)

- Verteidiger-Zivilschiffe werden bei verlorenem Orbit nur vernichtet, wenn sie zur Kampf-Flotte gehören (auf den Startplätzen, `verteilung.startplatz`). Zivilschiffe im Hangar werden nie vernichtet. Solarsatelliten stehen im Orbit und fallen mit ihm.
- Spionagebericht: sichtbar sind Schiffe auf den Startplätzen (Preset-/Kapazitätslogik wie im Kampf), Verteidigung, Solarsatelliten, Trümmer. Welche/wie viele Schiffe im Hangar stehen, ist nie sichtbar. Nur Hinweis: „Bodenbewegungen erkennbar – möglicherweise weitere Schiffe im Hangar.“ (Hangar nicht leer) bzw. „Keine Bodenbewegungen erkennbar.“ (Hangar leer). Feld `bodenbewegungen` (bool) + `hinweis`.

## Weltraum-Ansicht (0.16.0, Sandro pt40u)

- Begriffe (FEST): Universum → **Sektor** → **Sonnensystem** → **Planet**. „Galaxie“ wird in der UI nicht verwendet.
- Je Sonnensystem 12 Planeten (Positionen 1–12) + Position 13 = Expeditionsraum.
- Datenmodell (unverändert): 5 Sektoren, 300 Sonnensysteme gesamt (60 je Sektor), deterministisch erzeugt, nicht gespeichert. Ansicht: Fenster mit 5 Sonnensystemen (`SS.ui.weltraum.SICHTBAR`) + Navigation per Nummer (wie OGame Galaxie:System).
- Zeile je Position: Planetname bzw. „– frei –“, Koordinaten, Spieler. Knöpfe: fremder Planet → Spionage, Angriff, Transport; eigener Planet → Transport, Stationieren; frei → Kolonisieren; Position 13 → Expedition.
- Alle Knöpfe öffnen das Flottenfenster per `#flotte/senden/<mission>/<S:SYS:P>` mit Mission + Koordinaten vorausgefüllt; Schiffe wählt der Nutzer.
- Ausnahme Spionage (wie OGame): 1 Spionagesonde wird sofort gesendet; ohne Sonde → Flottenfenster mit Hinweis (`/keine-sonde`).

## 0.21.1 – Start-Besiedlung, Rivalen-Verteilung (Sandro pt62u, FEST)
- Spielstart: sofort erste Siedler (4) und ein paar Piraten (2) rund um das Heimatsystem (1:50).
- Rivalen: genau 5, keine neuen; über den ganzen Sektor 1 verteilt, nur 1–2 im Umkreis ≤ 6 Systeme um den Spieler.
- Pro Spieltag kommen nur Siedler und Piraten langsam dazu.

## 0.21.0 – Start, KI-Verteilung, Rangliste (Sandro pt61u, FEST)
- Neue Spieler: Heimat 1:50:(zufällig 1–12).
- KI füllt sich rund um das Heimatsystem auf (auf- und abwärts), nahe zuerst; nahe KI wächst mit dem Spieler, ferne eher schwächer, aber durchmischt.
- Rangliste (Gesamt/Gebäude/Forschung/Flotte/Verteidigung) mit Spieler, KI, Alpha/Beta; Klick → #weltraum/system/N.

## Warteschlangen (0.22.0, Sandro pt65u – FEST)
- Gebäude/Startplätze: 10 Warteplätze je Planet, Forschung: 5 Warteplätze. Einreihen ohne Rohstoffe erlaubt; Start (FIFO) erst, wenn die Rohstoffe reichen.
- Startplatz-Kosten ×2 (Grund A1: 800 M / 400 Si / 200 Öl), Bauzeit unverändert (Teiler 22).
