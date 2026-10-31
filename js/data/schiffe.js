/*
 * Sternenspiel – Schiffe, Hüllentypen, Waffentypen (Kapitel 4 „Werft“). ALLE Schiffswerte zentral hier.
 *
 * FEST (Sandro): 24 Schiffe (23 + Bodensammler), Namen 1–18, 5 Waffentypen, 2 Hüllentypen; Solarsatelliten werden in der Werft gebaut.
 * ANNAHME (Vorschlag, Sandro prüft – OFFENE-PUNKTE Frage 16): ALLE Namen, Kosten, Kampfwerte, Tempo, Verbrauch,
 *   Ladung, Voraussetzungen, Waffenanteile, Hüllenzuordnung und die Schnellfeuer-Matrix. Orientierung OGame-Retro
 *   (Metall/Kristall/Deuterium → Metall/Silizium/Rohöl), Kunststoff nur bei schweren Schiffen / Verbundpanzer.
 *
 * Felder je Schiff:
 *  gruppe       zivil | kampf | spezial
 *  kosten       Kosten je Einheit
 *  antrieb      verbrennung | impuls | hyperraumantrieb | null (kein Antrieb: Solarsatellit, Orbitalplattform)
 *  huelle       leichtmetall | verbund
 *  waffen       { waffentyp: Anteil } – Summe 1 (oder leer = unbewaffnet)
 *  angriff, schild   Grundwerte je Einheit (ohne Forschung)
 *  Hüllenpunkte  = (Metall + Silizium) / 10 × Hüllenfaktor (berechnet, OGame: Strukturpunkte / 10)
 *  tempo        Grundgeschwindigkeit · verbrauch = Rohöl je Flug (Grundwert) · ladung = Ladekapazität
 *  transporter  true → Komprimierungsforschung erhöht die Ladung zusätzlich
 *  vor          { werft: Stufe, forschung: [{ id, stufe }] } – ALLE nötig (UND)
 *  schnellfeuer { zielId: n } – feuert im Schnitt n-mal gegen dieses Ziel (Kampf-Kapitel, hier nur Daten/Anzeige)
 *  flag         nur sichtbar, wenn zustand.freigeschaltet[flag] (Master zeigt alles)
 *  stationaer   kann nicht fliegen (zählt nicht für Starts)
 */
(function (g) {
  "use strict";
  var SS = (g.SS = g.SS || {});
  SS.DATEN = SS.DATEN || {};

  SS.DATEN.SCHIFFE_ANZAHL_SOLL = 24;      // FEST: 23 (Sandro) + Bodensammler (von Sandro ergänzt, 2026-10-30)
  SS.DATEN.WAFFENTYPEN_ANZAHL_SOLL = 5;   // FEST
  SS.DATEN.HUELLENTYPEN_ANZAHL_SOLL = 2;  // FEST

  // 5 Waffentypen (Anzahl FEST, Zuordnung ANNAHME). forschung = Typ-Forschung (+% Schaden); Waffen-Technologie wirkt auf alle.
  SS.DATEN.waffentypen = Object.freeze([
    { id: "laser", name: "Laser", forschung: "laser", farbe: "#ff5b5b" },
    { id: "ionen", name: "Ionen", forschung: "ionen", farbe: "#3fb8ff" },
    { id: "plasma", name: "Plasma", forschung: "plasma", farbe: "#c58cf0" },
    { id: "raketen", name: "Raketen", forschung: null, farbe: "#ffb347" },
    { id: "graviton", name: "Graviton", forschung: "graviton", farbe: "#e9b8ff" }
  ].map(Object.freeze));

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
    { id: "aufklaerer", name: "Aufklärer", gruppe: "kampf", kosten: { metall: 1500, silizium: 1500, rohoel: 500 },
      antrieb: "verbrennung", huelle: "leichtmetall", waffen: { laser: 1 }, angriff: 10, schild: 10, tempo: 22500, verbrauch: 10, ladung: 100,
      vor: { werft: 1, forschung: [V("verbrennung", 2), V("spionage", 1)] }, schnellfeuer: { spionagesonde: 5, solarsatellit: 5 },
      beschreibung: "Schneller, leicht bewaffneter Späher.",
      info: "Schwächstes Kampfschiff. Anders als die Spionagesonde kann er kämpfen; Flottensicht im Nachbarsystem folgt im Flotten-Kapitel." },
    { id: "kleine_drohne", name: "Kleine Drohne", gruppe: "kampf", kosten: { metall: 2500, silizium: 500 },
      antrieb: "verbrennung", huelle: "leichtmetall", waffen: { laser: 1 }, angriff: 40, schild: 5, tempo: 17500, verbrauch: 15, ladung: 50,
      vor: { werft: 1, forschung: [V("verbrennung", 1), V("computer", 1)] }, schnellfeuer: { spionagesonde: 5, solarsatellit: 5 },
      beschreibung: "Billiges Massenschiff – metalllastig.",
      info: "Einzeln schwach, in Masse stark. Kann im Träger mitfliegen." },
    { id: "mittlere_drohne", name: "Mittlere Drohne", gruppe: "kampf", kosten: { metall: 5000, silizium: 1000, rohoel: 200 },
      antrieb: "verbrennung", huelle: "leichtmetall", waffen: { laser: 0.7, raketen: 0.3 }, angriff: 80, schild: 15, tempo: 16250, verbrauch: 25, ladung: 80,
      vor: { werft: 2, forschung: [V("verbrennung", 3), V("computer", 2), V("laser", 2)] }, schnellfeuer: { spionagesonde: 5, solarsatellit: 5 },
      beschreibung: "Kern des Drohnenschwarms.",
      info: "Metalllastig, Laser mit Raketen. Kann im Träger mitfliegen." },
    { id: "schwere_drohne", name: "Schwere Drohne", gruppe: "kampf", kosten: { metall: 9000, silizium: 2000, rohoel: 500 },
      antrieb: "impuls", huelle: "leichtmetall", waffen: { laser: 0.5, raketen: 0.5 }, angriff: 150, schild: 30, tempo: 13750, verbrauch: 40, ladung: 120,
      vor: { werft: 3, forschung: [V("impuls", 2), V("computer", 3), V("panzerung", 2)] }, schnellfeuer: { spionagesonde: 5, solarsatellit: 5 },
      beschreibung: "Gepanzerte Drohne mit Impulstriebwerk.",
      info: "Metalllastig; erstes Drohnen-Modell mit Impulstriebwerk. Kann im Träger mitfliegen." },
    { id: "korvette", name: "Korvette", gruppe: "kampf", kosten: { metall: 10000, silizium: 5000, rohoel: 1000 },
      antrieb: "impuls", huelle: "leichtmetall", waffen: { ionen: 0.6, laser: 0.4 }, angriff: 180, schild: 50, tempo: 15000, verbrauch: 60, ladung: 300,
      vor: { werft: 3, forschung: [V("impuls", 2), V("ionen", 1)] }, schnellfeuer: { kleine_drohne: 3, spionagesonde: 5, solarsatellit: 5 },
      beschreibung: "Leichte Eskorte gegen Jäger und Drohnen.",
      info: "Erstes ausgewogenes Kriegsschiff." },
    { id: "fregatte", name: "Fregatte", gruppe: "kampf", kosten: { metall: 16000, silizium: 8000, rohoel: 2000 },
      antrieb: "impuls", huelle: "leichtmetall", waffen: { ionen: 0.7, raketen: 0.3 }, angriff: 280, schild: 80, tempo: 13125, verbrauch: 90, ladung: 500,
      vor: { werft: 4, forschung: [V("impuls", 3), V("ionen", 2), V("schild", 2)] }, schnellfeuer: { aufklaerer: 3, spionagesonde: 5, solarsatellit: 5 },
      beschreibung: "Allrounder der Mittelklasse.",
      info: "Solide Werte in allen Bereichen." },
    { id: "zerstoerer", name: "Zerstörer", gruppe: "kampf", kosten: { metall: 22000, silizium: 10000, rohoel: 3000 },
      antrieb: "impuls", huelle: "leichtmetall", waffen: { ionen: 0.5, raketen: 0.5 }, angriff: 400, schild: 120, tempo: 12500, verbrauch: 120, ladung: 800,
      vor: { werft: 5, forschung: [V("impuls", 4), V("ionen", 3), V("waffen", 3)] }, schnellfeuer: { kleine_drohne: 4, mittlere_drohne: 3, schwere_drohne: 2, spionagesonde: 5, solarsatellit: 5 },
      beschreibung: "Jäger- und Drohnen-Killer.",
      info: "Schnellfeuer gegen alle Drohnen – Konter gegen Schwärme." },
    { id: "kreuzer", name: "Kreuzer", gruppe: "kampf", kosten: { metall: 30000, silizium: 15000, rohoel: 5000 },
      antrieb: "hyperraumantrieb", huelle: "leichtmetall", waffen: { ionen: 0.6, plasma: 0.4 }, angriff: 600, schild: 200, tempo: 11875, verbrauch: 200, ladung: 1500,
      vor: { werft: 6, forschung: [V("hyperraumantrieb", 2), V("ionen", 4), V("plasma", 1)] }, schnellfeuer: { korvette: 3, spionagesonde: 5, solarsatellit: 5 },
      beschreibung: "Linienschiff mit erstem Hyperraumantrieb.",
      info: "Ionen mit Plasma-Unterstützung." },
    { id: "bomber", name: "Bomber", gruppe: "kampf", kosten: { metall: 40000, silizium: 25000, rohoel: 10000, kunststoff_t3: 2000 },
      antrieb: "impuls", huelle: "verbund", waffen: { plasma: 0.8, raketen: 0.2 }, angriff: 1200, schild: 300, tempo: 7500, verbrauch: 300, ladung: 500,
      vor: { werft: 7, forschung: [V("impuls", 6), V("plasma", 5)] }, schnellfeuer: { orbitalverteidigungsplattform: 3, spionagesonde: 5, solarsatellit: 5 },
      beschreibung: "Langsamer Plasmabomber – hoher Kunststoff-T3-Anteil.",
      info: "Stark gegen Planeten- und Orbitalverteidigung (Wirkung im Verteidigungs-/Kampf-Kapitel)." },
    { id: "schlachtkreuzer", name: "Schlachtkreuzer", gruppe: "kampf", kosten: { metall: 45000, silizium: 40000, rohoel: 12000, kunststoff_t1: 300 },
      antrieb: "hyperraumantrieb", huelle: "verbund", waffen: { plasma: 0.6, laser: 0.4 }, angriff: 900, schild: 400, tempo: 12500, verbrauch: 250, ladung: 750,
      vor: { werft: 8, forschung: [V("hyperraumantrieb", 5), V("hyperspace", 5), V("laser", 10)] }, schnellfeuer: { kreuzer: 3, fregatte: 3, spionagesonde: 5, solarsatellit: 5 },
      beschreibung: "Schneller Schwergewichtler.",
      info: "Schnell und stark, aber teuer." },
    { id: "schlachtschiff", name: "Schlachtschiff", gruppe: "kampf", kosten: { metall: 60000, silizium: 30000, rohoel: 15000, kunststoff_t1: 500 },
      antrieb: "hyperraumantrieb", huelle: "verbund", waffen: { plasma: 0.5, ionen: 0.5 }, angriff: 1300, schild: 600, tempo: 10625, verbrauch: 400, ladung: 1500,
      vor: { werft: 9, forschung: [V("hyperraumantrieb", 6), V("plasma", 6), V("panzerung", 6)] }, schnellfeuer: { spionagesonde: 5, solarsatellit: 5 },
      beschreibung: "Rückgrat der Flotte.",
      info: "Höchste Linien-Kampfkraft." },
    { id: "traeger", name: "Träger", gruppe: "kampf", kosten: { metall: 40000, silizium: 80000, rohoel: 20000, kunststoff_t2: 1000 },
      antrieb: "hyperraumantrieb", huelle: "verbund", waffen: { raketen: 0.7, laser: 0.3 }, angriff: 500, schild: 1000, tempo: 8750, verbrauch: 600, ladung: 20000, hangar: { plaetze: 50, schiffe: ["kleine_drohne", "mittlere_drohne", "schwere_drohne"] },
      vor: { werft: 10, forschung: [V("hyperraumantrieb", 7), V("computer", 8), V("astrophysik", 4)] }, schnellfeuer: { spionagesonde: 5, solarsatellit: 5 },
      beschreibung: "Siliziumlastiger Drohnenträger.",
      info: "Hangar für bis zu 50 Drohnen (Kleine/Mittlere/Schwere Drohne, Wirkung im Flotten-Kapitel). Schwache Eigenbewaffnung." },
    { id: "koloss", name: "Koloss", gruppe: "kampf", kosten: { metall: 400000, silizium: 250000, rohoel: 100000, kunststoff_t2: 5000 },
      antrieb: "hyperraumantrieb", huelle: "verbund", waffen: { plasma: 0.6, ionen: 0.4 }, angriff: 12000, schild: 5000, tempo: 5000, verbrauch: 1500, ladung: 10000,
      vor: { werft: 11, forschung: [V("hyperraumantrieb", 8), V("plasma", 9), V("panzerung", 10)] }, schnellfeuer: { fregatte: 5, korvette: 8, kreuzer: 3, spionagesonde: 5, solarsatellit: 5 },
      beschreibung: "Belagerungsschiff – metallbetont.",
      info: "Vorstufe zum Titan." },
    { id: "titan", name: "Titan", gruppe: "kampf", kosten: { metall: 2000000, silizium: 4000000, rohoel: 1000000, kunststoff_t3: 20000 },
      antrieb: "hyperraumantrieb", huelle: "verbund", waffen: { graviton: 0.6, plasma: 0.4 }, angriff: 200000, schild: 50000, tempo: 1250, verbrauch: 5000, ladung: 1000000,
      vor: { werft: 12, forschung: [V("hyperraumantrieb", 10), V("graviton", 1), V("netzwerk", 1)] }, schnellfeuer: { spionagesonde: 250, solarsatellit: 250, aufklaerer: 200, kleine_drohne: 200, mittlere_drohne: 150, schwere_drohne: 100, korvette: 50, fregatte: 40, zerstoerer: 30, kreuzer: 25, bomber: 20, schlachtkreuzer: 10, schlachtschiff: 8, traeger: 10, koloss: 3 },
      beschreibung: "Endgame-Flaggschiff – siliziumlastig, einziges Schiff mit Graviton.",
      info: "Riesiges Schnellfeuer gegen fast alles." },
    // ---------- Hilfsschiffe (Namen + Ladung 15–18: FEST, Sandro; Bodensammler: von Sandro ergänzt) ----------
    { id: "kleiner_frachter", name: "Kleiner Frachter", gruppe: "hilf", kosten: { metall: 2000, silizium: 2000 },
      antrieb: "verbrennung", huelle: "leichtmetall", waffen: {  }, angriff: 5, schild: 10, tempo: 12500, verbrauch: 10, ladung: 5000, transporter: true,
      vor: { werft: 2, forschung: [V("verbrennung", 2)] }, schnellfeuer: {  },
      beschreibung: "Früher Transport – 5.000 Ladung.",
      info: "Wechselt ab Impulstriebwerk 5 auf Impuls (Flotten-Kapitel)." },
    { id: "mittlerer_frachter", name: "Mittlerer Frachter", gruppe: "hilf", kosten: { metall: 8000, silizium: 8000, rohoel: 1000 },
      antrieb: "impuls", huelle: "leichtmetall", waffen: {  }, angriff: 5, schild: 25, tempo: 9375, verbrauch: 50, ladung: 50000, transporter: true,
      vor: { werft: 4, forschung: [V("impuls", 3), V("komprimierung", 2)] }, schnellfeuer: {  },
      beschreibung: "Haupt-Transporter – 50.000 Ladung.",
      info: "Zehnfache Ladung des kleinen Frachters." },
    { id: "massengutfrachter", name: "Massengutfrachter", gruppe: "hilf", kosten: { metall: 40000, silizium: 30000, rohoel: 10000, kunststoff_t1: 500 },
      antrieb: "hyperraumantrieb", huelle: "verbund", waffen: {  }, angriff: 5, schild: 100, tempo: 5625, verbrauch: 300, ladung: 250000, transporter: true,
      vor: { werft: 7, forschung: [V("hyperraumantrieb", 3), V("komprimierung", 5)] }, schnellfeuer: {  },
      beschreibung: "Großtransport – 250.000 Ladung, langsam.",
      info: "Kunststoff für die Großtanks." },
    { id: "wracksammler", name: "Wracksammler", gruppe: "hilf", kosten: { metall: 10000, silizium: 6000, rohoel: 2000 },
      antrieb: "verbrennung", huelle: "leichtmetall", waffen: {  }, angriff: 1, schild: 10, tempo: 6250, verbrauch: 300, ladung: 100000, ladungArt: "orbit",
      vor: { werft: 4, forschung: [V("verbrennung", 6), V("schild", 2)] }, schnellfeuer: {  },
      beschreibung: "Sammelt Trümmerfelder im Orbit – 100.000 Ladung.",
      info: "Nur Orbit-Schrott aus Schiffskämpfen. Sammeln folgt im Kampf-Kapitel." },
    { id: "bodensammler", name: "Bodensammler", gruppe: "hilf", kosten: { metall: 12000, silizium: 8000, rohoel: 3000 },
      antrieb: "impuls", huelle: "leichtmetall", waffen: {  }, angriff: 1, schild: 20, tempo: 5000, verbrauch: 400, ladung: 75000, ladungArt: "boden",
      vor: { werft: 5, forschung: [V("impuls", 3), V("schild", 3), V("spionage", 2)] }, schnellfeuer: {  },
      beschreibung: "Sammelt Verteidigungs-Schrott am Boden.",
      info: "Erkennt die Rohstoffzusammensetzung erst beim Sammeln; Sammeldauer in Stunden je Schrottfeldgröße (Kampf-Kapitel). Ladung 75.000 (ANNAHME)." },
    // ---------- Spezial 20–24 (Ergänzungen, ANNAHME) ----------
    { id: "solarsatellit", name: "Solarsatellit", gruppe: "spezial", kosten: { silizium: 2000, rohoel: 500 },
      antrieb: null, huelle: "leichtmetall", waffen: {  }, angriff: 1, schild: 1, tempo: 0, verbrauch: 0, ladung: 0, stationaer: true,
      vor: { werft: 1, forschung: [V("energie", 1)] }, schnellfeuer: {  },
      beschreibung: "Liefert Strom aus dem Orbit.",
      info: "Jeder Satellit erhöht den Strom des Planeten (× Energie-Technologie). Fliegt nicht; wird im Kampf leicht zerstört." },
    { id: "spionagesonde", name: "Spionagesonde", gruppe: "spezial", kosten: { silizium: 1000 },
      antrieb: "verbrennung", huelle: "leichtmetall", waffen: {  }, angriff: 0, schild: 0, tempo: 125000, verbrauch: 1, ladung: 5,
      vor: { werft: 3, forschung: [V("verbrennung", 3), V("spionage", 2)] }, schnellfeuer: {  },
      beschreibung: "Extrem schnelle Sonde für Spionageberichte.",
      info: "Kein Schild, kaum Hülle – wird im Kampf meist zerstört. Kontert die Orbitalverteidigungsplattform nur mit hoher Spionage." },
    { id: "kolonieschiff", name: "Kolonieschiff", gruppe: "spezial", kosten: { metall: 10000, silizium: 20000, rohoel: 10000 },
      antrieb: "impuls", huelle: "leichtmetall", waffen: {  }, angriff: 50, schild: 100, tempo: 3125, verbrauch: 1000, ladung: 7500,
      vor: { werft: 4, forschung: [V("impuls", 3), V("astrophysik", 1)] }, schnellfeuer: {  },
      beschreibung: "Gründet eine Kolonie – wird dabei verbraucht.",
      info: "Besiedeln folgt im Flotten-/Weltraum-Kapitel." },
    { id: "treibstofftanker", name: "Treibstofftanker", gruppe: "spezial", kosten: { metall: 6000, silizium: 4000, rohoel: 2000 },
      antrieb: "impuls", huelle: "leichtmetall", waffen: {  }, angriff: 1, schild: 20, tempo: 10000, verbrauch: 20, ladung: 30000, ladungArt: "rohoel",
      vor: { werft: 4, forschung: [V("impuls", 2), V("komprimierung", 1)] }, schnellfeuer: {  },
      beschreibung: "Versorgt Flotten unterwegs mit Rohöl.",
      info: "Nur Rohöl als Ladung; mehr Reichweite (Flotten-Kapitel)." },
    { id: "orbitalverteidigungsplattform", name: "Orbitalverteidigungsplattform", gruppe: "spezial", kosten: { metall: 100000, silizium: 60000, rohoel: 20000, kunststoff_t2: 1000, kunststoff_t3: 500 },
      antrieb: null, huelle: "verbund", waffen: { ionen: 0.5, raketen: 0.5 }, angriff: 2000, schild: 2000, tempo: 0, verbrauch: 0, ladung: 0, stationaer: true,
      waffenslots: { anzahl: 2, mehrAb: { forschung: "computer", stufe: 10, anzahl: 3 }, erlaubt: ["ionen", "plasma", "raketen", "laser"] },
      sondenabwehr: { forschung: [V("spionage", 12), V("computer", 12)], chanceJeStufe: 0.05, max: 0.9 },
      vor: { werft: 8, forschung: [V("schild", 6), V("ionen", 5), V("computer", 6)] }, schnellfeuer: { aufklaerer: 3, kleine_drohne: 3, spionagesonde: 5, solarsatellit: 5 },
      beschreibung: "Fliegt nicht – zerstört Flotten schon im Orbit.",
      info: "Begrenzte Waffenslots: 2, ab Computer 10 drei (Ionen, Plasma, Raketen oder Laser; Graviton nicht). Spionagesonden-Abschuss erst ab Spionage 12 + Computer 12. Bestückung folgt im Verteidigungs-/Kampf-Kapitel." }
  ];
  // 0.11.1: von Sandro freigegebene Bilder (PNG, 400×400); alle übrigen bleiben SVG-Platzhalter
  var PNG_FREIGEGEBEN = { aufklaerer: 1, kleine_drohne: 1, mittlere_drohne: 1, schwere_drohne: 1, korvette: 1, fregatte: 1, zerstoerer: 1,
    kreuzer: 1, schlachtkreuzer: 1, schlachtschiff: 1, traeger: 1, koloss: 1, mittlerer_frachter: 1, wracksammler: 1,
    spionagesonde: 1, kolonieschiff: 1, treibstofftanker: 1 };
  SS.DATEN.schiffPngFreigegeben = Object.freeze(Object.keys(PNG_FREIGEGEBEN));
  L.forEach(function (s) {
    s.bild = "assets/schiffe/" + s.id + (PNG_FREIGEGEBEN[s.id] ? ".png" : ".svg");
    Object.freeze(s.kosten); Object.freeze(s.waffen); Object.freeze(s.schnellfeuer); Object.freeze(s.vor.forschung); Object.freeze(s.vor); if (s.waffenslots) Object.freeze(s.waffenslots); if (s.hangar) Object.freeze(s.hangar); Object.freeze(s);
  });
  SS.DATEN.schiffe = Object.freeze(L);
  SS.DATEN.schiffIds = Object.freeze(L.map(function (s) { return s.id; }));
  // 0.10.0: alte Schiff-IDs aus 0.9.0 → neue (1:1-Nachfolger); nicht aufgeführte alte IDs werden verworfen
  SS.DATEN.schiffUmbenennung = Object.freeze({ kleiner_transporter: "kleiner_frachter", grosser_transporter: "mittlerer_frachter",
    kolonisationsschiff: "kolonieschiff", recycler: "wracksammler", orbitalplattform: "orbitalverteidigungsplattform" });
  SS.DATEN.schiffNachId = function (id) { for (var i = 0; i < L.length; i++) if (L[i].id === id) return L[i]; return null; };
  SS.DATEN.waffentypNachId = function (id) { return SS.DATEN.waffentypen.filter(function (w) { return w.id === id; })[0] || null; };
  SS.DATEN.huellentypNachId = function (id) { return SS.DATEN.huellentypen.filter(function (h) { return h.id === id; })[0] || null; };
})(typeof globalThis !== "undefined" ? globalThis : this);
