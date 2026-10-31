
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
