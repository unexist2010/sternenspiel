/*
 * Sternenspiel – Schiffe, Hüllentypen, Waffentypen (Kapitel 4 „Werft“). ALLE Schiffswerte zentral hier.
 *
 * FEST (Sandro): 24 Schiffe (23 + Bodensammler + Großer Frachter − Orbitalplattform→Verteidigung 0.12.0), 6 Waffentypen (0.17.0), 2 Hüllentypen; Solarsatelliten werden in der Werft gebaut.
 * ANNAHME (Vorschlag, Sandro prüft – OFFENE-PUNKTE Frage 16): ALLE Namen, Kosten, Kampfwerte, Tempo, Verbrauch,
 *   Ladung, Voraussetzungen, Waffenanteile, Hüllenzuordnung (kein Schnellfeuer). Orientierung OGame-Retro
 *   (Metall/Kristall/Deuterium → Metall/Silizium/Rohöl), Kunststoff nur bei schweren Schiffen / Verbundpanzer.
 *
 * Felder je Schiff:
 *  gruppe       zivil | kampf | spezial
 *  kosten       Kosten je Einheit
 *  antrieb      verbrennung | impuls | hyperraumantrieb | null (kein Antrieb: Solarsatellit, Orbitalplattform)
 *  huelle       leichtmetall | verbund
 *  waffen       { waffentyp: Anteil } – Summe 1 (oder leer = unbewaffnet)
 *  angriff     Grundwert je Einheit (ohne Forschung)
 *  schild      = ENERGIEHÜLLE je Einheit (0.12.0: Feldname bleibt für alte Saves/Tests; 0 = reine Metallhülle)
 *  Metallhülle = Hüllenpunkte (unten)
 *  Hüllenpunkte  = (Metall + Silizium) / 10 × Hüllenfaktor (berechnet, OGame: Strukturpunkte / 10)
 *  tempo        Grundgeschwindigkeit · verbrauch = Rohöl je Flug (Grundwert) · ladung = Ladekapazität
 *  transporter  true → Komprimierungsforschung erhöht die Ladung zusätzlich
 *  vor          { werft: Stufe, forschung: [{ id, stufe }] } – ALLE nötig (UND)
 *  flag         nur sichtbar, wenn zustand.freigeschaltet[flag] (Master zeigt alles)
 *  stationaer   kann nicht fliegen (zählt nicht für Starts)
 */
(function (g) {
  "use strict";
  var SS = (g.SS = g.SS || {});
  SS.DATEN = SS.DATEN || {};

  SS.DATEN.SCHIFFE_ANZAHL_SOLL = 24;      // FEST: 23 (Sandro) + Bodensammler + Großer Frachter (0.11.4) − Orbitalverteidigungsplattform (0.12.0 → Verteidigung)
  SS.DATEN.WAFFENTYPEN_ANZAHL_SOLL = 6;   // FEST 0.17.0 (Sandro t47u): MG, Raketen, Laser, Ionen, Plasma, Railgun – Graviton weg
  SS.DATEN.HUELLENTYPEN_ANZAHL_SOLL = 2;  // FEST

  // 6 Waffentypen (0.17.0, Sandro t47u: Rollen FEST; Zahlen aus der Papier-Balance docs/BALANCE-WAFFEN.md). profil = Schadensfaktor gegen { energie: Energiehülle, metall: Metallhülle }.
  // Beide Hüllen werden gleichzeitig getroffen. Nach Zusammenbruch der Energiehülle: Waffen mit metall ≥ KAMPF.BONUS_SCHWELLE
  // bekommen ×KAMPF.BONUS_NACH_ENERGIE auf die Metallhülle, reine Energiewaffen ×KAMPF.MALUS_NACH_ENERGIE (siehe js/kern/kampf.js).
  // forschung = Typ-Forschung (+% Schaden); Waffen-Technologie wirkt auf alle. Maschinengewehr/Railgun/Raketen: nur Waffen-Technologie (ANNAHME).
  SS.DATEN.waffentypen = Object.freeze([
    { id: "gatling", name: "Maschinengewehr", forschung: null, farbe: "#d9c27a", profil: { energie: 0.3, metall: 0.9 }, rolle: "Viele Kugeln – stark gegen Metall, schwach gegen Energie (früh, große Nebenwaffe)" },
    { id: "raketen", name: "Raketen", forschung: null, farbe: "#ffb347", profil: { energie: 0.2, metall: 1.1 }, rolle: "Ballistisch – stark gegen Metall, schwach gegen Energie" },
    { id: "laser", name: "Laser", forschung: "laser", farbe: "#ff5b5b", profil: { energie: 1.0, metall: 0.45 }, rolle: "Stark gegen Energie, teils gegen Metall" },
    { id: "ionen", name: "Ionen", forschung: "ionen", farbe: "#3fb8ff", profil: { energie: 1.5, metall: 0.25 }, rolle: "Sehr stark gegen Energie, schwach gegen Metall" },
    { id: "plasma", name: "Plasma", forschung: "plasma", farbe: "#c58cf0", profil: { energie: 1.0, metall: 1.0 }, rolle: "Groß und ausgewogen – Energie ≈ Metall" },
    { id: "railgun", name: "Railgun", forschung: null, farbe: "#8fd3c9", profil: { energie: 0, metall: 1.0 }, ignoriertEnergie: true, rolle: "Einzelschuss – ignoriert die Energiehülle, stark gegen Metall" }
  ].map(function (w) { Object.freeze(w.profil); return Object.freeze(w); }));

  // 2 Hüllentypen (Anzahl FEST, Werte ANNAHME)
  SS.DATEN.huellentypen = Object.freeze([
    { id: "leichtmetall", name: "Leichtmetall", faktor: 1, beschreibung: "Standardhülle – günstig, weniger Struktur." },
    { id: "verbund", name: "Verbundpanzer", faktor: 1.25, beschreibung: "Schwere Hülle aus Metall und Kunststoff – teurer (Kunststoff nötig), ×1,25 Struktur." }
  ].map(Object.freeze));

  SS.DATEN.schiffGruppen = Object.freeze([
    { id: "kampf", name: "Kampfschiffe" },
    { id: "hilf", name: "Hilfsschiffe" },
    { id: "spezial", name: "Spezial" }
  ].map(Object.freeze));

  var V = function (id, st) { return { id: id, stufe: st }; };
  var L = [
    // ---------- Kampfschiffe 1–14 (Namen + Reihenfolge schwach → stark: FEST, Sandro) ----------
    { id: "aufklaerer", name: "Aufklärer", gruppe: "kampf", kosten: { metall: 1500, silizium: 150, rohoel: 500 },
      antrieb: "verbrennung", huelle: "leichtmetall", waffen: { gatling: 1 }, angriff: 15, schild: 0, tempo: 22500, verbrauch: 10, ladung: 100,
      vor: { werft: 1, forschung: [V("verbrennung", 2), V("spionage", 1)] },
      beschreibung: "Schneller, leicht bewaffneter Späher.",
      info: "Schwächstes Kampfschiff. Anders als die Spionagesonde kann er kämpfen; Flottensicht im Nachbarsystem folgt im Flotten-Kapitel." },
    { id: "kleine_drohne", name: "Kleine Drohne", gruppe: "kampf", kosten: { metall: 2500, silizium: 500 },
      antrieb: "verbrennung", huelle: "leichtmetall", waffen: { gatling: 0.7, raketen: 0.3 }, angriff: 60, schild: 0, tempo: 17500, verbrauch: 15, ladung: 50,
      vor: { werft: 1, forschung: [V("verbrennung", 1), V("computer", 1)] },
      beschreibung: "Billiges Massenschiff – metalllastig.",
      info: "Einzeln schwach, in Masse stark. Kann im Träger mitfliegen." },
    { id: "mittlere_drohne", name: "Mittlere Drohne", gruppe: "kampf", kosten: { metall: 5000, silizium: 1000, rohoel: 200 },
      antrieb: "verbrennung", huelle: "leichtmetall", waffen: { gatling: 0.5, raketen: 0.5 }, angriff: 120, schild: 0, tempo: 16250, verbrauch: 25, ladung: 80,
      vor: { werft: 2, forschung: [V("verbrennung", 3), V("computer", 2), V("laser", 2)] },
      beschreibung: "Kern des Drohnenschwarms.",
      info: "Metalllastig (Maschinengewehr + Raketen), keine Energiehülle. Kann im Träger mitfliegen." },
    { id: "schwere_drohne", name: "Schwere Drohne", gruppe: "kampf", kosten: { metall: 9000, silizium: 2000, rohoel: 500 },
      antrieb: "impuls", huelle: "leichtmetall", waffen: { raketen: 0.6, gatling: 0.4 }, angriff: 200, schild: 100, tempo: 13750, verbrauch: 40, ladung: 120,
      vor: { werft: 3, forschung: [V("impuls", 2), V("computer", 3), V("panzerung", 2)] },
      beschreibung: "Gepanzerte Drohne mit Impulstriebwerk.",
      info: "Metalllastig; erstes Drohnen-Modell mit Impulstriebwerk. Kann im Träger mitfliegen." },
    { id: "korvette", name: "Korvette", gruppe: "kampf", kosten: { metall: 10000, silizium: 5000, rohoel: 1000 },
      antrieb: "impuls", huelle: "leichtmetall", waffen: { gatling: 0.5, laser: 0.5 }, angriff: 380, schild: 300, tempo: 15000, verbrauch: 60, ladung: 300,
      vor: { werft: 3, forschung: [V("impuls", 2), V("ionen", 1)] },
      beschreibung: "Leichte Eskorte gegen Jäger und Drohnen.",
      info: "Erstes ausgewogenes Kriegsschiff." },
    { id: "fregatte", name: "Fregatte", gruppe: "kampf", kosten: { metall: 16000, silizium: 8000, rohoel: 2000 },
      antrieb: "impuls", huelle: "leichtmetall", waffen: { railgun: 0.5, laser: 0.5 }, angriff: 480, schild: 500, tempo: 13125, verbrauch: 90, ladung: 500,
      vor: { werft: 4, forschung: [V("impuls", 3), V("ionen", 2), V("schild", 2)] },
      beschreibung: "Allrounder der Mittelklasse.",
      info: "Solide Werte in allen Bereichen." },
    { id: "zerstoerer", name: "Zerstörer", gruppe: "kampf", kosten: { metall: 22000, silizium: 10000, rohoel: 3000 },
      antrieb: "impuls", huelle: "leichtmetall", waffen: { gatling: 0.6, laser: 0.4 }, angriff: 750, schild: 700, tempo: 12500, verbrauch: 120, ladung: 800,
      vor: { werft: 5, forschung: [V("impuls", 4), V("ionen", 3), V("waffen", 3)] },
      beschreibung: "Jäger- und Drohnen-Killer.",
      info: "Großes Maschinengewehr + Laser – Konter gegen Drohnenschwärme." },
    { id: "kreuzer", name: "Kreuzer", gruppe: "kampf", kosten: { metall: 30000, silizium: 15000, rohoel: 5000 },
      antrieb: "hyperraumantrieb", huelle: "leichtmetall", waffen: { ionen: 0.5, railgun: 0.5 }, angriff: 1000, schild: 1100, tempo: 11875, verbrauch: 200, ladung: 1500,
      vor: { werft: 6, forschung: [V("hyperraumantrieb", 2), V("ionen", 4), V("plasma", 1)] },
      beschreibung: "Linienschiff mit erstem Hyperraumantrieb.",
      info: "Ionen gegen Energiehüllen, Railgun durch sie hindurch." },
    { id: "bomber", name: "Bomber", gruppe: "kampf", kosten: { metall: 40000, silizium: 25000, rohoel: 10000, kunststoff_t2: 3000 },
      antrieb: "impuls", huelle: "verbund", waffen: { plasma: 0.6, raketen: 0.4 }, angriff: 1000, schild: 1600, tempo: 7500, verbrauch: 300, ladung: 500,
      vor: { werft: 7, forschung: [V("impuls", 6), V("plasma", 5)] },
      beschreibung: "Langsamer Plasmabomber – hoher Kunststoff-T2-Anteil.",
      info: "Stark gegen Planeten- und Orbitalverteidigung (Wirkung im Verteidigungs-/Kampf-Kapitel)." },
    { id: "schlachtkreuzer", name: "Schlachtkreuzer", gruppe: "kampf", kosten: { metall: 45000, silizium: 40000, rohoel: 12000, kunststoff_t1: 300 },
      antrieb: "hyperraumantrieb", huelle: "verbund", waffen: { laser: 0.6, railgun: 0.4 }, angriff: 1500, schild: 3000, tempo: 12500, verbrauch: 250, ladung: 750,
      vor: { werft: 8, forschung: [V("hyperraumantrieb", 5), V("hyperspace", 5), V("laser", 10)] },
      beschreibung: "Schneller Schwergewichtler.",
      info: "Schnell und stark, aber teuer." },
    { id: "schlachtschiff", name: "Schlachtschiff", gruppe: "kampf", kosten: { metall: 60000, silizium: 30000, rohoel: 15000, kunststoff_t1: 500 },
      antrieb: "hyperraumantrieb", huelle: "verbund", waffen: { plasma: 0.5, railgun: 0.5 }, angriff: 1300, schild: 3000, tempo: 10625, verbrauch: 400, ladung: 1500,
      vor: { werft: 9, forschung: [V("hyperraumantrieb", 6), V("plasma", 6), V("panzerung", 6)] },
      beschreibung: "Rückgrat der Flotte.",
      info: "Höchste Linien-Kampfkraft." },
    { id: "traeger", name: "Träger", gruppe: "kampf", kosten: { metall: 40000, silizium: 80000, rohoel: 20000, kunststoff_t2: 1000 },
      antrieb: "hyperraumantrieb", huelle: "verbund", waffen: { raketen: 0.6, laser: 0.4 }, angriff: 600, schild: 4500, tempo: 8750, verbrauch: 600, ladung: 20000, hangar: { plaetze: 50, schiffe: ["kleine_drohne", "mittlere_drohne", "schwere_drohne"] },
      vor: { werft: 10, forschung: [V("hyperraumantrieb", 7), V("computer", 8), V("astrophysik", 4)] },
      beschreibung: "Siliziumlastiger Drohnenträger.",
      info: "Hangar für bis zu 50 Drohnen (Kleine/Mittlere/Schwere Drohne, Wirkung im Flotten-Kapitel). Schwache Eigenbewaffnung." },
    { id: "koloss", name: "Koloss", gruppe: "kampf", kosten: { metall: 400000, silizium: 250000, rohoel: 100000, kunststoff_t2: 5000 },
      antrieb: "hyperraumantrieb", huelle: "verbund", waffen: { plasma: 0.6, ionen: 0.4 }, angriff: 8000, schild: 20000, tempo: 5000, verbrauch: 1500, ladung: 10000,
      vor: { werft: 11, forschung: [V("hyperraumantrieb", 8), V("plasma", 9), V("panzerung", 10)] },
      beschreibung: "Belagerungsschiff – Plasma und Ionen.",
      info: "Vorstufe zum Titan." },
    { id: "titan", name: "Titan", gruppe: "kampf", kosten: { metall: 2000000, silizium: 4000000, rohoel: 1000000, kunststoff_t3: 20000 },
      antrieb: "hyperraumantrieb", huelle: "verbund", waffen: { plasma: 0.6, railgun: 0.3, gatling: 0.1 }, angriff: 60000, schild: 200000, tempo: 1250, verbrauch: 5000, ladung: 1000000,
      vor: { werft: 12, forschung: [V("hyperraumantrieb", 10), V("emp", 1), V("netzwerk", 1)] },
      emp: true,
      beschreibung: "Endgame-Flaggschiff – teuer, sehr langsam, einziges Schiff mit EMP.",
      info: "EMP (0.17.0): Zu Beginn jeder Kampfphase setzt jeder Titan die Energiehüllen gegnerischer Einheiten auf 0 – je EMP-Stufe bis 25 Einheiten mit Energiehülle ≤ 1.000 × Stufe (größte zuerst). Railgun ignoriert Energiehüllen." },
    // ---------- Hilfsschiffe (Namen + Ladung 15–18: FEST, Sandro; Bodensammler: von Sandro ergänzt) ----------
    { id: "kleiner_frachter", name: "Kleiner Frachter", gruppe: "hilf", kosten: { metall: 2000, silizium: 2000 },
      antrieb: "verbrennung", huelle: "leichtmetall", waffen: {  }, angriff: 5, schild: 0, tempo: 12500, verbrauch: 10, ladung: 5000, transporter: true,
      vor: { werft: 2, forschung: [V("verbrennung", 2)] },
      beschreibung: "Früher Transport – 5.000 Ladung.",
      info: "Wechselt ab Impulstriebwerk 5 auf Impuls (Flotten-Kapitel)." },
    { id: "mittlerer_frachter", name: "Mittlerer Frachter", gruppe: "hilf", kosten: { metall: 8000, silizium: 8000, rohoel: 1000 },
      antrieb: "impuls", huelle: "leichtmetall", waffen: {  }, angriff: 5, schild: 25, tempo: 9375, verbrauch: 50, ladung: 50000, transporter: true,
      vor: { werft: 4, forschung: [V("impuls", 3), V("komprimierung", 2)] },
      beschreibung: "Haupt-Transporter – 50.000 Ladung.",
      info: "Zehnfache Ladung des kleinen Frachters." },
    // 0.11.4 (Sandro): neuer Großer Frachter (250.000). Kosten/Tempo/Verbrauch/Werft = ANNAHME, gestaffelt zwischen Mittel und Massengut.
    { id: "grosser_frachter", name: "Großer Frachter", gruppe: "hilf", kosten: { metall: 25000, silizium: 20000, rohoel: 4000 },
      antrieb: "impuls", huelle: "leichtmetall", waffen: {  }, angriff: 5, schild: 50, tempo: 7500, verbrauch: 150, ladung: 250000, transporter: true,
      vor: { werft: 6, forschung: [V("impuls", 5), V("komprimierung", 4)] },
      beschreibung: "Großtransport – 250.000 Ladung.",
      info: "Fünffache Ladung des mittleren Frachters; Kosten/Tempo ANNAHME (0.11.4)." },
    // 0.11.4 (Sandro): Massengutfrachter 1.000.000 Ladung (ID unverändert, alte Saves behalten Bestand). Kosten = ANNAHME (Endgame).
    { id: "massengutfrachter", name: "Massengutfrachter", gruppe: "hilf", kosten: { metall: 120000, silizium: 90000, rohoel: 30000, kunststoff_t1: 2000 },
      antrieb: "hyperraumantrieb", huelle: "verbund", waffen: {  }, angriff: 5, schild: 150, tempo: 5000, verbrauch: 500, ladung: 1000000, transporter: true,
      vor: { werft: 8, forschung: [V("hyperraumantrieb", 4), V("komprimierung", 7)] },
      beschreibung: "Endgame-Transporter – 1.000.000 Ladung, effizientester Frachter je Rohöl.",
      info: "Kunststoff für die Großtanks. Reiner Transporter – trägt mehr pro Verbrauch als jedes andere Schiff (Titan nur nebenbei)." },
    { id: "wracksammler", name: "Wracksammler", gruppe: "hilf", kosten: { metall: 10000, silizium: 6000, rohoel: 2000 },
      antrieb: "verbrennung", huelle: "leichtmetall", waffen: {  }, angriff: 1, schild: 10, tempo: 6250, verbrauch: 300, ladung: 100000, ladungArt: "orbit",
      vor: { werft: 4, forschung: [V("verbrennung", 6), V("schild", 2)] },
      beschreibung: "Sammelt Trümmerfelder im Orbit – 100.000 Ladung.",
      info: "Nur Orbit-Schrott aus Schiffskämpfen. Sammeln folgt im Kampf-Kapitel." },
    { id: "bodensammler", name: "Bodensammler", gruppe: "hilf", kosten: { metall: 12000, silizium: 8000, rohoel: 3000 },
      antrieb: "impuls", huelle: "leichtmetall", waffen: {  }, angriff: 1, schild: 20, tempo: 5000, verbrauch: 400, ladung: 75000, ladungArt: "boden",
      vor: { werft: 5, forschung: [V("impuls", 3), V("schild", 3), V("spionage", 2)] },
      beschreibung: "Sammelt Verteidigungs-Schrott am Boden.",
      info: "Erkennt die Rohstoffzusammensetzung erst beim Sammeln; Sammeldauer in Stunden je Schrottfeldgröße (Kampf-Kapitel). Ladung 75.000 (ANNAHME)." },
    // ---------- Spezial 21–25 (Ergänzungen, ANNAHME) ----------
    { id: "solarsatellit", name: "Solarsatellit", gruppe: "spezial", kosten: { silizium: 2000, rohoel: 500 },
      antrieb: null, huelle: "leichtmetall", waffen: {  }, angriff: 1, schild: 0, tempo: 0, verbrauch: 0, ladung: 0, stationaer: true,
      vor: { werft: 1, forschung: [V("energie", 1)] },
      beschreibung: "Liefert Strom aus dem Orbit.",
      info: "Jeder Satellit erhöht den Strom des Planeten (× Energie-Technologie). Fliegt nicht; wird im Kampf leicht zerstört." },
    { id: "spionagesonde", name: "Spionagesonde", gruppe: "spezial", kosten: { silizium: 1000 },
      antrieb: "verbrennung", huelle: "leichtmetall", waffen: {  }, angriff: 0, schild: 0, tempo: 100000000, verbrauch: 1, ladung: 5, // 0.16.2 (Sandro t44u): OGame-Tempo, Flüge in Sekunden
      vor: { werft: 3, forschung: [V("verbrennung", 3), V("spionage", 2)] },
      beschreibung: "Extrem schnelle Sonde für Spionageberichte.",
      info: "Kein Schild, kaum Hülle – wird im Kampf meist zerstört. Kontert die Orbitalverteidigungsplattform nur mit hoher Spionage." },
    { id: "kolonieschiff", name: "Kolonieschiff", gruppe: "spezial", kosten: { metall: 10000, silizium: 20000, rohoel: 10000 },
      antrieb: "impuls", huelle: "leichtmetall", waffen: {  }, angriff: 50, schild: 100, tempo: 3125, verbrauch: 1000, ladung: 7500,
      vor: { werft: 4, forschung: [V("impuls", 3), V("astrophysik", 1)] },
      beschreibung: "Gründet eine Kolonie – wird dabei verbraucht.",
      info: "Besiedeln folgt im Flotten-/Weltraum-Kapitel." },
    { id: "treibstofftanker", name: "Treibstofftanker", gruppe: "spezial", kosten: { metall: 6000, silizium: 4000, rohoel: 2000 },
      antrieb: "impuls", huelle: "leichtmetall", waffen: {  }, angriff: 1, schild: 20, tempo: 10000, verbrauch: 20, ladung: 30000, ladungArt: "rohoel",
      vor: { werft: 4, forschung: [V("impuls", 2), V("komprimierung", 1)] },
      beschreibung: "Versorgt Flotten unterwegs mit Rohöl.",
      info: "Nur Rohöl als Ladung; mehr Reichweite (Flotten-Kapitel)." }
  ];
  // 0.11.2/0.11.3: von Sandro freigegebene Bilder (PNG, 400×400); alle übrigen bleiben SVG-Platzhalter
  var PNG_FREIGEGEBEN = { aufklaerer: 1, kleine_drohne: 1, mittlere_drohne: 1, schwere_drohne: 1, korvette: 1, fregatte: 1, zerstoerer: 1,
    kreuzer: 1, schlachtkreuzer: 1, schlachtschiff: 1, traeger: 1, koloss: 1, mittlerer_frachter: 1, wracksammler: 1,
    spionagesonde: 1, kolonieschiff: 1, treibstofftanker: 1,
    titan: 1, kleiner_frachter: 1, bodensammler: 1, solarsatellit: 1,
    bomber: 1, // 0.11.3: Bomber G
    grosser_frachter: 1, massengutfrachter: 1 }; // 0.11.4: Massengutfrachter H → Großer Frachter, G → Massengutfrachter
  SS.DATEN.schiffPngFreigegeben = Object.freeze(Object.keys(PNG_FREIGEGEBEN));
  L.forEach(function (s) {
    s.bild = "assets/schiffe/" + s.id + (PNG_FREIGEGEBEN[s.id] ? ".png" : ".svg");
    Object.freeze(s.kosten); Object.freeze(s.waffen); Object.freeze(s.vor.forschung); Object.freeze(s.vor); if (s.waffenslots) Object.freeze(s.waffenslots); if (s.hangar) Object.freeze(s.hangar); Object.freeze(s);
  });
  // 0.11.3: Orbitalverteidigungsplattform zeigt je nach Anzahl am Planeten eines von 6 Stufenbildern
  // (assets/schiffe/orbitalverteidigungsplattform-1..6.png). Schwellen = Mindestanzahl je Stufe:
  // Stufe 1: 0–1 · Stufe 2: 2–3 · Stufe 3: 4–6 · Stufe 4: 7–10 · Stufe 5: 11–20 · Stufe 6: 21+
  // Ohne Anzahl (undefined/null) bleibt s.bild = SVG-Fallback.
  var STUFEN_BILDER = { orbitalverteidigungsplattform: [0, 2, 4, 7, 11, 21] };
  SS.DATEN.schiffBildStufenSchwellen = Object.freeze({ orbitalverteidigungsplattform: Object.freeze(STUFEN_BILDER.orbitalverteidigungsplattform.slice()) });
  SS.DATEN.schiffBildStufe = function (id, anzahl) {
    var sw = STUFEN_BILDER[id]; if (!sw || typeof anzahl !== "number" || !isFinite(anzahl)) return 0;
    var st = 1; for (var i = 0; i < sw.length; i++) if (anzahl >= sw[i]) st = i + 1; return st;
  };
  SS.DATEN.schiffBild = function (s, anzahl) {
    var st = SS.DATEN.schiffBildStufe(s.id, anzahl);
    return st ? "assets/schiffe/" + s.id + "-" + st + ".png" : s.bild;
  };
  SS.DATEN.schiffe = Object.freeze(L);
  SS.DATEN.schiffIds = Object.freeze(L.map(function (s) { return s.id; }));
  // 0.10.0: alte Schiff-IDs aus 0.9.0 → neue (1:1-Nachfolger); nicht aufgeführte alte IDs werden verworfen
  SS.DATEN.schiffUmbenennung = Object.freeze({ kleiner_transporter: "kleiner_frachter", grosser_transporter: "mittlerer_frachter",
    kolonisationsschiff: "kolonieschiff", recycler: "wracksammler", orbitalplattform: "orbitalverteidigungsplattform" });
  SS.DATEN.schiffNachId = function (id) { for (var i = 0; i < L.length; i++) if (L[i].id === id) return L[i]; return null; };
  SS.DATEN.waffentypNachId = function (id) { return SS.DATEN.waffentypen.filter(function (w) { return w.id === id; })[0] || null; };
  SS.DATEN.huellentypNachId = function (id) { return SS.DATEN.huellentypen.filter(function (h) { return h.id === id; })[0] || null; };
})(typeof globalThis !== "undefined" ? globalThis : this);
