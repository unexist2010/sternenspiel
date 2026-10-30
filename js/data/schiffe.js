/*
 * Sternenspiel – Schiffe, Hüllentypen, Waffentypen (Kapitel 4 „Werft“). ALLE Schiffswerte zentral hier.
 *
 * FEST (Sandro): 23 Schiffe, 5 Waffentypen, 2 Hüllentypen; Solarsatelliten werden in der Werft gebaut.
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

  SS.DATEN.SCHIFFE_ANZAHL_SOLL = 23;      // FEST
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
    { id: "verbund", name: "Verbundpanzer", faktor: 1.5, beschreibung: "Schwere Hülle aus Metall und Kunststoff – teurer (Kunststoff nötig), ×1,5 Struktur." }
  ].map(Object.freeze));

  SS.DATEN.schiffGruppen = Object.freeze([
    { id: "zivil", name: "Zivil & Hilfsschiffe" },
    { id: "kampf", name: "Kampfschiffe" },
    { id: "spezial", name: "Spezial" }
  ].map(Object.freeze));

  var V = function (id, st) { return { id: id, stufe: st }; };
  var L = [
    // ---------- Zivil & Hilfsschiffe ----------
    { id: "kleiner_transporter", name: "Kleiner Transporter", gruppe: "zivil", kosten: { metall: 2000, silizium: 2000 },
      antrieb: "verbrennung", huelle: "leichtmetall", waffen: { raketen: 1 }, angriff: 5, schild: 10, tempo: 5000, verbrauch: 10, ladung: 5000, transporter: true,
      vor: { werft: 2, forschung: [V("verbrennung", 2)] }, schnellfeuer: { spionagesonde: 5, solarsatellit: 5 },
      beschreibung: "Wendiger Frachter für Rohstoffe zwischen Planeten.",
      info: "Der Standard-Frachter: günstig, schnell gebaut, 5.000 Ladung. Kaum bewaffnet – im Kampf nur Ziel." },
    { id: "grosser_transporter", name: "Großer Transporter", gruppe: "zivil", kosten: { metall: 6000, silizium: 6000 },
      antrieb: "impuls", huelle: "leichtmetall", waffen: { raketen: 1 }, angriff: 5, schild: 25, tempo: 7500, verbrauch: 50, ladung: 25000, transporter: true,
      vor: { werft: 4, forschung: [V("impuls", 2)] }, schnellfeuer: { spionagesonde: 5, solarsatellit: 5 },
      beschreibung: "Großer Frachter mit 25.000 Ladung.",
      info: "Fünffache Ladung des kleinen Transporters bei dreifachen Kosten. Mit Impulstriebwerk (ANNAHME; OGame: Verbrennung)." },
    { id: "kolonisationsschiff", name: "Kolonisationsschiff", gruppe: "zivil", kosten: { metall: 10000, silizium: 20000, rohoel: 10000 },
      antrieb: "impuls", huelle: "leichtmetall", waffen: { raketen: 1 }, angriff: 50, schild: 100, tempo: 2500, verbrauch: 1000, ladung: 7500,
      vor: { werft: 4, forschung: [V("impuls", 3)] }, schnellfeuer: { spionagesonde: 5, solarsatellit: 5 },
      beschreibung: "Gründet eine Kolonie auf einem freien Planeten.",
      info: "Wird beim Besiedeln verbraucht. Anzahl der Kolonien begrenzt die Astrophysik. Besiedeln folgt im Flotten-/Weltraum-Kapitel." },
    { id: "recycler", name: "Recycler", gruppe: "zivil", kosten: { metall: 10000, silizium: 6000, rohoel: 2000 },
      antrieb: "verbrennung", huelle: "leichtmetall", waffen: { raketen: 1 }, angriff: 1, schild: 10, tempo: 2000, verbrauch: 300, ladung: 20000,
      vor: { werft: 4, forschung: [V("verbrennung", 6), V("schild", 2)] }, schnellfeuer: { spionagesonde: 5, solarsatellit: 5 },
      beschreibung: "Sammelt Trümmerfelder im Orbit ein.",
      info: "Trümmer (Salvage) folgen im Kampf-Kapitel. 20.000 Ladung, langsam." },
    { id: "spionagesonde", name: "Spionagesonde", gruppe: "zivil", kosten: { silizium: 1000 },
      antrieb: "verbrennung", huelle: "leichtmetall", waffen: {}, angriff: 0, schild: 0, tempo: 100000000, verbrauch: 1, ladung: 5,
      vor: { werft: 3, forschung: [V("verbrennung", 3), V("spionage", 2)] }, schnellfeuer: {},
      beschreibung: "Extrem schnelle Sonde, liefert Spionageberichte.",
      info: "Fast keine Hülle, kein Schild – wird im Kampf sofort zerstört. Detailgrad hängt von der Spionage-Technologie ab (Spionage-Kapitel)." },
    { id: "solarsatellit", name: "Solarsatellit", gruppe: "zivil", kosten: { silizium: 2000, rohoel: 500 },
      antrieb: null, huelle: "leichtmetall", waffen: {}, angriff: 0, schild: 1, tempo: 0, verbrauch: 0, ladung: 0, stationaer: true,
      vor: { werft: 1, forschung: [] }, schnellfeuer: {},
      beschreibung: "Liefert Strom aus dem Orbit (wirkt sofort, Verwaltung unter Anlagen/Ressourcen).",
      info: "Jeder Satellit erhöht den Strom des Planeten (× Energie-Technologie). Kein Antrieb, fliegt nicht. Wird im Kampf leicht zerstört." },
    // ---------- Kampfschiffe ----------
    { id: "leichter_jaeger", name: "Leichter Jäger", gruppe: "kampf", kosten: { metall: 3000, silizium: 1000 },
      antrieb: "verbrennung", huelle: "leichtmetall", waffen: { laser: 1 }, angriff: 50, schild: 10, tempo: 12500, verbrauch: 20, ladung: 50,
      vor: { werft: 1, forschung: [V("verbrennung", 1)] }, schnellfeuer: { spionagesonde: 5, solarsatellit: 5 },
      beschreibung: "Erstes Kampfschiff – billig und in Masse stark.",
      info: "Rückgrat früher Flotten. Schwach einzeln, aber günstig." },
    { id: "schwerer_jaeger", name: "Schwerer Jäger", gruppe: "kampf", kosten: { metall: 6000, silizium: 4000 },
      antrieb: "impuls", huelle: "leichtmetall", waffen: { laser: 1 }, angriff: 150, schild: 25, tempo: 10000, verbrauch: 75, ladung: 100,
      vor: { werft: 3, forschung: [V("panzerung", 2), V("impuls", 2)] }, schnellfeuer: { kleiner_transporter: 3, spionagesonde: 5, solarsatellit: 5 },
      beschreibung: "Besser gepanzerter Jäger mit Impulstriebwerk.",
      info: "Dreifacher Angriff des leichten Jägers. Schnellfeuer gegen kleine Transporter." },
    { id: "kreuzer", name: "Kreuzer", gruppe: "kampf", kosten: { metall: 20000, silizium: 7000, rohoel: 2000 },
      antrieb: "impuls", huelle: "leichtmetall", waffen: { ionen: 1 }, angriff: 400, schild: 50, tempo: 15000, verbrauch: 300, ladung: 800,
      vor: { werft: 5, forschung: [V("impuls", 4), V("ionen", 2)] }, schnellfeuer: { leichter_jaeger: 6, abfangjaeger: 4, spionagesonde: 5, solarsatellit: 5 },
      beschreibung: "Schneller Jäger-Killer mit Ionenkanonen.",
      info: "Sehr schnell, starkes Schnellfeuer gegen leichte Jäger und Abfangjäger." },
    { id: "schlachtschiff", name: "Schlachtschiff", gruppe: "kampf", kosten: { metall: 45000, silizium: 15000 },
      antrieb: "hyperraumantrieb", huelle: "leichtmetall", waffen: { laser: 0.7, plasma: 0.3 }, angriff: 1000, schild: 200, tempo: 10000, verbrauch: 500, ladung: 1500,
      vor: { werft: 7, forschung: [V("hyperraumantrieb", 4)] }, schnellfeuer: { spionagesonde: 5, solarsatellit: 5 },
      beschreibung: "Das klassische Linienschiff – ausgewogen und robust.",
      info: "Laser-Hauptbatterie mit Plasma-Unterstützung. Hyperraumantrieb." },
    { id: "bomber", name: "Bomber", gruppe: "kampf", kosten: { metall: 50000, silizium: 25000, rohoel: 15000, kunststoff_t1: 100 },
      antrieb: "impuls", huelle: "verbund", waffen: { plasma: 1 }, angriff: 1000, schild: 500, tempo: 4000, verbrauch: 1000, ladung: 500,
      vor: { werft: 8, forschung: [V("impuls", 6), V("plasma", 5)] }, schnellfeuer: { orbitalplattform: 3, spionagesonde: 5, solarsatellit: 5 },
      beschreibung: "Langsamer Plasmabomber gegen stationäre Ziele.",
      info: "Später stark gegen Verteidigungsanlagen (Verteidigungs-Kapitel); jetzt Schnellfeuer gegen Orbitalplattformen." },
    { id: "zerstoerer", name: "Zerstörer", gruppe: "kampf", kosten: { metall: 60000, silizium: 50000, rohoel: 15000, kunststoff_t1: 500 },
      antrieb: "hyperraumantrieb", huelle: "verbund", waffen: { plasma: 1 }, angriff: 2000, schild: 500, tempo: 5000, verbrauch: 1000, ladung: 2000,
      vor: { werft: 9, forschung: [V("hyperraumantrieb", 6), V("hyperspace", 5)] }, schnellfeuer: { interzeptor: 2, spionagesonde: 5, solarsatellit: 5 },
      beschreibung: "Schweres Plasma-Kampfschiff.",
      info: "Hoher Angriff, Verbundpanzer. Schnellfeuer gegen Interzeptoren." },
    { id: "todesstern", name: "Todesstern", gruppe: "kampf", kosten: { metall: 5000000, silizium: 4000000, rohoel: 1000000, kunststoff_t3: 1000 },
      antrieb: "hyperraumantrieb", huelle: "verbund", waffen: { graviton: 1 }, angriff: 200000, schild: 50000, tempo: 100, verbrauch: 1, ladung: 1000000,
      vor: { werft: 12, forschung: [V("hyperraumantrieb", 7), V("graviton", 1)] },
      schnellfeuer: { spionagesonde: 250, solarsatellit: 250, leichter_jaeger: 200, abfangjaeger: 200, schwerer_jaeger: 100, kreuzer: 33, schlachtschiff: 30, bomber: 25, zerstoerer: 5, kleiner_transporter: 250, grosser_transporter: 250, kolonisationsschiff: 250, recycler: 250 },
      beschreibung: "Superwaffe mit Gravitonkanone – extrem teuer und langsam.",
      info: "Braucht Graviton-Technologie und Kunststoff T3. Riesiges Schnellfeuer gegen fast alles." },
    // ---------- Spezial (Sternenspiel-Ergänzungen) ----------
    { id: "abfangjaeger", name: "Abfangjäger", gruppe: "spezial", kosten: { metall: 2000, silizium: 1000 },
      antrieb: "verbrennung", huelle: "leichtmetall", waffen: { laser: 1 }, angriff: 30, schild: 5, tempo: 15000, verbrauch: 15, ladung: 20,
      vor: { werft: 1, forschung: [V("verbrennung", 2)] }, schnellfeuer: { spionagesonde: 5, solarsatellit: 5 },
      beschreibung: "Sehr schneller, schwacher Jäger.",
      info: "Billiger als der leichte Jäger, schneller, aber schwächer – für Abfangen und Masse." },
    { id: "panzerkreuzer", name: "Panzerkreuzer", gruppe: "spezial", kosten: { metall: 25000, silizium: 12000, rohoel: 3000, kunststoff_t1: 200 },
      antrieb: "impuls", huelle: "verbund", waffen: { ionen: 1 }, angriff: 350, schild: 120, tempo: 11000, verbrauch: 350, ladung: 600,
      vor: { werft: 6, forschung: [V("impuls", 4), V("ionen", 3), V("panzerung", 4)] }, schnellfeuer: { leichter_jaeger: 3, spionagesonde: 5, solarsatellit: 5 },
      beschreibung: "Schwer gepanzerter Kreuzer mit Verbundhülle.",
      info: "Etwas weniger Angriff als der Kreuzer, aber deutlich mehr Hülle und Schild." },
    { id: "schlachtkreuzer", name: "Schlachtkreuzer", gruppe: "spezial", kosten: { metall: 30000, silizium: 40000, rohoel: 15000, kunststoff_t1: 300 },
      antrieb: "hyperraumantrieb", huelle: "verbund", waffen: { plasma: 1 }, angriff: 700, schild: 400, tempo: 10000, verbrauch: 250, ladung: 750,
      vor: { werft: 8, forschung: [V("hyperraumantrieb", 5), V("hyperspace", 5), V("plasma", 3)] },
      schnellfeuer: { kleiner_transporter: 3, grosser_transporter: 3, schwerer_jaeger: 4, kreuzer: 4, schlachtschiff: 7, spionagesonde: 5, solarsatellit: 5 },
      beschreibung: "Jäger großer Schiffe – stark gegen Schlachtschiffe.",
      info: "Schnellfeuer gegen Kreuzer, Schlachtschiffe und Transporter (OGame-Schlachtkreuzer)." },
    { id: "traeger", name: "Träger", gruppe: "spezial", kosten: { metall: 40000, silizium: 30000, rohoel: 20000, kunststoff_t2: 200 },
      antrieb: "hyperraumantrieb", huelle: "verbund", waffen: { raketen: 1 }, angriff: 100, schild: 600, tempo: 6000, verbrauch: 800, ladung: 60000, transporter: true,
      vor: { werft: 8, forschung: [V("hyperraumantrieb", 4), V("computer", 6)] }, schnellfeuer: { spionagesonde: 5, solarsatellit: 5 },
      beschreibung: "Fliegender Flottenstützpunkt mit riesiger Ladung.",
      info: "Hohe Ladekapazität; als Flottenstützpunkt (Wirkung später im Flotten-Kapitel)." },
    { id: "minenleger", name: "Minenleger", gruppe: "spezial", kosten: { metall: 12000, silizium: 8000, rohoel: 4000 },
      antrieb: "impuls", huelle: "leichtmetall", waffen: { raketen: 1 }, angriff: 20, schild: 80, tempo: 6000, verbrauch: 200, ladung: 1000,
      vor: { werft: 5, forschung: [V("impuls", 3), V("waffen", 3)] }, schnellfeuer: { spionagesonde: 5, solarsatellit: 5 },
      beschreibung: "Legt Minenfelder im Orbit (Wirkung später).",
      info: "Platzhalter-Wirkung: Minenfelder folgen im Verteidigungs-/Kampf-Kapitel." },
    { id: "interzeptor", name: "Interzeptor", gruppe: "spezial", kosten: { metall: 15000, silizium: 8000, rohoel: 2000 },
      antrieb: "hyperraumantrieb", huelle: "leichtmetall", waffen: { laser: 1 }, angriff: 300, schild: 40, tempo: 20000, verbrauch: 150, ladung: 100,
      vor: { werft: 6, forschung: [V("hyperraumantrieb", 2), V("laser", 8)] }, schnellfeuer: { kleiner_transporter: 4, grosser_transporter: 2, spionagesonde: 5, solarsatellit: 5 },
      beschreibung: "Schnellstes Kampfschiff – jagt Transporter.",
      info: "Hyperraum-Jäger mit Laser. Schnellfeuer gegen Transporter." },
    { id: "orbitalplattform", name: "Orbitalplattform", gruppe: "spezial", kosten: { metall: 80000, silizium: 60000, rohoel: 20000, kunststoff_t2: 300 },
      antrieb: null, huelle: "verbund", waffen: { ionen: 0.5, raketen: 0.5 }, angriff: 1500, schild: 1500, tempo: 0, verbrauch: 0, ladung: 0, stationaer: true,
      vor: { werft: 8, forschung: [V("schild", 6), V("ionen", 5)] }, schnellfeuer: { leichter_jaeger: 3, abfangjaeger: 3, spionagesonde: 5, solarsatellit: 5 },
      beschreibung: "Stationäres Kampfsystem im Orbit – kann nicht fliegen.",
      info: "ANNAHME: zählt zu den Schiffen (in der Werft gebaut), bleibt aber immer am Planeten und kämpft dort mit." },
    { id: "treibstofftanker", name: "Treibstofftanker", gruppe: "spezial", kosten: { metall: 8000, silizium: 6000, rohoel: 2000 },
      antrieb: "verbrennung", huelle: "leichtmetall", waffen: {}, angriff: 0, schild: 20, tempo: 6000, verbrauch: 100, ladung: 20000,
      vor: { werft: 4, forschung: [V("verbrennung", 5)] }, schnellfeuer: {},
      beschreibung: "Versorgt Flotten mit Rohöl – mehr Reichweite (Wirkung später).",
      info: "Treibstoffregeln folgen im Flotten-Kapitel (offene Frage 19)." },
    { id: "kunststoff_frachter", name: "Kunststoff-Frachter", gruppe: "spezial", kosten: { metall: 15000, silizium: 15000, rohoel: 5000, kunststoff_t1: 100 },
      antrieb: "impuls", huelle: "leichtmetall", waffen: { raketen: 1 }, angriff: 5, schild: 50, tempo: 7000, verbrauch: 150, ladung: 40000, transporter: true,
      vor: { werft: 6, forschung: [V("impuls", 4), V("komprimierung", 2)] }, schnellfeuer: { spionagesonde: 5, solarsatellit: 5 },
      beschreibung: "Großraumfrachter, besonders für Kunststoff.",
      info: "40.000 Ladung. Eine Kunststoff-Bevorzugung beim Laden folgt im Flotten-Kapitel (ANNAHME)." },
    { id: "antimaterie_frachter", name: "Antimaterie-Frachter", gruppe: "spezial", kosten: { metall: 100000, silizium: 80000, rohoel: 40000, kunststoff_t3: 200 },
      antrieb: "hyperraumantrieb", huelle: "verbund", waffen: { raketen: 1 }, angriff: 10, schild: 300, tempo: 12000, verbrauch: 600, ladung: 20000, transporter: true,
      vor: { werft: 10, forschung: [V("hyperraumantrieb", 6), V("komprimierung", 5)] }, schnellfeuer: { spionagesonde: 5, solarsatellit: 5 }, flag: "antimaterie",
      beschreibung: "Sicherer Transport von Antimaterie.",
      info: "Ausgeblendet, bis Antimaterie freigeschaltet ist (Master zeigt ihn)." }
  ];
  L.forEach(function (s) {
    s.bild = "assets/schiffe/" + s.id + ".svg";
    Object.freeze(s.kosten); Object.freeze(s.waffen); Object.freeze(s.schnellfeuer); Object.freeze(s.vor.forschung); Object.freeze(s.vor); Object.freeze(s);
  });
  SS.DATEN.schiffe = Object.freeze(L);
  SS.DATEN.schiffIds = Object.freeze(L.map(function (s) { return s.id; }));
  SS.DATEN.schiffNachId = function (id) { for (var i = 0; i < L.length; i++) if (L[i].id === id) return L[i]; return null; };
  SS.DATEN.waffentypNachId = function (id) { return SS.DATEN.waffentypen.filter(function (w) { return w.id === id; })[0] || null; };
  SS.DATEN.huellentypNachId = function (id) { return SS.DATEN.huellentypen.filter(function (h) { return h.id === id; })[0] || null; };
})(typeof globalThis !== "undefined" ? globalThis : this);
