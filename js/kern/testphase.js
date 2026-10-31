/*
 * Sternenspiel – Testphase (0.14.1, Sandro t32u): minimales Gegner-Modell + Test-Seed für Flug/Transport/Spionage/Angriff.
 * KEIN volles Weltraum-Kapitel: Gegner sind statische Datensätze in z.gegner ohne KI, ohne Produktion, ohne Beute.
 * Gegner = { id, name, sektor, system, planet, schiffe:{id:n}, verteidigung:{id:n}, solarsatelliten, truemmer }
 * legeTestphaseAn(z, jetzt) ÜBERSCHREIBT klar (dokumentiert): Master an, Hauptplanet-Bestand/Gebäude/Startplätze,
 * Zweitplanet „Testkolonie“ und genau zwei Gegner werden neu gesetzt; Flotten unterwegs werden verworfen.
 * 0.14.2 (t33u): Mission „sammeln“ (Trümmer bergen, nur Orbit) + Auto-Bergung nach gewonnenem Angriff mit Wracksammlern.
 *   ANNAHME: Bergung nimmt das gesamte Orbit-Feld am Ziel (bis zur Kapazität: 100.000 je Wracksammler, Metall zuerst);
 *   Gutschrift in z.rohstoffe bei Rückkehr der Flotte.
 * Alle Zahlen = ANNAHME (Test-Seed).
 */
(function (g) {
  "use strict";
  var SS = (g.SS = g.SS || {});
  SS.kern = SS.kern || {};
  var D = function () { return SS.DATEN; };
  var gleich = function (a, b) { return a && b && a.sektor === b.sektor && a.system === b.system && a.planet === b.planet; };
  var leerT = function () { return { orbit: { metall: 0, silizium: 0 }, boden: { metall: 0, silizium: 0 } }; };

  var BEUTE_IDS = ["metall", "silizium", "rohoel", "kunststoff_t1", "kunststoff_t2", "kunststoff_t3"];
  function rs(o) { var r = {}; BEUTE_IDS.forEach(function (id) { var n = Math.floor(Number(o && o[id]) || 0); if (n > 0) r[id] = n; }); return r; }
  function bereinige(liste) {
    return (Array.isArray(liste) ? liste : []).filter(function (x) {
      return x && x.id && D().weltraum.leseKoordinaten(x.sektor + ":" + x.system + ":" + x.planet);
    }).map(function (x) {
      var sch = {}, def = {};
      Object.keys(x.schiffe || {}).forEach(function (id) { var n = Math.floor(Number(x.schiffe[id]) || 0); if (n > 0 && D().schiffNachId(id)) sch[id] = n; });
      Object.keys(x.verteidigung || {}).forEach(function (id) { var n = Math.floor(Number(x.verteidigung[id]) || 0); if (n > 0 && D().verteidigungNachId(id)) def[id] = n; });
      var t = leerT();
      if (x.truemmer) ["orbit", "boden"].forEach(function (o) { ["metall", "silizium"].forEach(function (r) { t[o][r] = Math.max(0, Number(x.truemmer[o] && x.truemmer[o][r]) || 0); }); });
      return { id: String(x.id), name: String(x.name || x.id).slice(0, 40), sektor: x.sektor, system: x.system, planet: x.planet,
        schiffe: sch, verteidigung: def, rohstoffe: rs(x.rohstoffe), solarsatelliten: Math.max(0, Math.floor(Number(x.solarsatelliten) || 0)), truemmer: t,
        ki: SS.kern.ki ? SS.kern.ki.bereinigeKi(x.ki) : undefined,
        startplaetze: Array.isArray(x.startplaetze) ? x.startplaetze.filter(function (sp) { return sp && sp.buchstabe; }).map(function (sp) { return { buchstabe: String(sp.buchstabe), stufe: Math.max(0, Math.floor(Number(sp.stufe) || 0)) }; }) : undefined };
    });
  }

  function alleGegner(z) { return (z.gegner || []).concat((z.ki && z.ki.npc) || []); } // 0.20.0: + KI-Planeten
  function gegnerAn(z, k) { return alleGegner(z).filter(function (x) { return gleich(x, k); })[0] || null; }

  /** Synthetischer Planet + Zustand für SS.kern.kampf.simuliere (Gegner ohne Flotte unterwegs → alle Schiffe verteidigen). */
  function kampfPlanet(gg) {
    var p = { id: "gegner:" + gg.id, schiffe: JSON.parse(JSON.stringify(gg.schiffe)), verteidigung: JSON.parse(JSON.stringify(gg.verteidigung)),
      solarsatelliten: gg.solarsatelliten || 0, flotte: { preset: SS.BALANCE.FLOTTE.STANDARD_PRESET },
      startplaetze: gg.startplaetze ? JSON.parse(JSON.stringify(gg.startplaetze)) : [{ buchstabe: "A", stufe: 10 }, { buchstabe: "B", stufe: 10 }], gebaeude: {}, truemmer: leerT() }; // Standard 300 Plätze ≫ Bestand; optional gg.startplaetze (Test Hangar)
    var gz = { forschung: {}, einstellungen: {}, flotten: [], rohstoffe: {} }; // ANNAHME: Gegner ohne Forschung
    return { p: p, z: gz };
  }

  /**
   * Spionage (FEST Sandro t34u, 0.14.3): sichtbar sind nur Schiffe auf den Startplätzen (gleiche Preset-/Kapazitätslogik wie im Kampf),
   * Verteidigung und Solarsatelliten. Hangar-Typen/-Zahlen werden NIE übermittelt – nur der Hinweis „bodenbewegungen“ (true = Hangar nicht leer).
   */
  function spionage(z, gg, jetzt) {
    var kp = kampfPlanet(gg), vt = SS.kern.kampf.verteilung(kp.p, kp.z), sicht = {};
    Object.keys(vt.startplatz || {}).forEach(function (id) { if (vt.startplatz[id] > 0) sicht[id] = vt.startplatz[id]; });
    var bew = Object.keys(vt.hangar || {}).some(function (id) { return vt.hangar[id] > 0; });
    var b = { zeit: jetzt, gegner: gg.id, name: gg.name, koordinaten: { sektor: gg.sektor, system: gg.system, planet: gg.planet },
      schiffe: sicht, verteidigung: JSON.parse(JSON.stringify(gg.verteidigung)), solarsatelliten: gg.solarsatelliten || 0,
      truemmer: JSON.parse(JSON.stringify(gg.truemmer || leerT())), sichtbarkeit: "startplaetze",
      bodenbewegungen: bew, hinweis: HINWEIS[bew ? "ja" : "nein"] };
    if (gg.ki && SS.kern.ki) { // 0.20.0: KI-Planet – Punkte + täglicher Drift ±5 % (Bericht nie ganz exakt)
      var KI = SS.kern.ki; b.schiffe = KI.drift(z, gg, b.schiffe, jetzt); b.verteidigung = KI.drift(z, gg, b.verteidigung, jetzt);
      b.art = gg.ki.art; b.punkte = Math.round(KI.punkte(z, gg, jetzt) * KI.driftFaktor(z, gg, jetzt)); b.tfAlterTage = KI.tfAlterTage(gg, jetzt, z); }
    z.letzterSpionagebericht = b;
    return b;
  }
  var HINWEIS = { ja: "Bodenbewegungen erkennbar – möglicherweise weitere Schiffe im Hangar.", nein: "Keine Bodenbewegungen erkennbar." };

  /** Angriff einer Flotte f auf Gegner gg: simulieren, Verluste beidseitig anwenden, Trümmer am Gegner sammeln. */
  function angriff(z, f, gg, jetzt) {
    var kp = kampfPlanet(gg);
    var b = SS.kern.kampf.simuliere(kp.z, kp.p, { angreifer: f.schiffe, angreiferZustand: z });
    b.zeit = jetzt; b.ziel = { id: gg.id, name: gg.name, sektor: gg.sektor, system: gg.system, planet: gg.planet }; b.flotte = f.id;
    b.angreifer.forEach(function (x) { f.schiffe[x.id] = x.nachher; if (!f.schiffe[x.id]) delete f.schiffe[x.id]; });
    f.anzahl = Object.keys(f.schiffe).reduce(function (s, id) { return s + f.schiffe[id]; }, 0);
    SS.kern.kampf.anwenden(kp.z, kp.p, b);
    gg.schiffe = kp.p.schiffe; gg.verteidigung = {}; Object.keys(kp.p.verteidigung).forEach(function (id) { if (kp.p.verteidigung[id] > 0) gg.verteidigung[id] = kp.p.verteidigung[id]; });
    gg.solarsatelliten = kp.p.solarsatelliten;
    gg.truemmer = gg.truemmer || leerT();
    ["metall", "silizium"].forEach(function (r) { gg.truemmer.orbit[r] += b.truemmerOrbit[r]; gg.truemmer.boden[r] += b.schrottBoden[r]; });
    // t33u: Auto-Bergung – Sieg + überlebende Wracksammler in der Angriffsflotte → Orbit-Trümmer nach Phase 2 einsammeln.
    // Boden-Schrott gehört immer dem Planetenbesitzer (Angreifer kann ihn nie sammeln).
    b.geborgen = (b.sieger === "angreifer" && f.schiffe.wracksammler > 0) ? berge(f, gg) : null;
    // 0.20.0 (Sandro t52u): Beute nach Sieg – Laderaum der Angreiferflotte, M:Si:Öl 3:2:1, wenig Kunststoff (T1:T2:T3 6:3:1)
    if (b.sieger === "angreifer" && f.anzahl && SS.kern.bergung) { gg.rohstoffe = gg.rohstoffe || {}; var bt = SS.kern.bergung.pluendere(f, gg.rohstoffe); b.beute = bt.summe ? bt.beute : null; b.beuteKapazitaet = bt.kapazitaet; }
    f.kampfbericht = b; SS.kern.expedition.merkeKampfbericht(z, b);
    return b;
  }

  /** Orbit-Trümmer am Gegner mit den Wracksammlern der Flotte bergen (Kapazität = ladung je Wracksammler). → {metall, silizium, kapazitaet, restOrbit} */
  function berge(f, gg) {
    var kap = (f.schiffe.wracksammler || 0) * (D().schiffNachId("wracksammler").ladung || 0), frei = kap;
    gg.truemmer = gg.truemmer || leerT();
    var g = { metall: 0, silizium: 0, kapazitaet: kap };
    ["metall", "silizium"].forEach(function (r) { var n = Math.min(frei, gg.truemmer.orbit[r]); g[r] = n; frei -= n; gg.truemmer.orbit[r] -= n; });
    g.restOrbit = { metall: gg.truemmer.orbit.metall, silizium: gg.truemmer.orbit.silizium };
    f.ladung = f.ladung || {};
    ["metall", "silizium"].forEach(function (r) { if (g[r] > 0) f.ladung[r] = (f.ladung[r] || 0) + g[r]; });
    if (!Object.keys(f.ladung).length) delete f.ladung;
    f.geborgen = g;
    return g;
  }
  var txtG = function (g) { return g.metall + " M / " + g.silizium + " Si"; };

  /** Ankunft einer Flotte bei einem Gegner. → Berichtstext oder null (kein Gegner). */
  function ankunft(z, f, jetzt) {
    var gg = gegnerAn(z, f.ziel);
    if (!gg) return null;
    if (f.mission === "spionieren") {
      var s = spionage(z, gg, jetzt); f.spionagebericht = s;
      var n = function (o) { return Object.keys(o).reduce(function (a, k) { return a + o[k]; }, 0); };
      return "Spionagebericht " + gg.name + ": " + n(s.schiffe) + " Schiffe, " + n(s.verteidigung) + " Verteidigungsanlagen – " + s.hinweis;
    }
    if (f.mission === "angriff") {
      var b = angriff(z, f, gg, jetzt);
      var sieg = { angreifer: "Sieg", verteidiger: "Niederlage", unentschieden: "Unentschieden" }[b.sieger];
      return "Angriff auf " + gg.name + ": " + sieg + " – Trümmer Orbit " + b.truemmerOrbit.metall + " M / " + b.truemmerOrbit.silizium + " Si, Boden " + b.schrottBoden.metall + " M / " + b.schrottBoden.silizium + " Si" +
        (b.geborgen ? " – Orbit geborgen: " + txtG(b.geborgen) : "") + (b.beute ? " – Beute: " + Object.keys(b.beute).map(function (k) { return b.beute[k] + " " + k; }).join(", ") : "") + (b.zivil.angreiferVernichtet ? " – Zivilschiffe der Flotte vernichtet" : "");
    }
    if (f.mission === "sammeln") {
      var g = berge(f, gg);
      return "Wracksammlung bei " + gg.name + ": Orbit geborgen " + txtG(g) + " (Rest Orbit " + txtG(g.restOrbit) + "; Boden-Schrott bleibt beim Besitzer)";
    }
    if (f.mission === "transportieren") return null; // Transport: Standard („abgeliefert“)
    return null;
  }

  /**
   * 0.16.1 (Sandro t41u): feste, beliebig gewählte Positionen im Heimatsystem – Testkolonie 3, Alpha 5, Beta 9.
   * Kollidiert eine davon mit der Heimatposition (oder einer schon vergebenen), wird die nächste freie Position 1–12 genommen.
   */
  var TEST_POSITIONEN = [3, 5, 9];
  function nachbarn(z, anzahl) {
    var h = z.heimat, W = SS.BALANCE.WELTRAUM || {}, max = W.PLANETEN_PRO_SYSTEM || 12, belegt = [h.planet], out = [];
    TEST_POSITIONEN.slice(0, anzahl).forEach(function (pos) {
      for (var i = 0; i < max && belegt.indexOf(pos) >= 0; i++) pos = pos % max + 1;
      belegt.push(pos); out.push({ sektor: h.sektor, system: h.system, planet: pos });
    });
    return out;
  }

  /**
   * Test-Seed (ÜBERSCHREIBT): Master an, Hauptplanet stark, Zweitplanet, 2 schwache Gegner (je ≤ 5 Einheiten), Favoriten.
   */
  function legeTestphaseAn(z, jetzt) {
    z.einstellungen = z.einstellungen || {}; z.einstellungen.master = true;
    var hp = z.planeten[0];
    // offene Aufträge sofort fertig (Master)
    if (hp.bauauftrag) hp.bauauftrag.ende = jetzt;
    (hp.werftauftraege || []).forEach(function (w) { w.ende = jetzt; });
    (hp.verteidigungsauftraege || []).forEach(function (w) { w.ende = jetzt; });
    if (z.forschungsauftrag) z.forschungsauftrag.ende = jetzt;
    ["metall", "silizium", "rohoel", "kunststoff_t1", "kunststoff_t2", "kunststoff_t3"].forEach(function (r) { if (r in z.rohstoffe) z.rohstoffe[r] = Math.max(z.rohstoffe[r], 1e8); });
    var geb = { metallmine: 10, siliziummine: 10, bohrstation: 5, solarfarm: 12, raumflughafen: 1, werft: 2, verteidigungswerft: 2, forschungseinrichtung: 2 };
    Object.keys(geb).forEach(function (id) { if (id in hp.gebaeude) hp.gebaeude[id] = Math.max(hp.gebaeude[id] || 0, geb[id]); });
    // Startplätze: A Stufe 10 + B Stufe 3 = 100 + 60 = 160 Plätze (ANNAHME)
    hp.startplaetze.forEach(function (sp) { if (sp.buchstabe === "A") sp.stufe = 10; if (sp.buchstabe === "B") sp.stufe = Math.max(sp.stufe, 3); });
    // Test-Seed Flotte (ANNAHME): 36 Kampfschiffe + Frachter + Sonden
    hp.schiffe = { korvette: 12, zerstoerer: 10, kreuzer: 8, kleine_drohne: 6, kleiner_frachter: 6, mittlerer_frachter: 2, spionagesonde: 5, wracksammler: 4 }; // 0.14.2: Wracksammler für Bergung
    hp.verteidigung = { raketenbatterie: 10, laserturm: 6, pulslaser: 2, orbitalverteidigungsplattform: 1 };
    z.forschung.laser = Math.max(z.forschung.laser || 0, 1);
    // Zweitplanet + Gegner auf Nachbar-Positionen im Heimatsystem
    var nb = nachbarn(z, 3);
    var kol = z.planeten.filter(function (p) { return p.id === "test-kolonie"; })[0];
    if (!kol) { kol = SS.kern.zustand.neuerPlanet(false); kol.id = "test-kolonie"; z.planeten.push(kol); }
    kol.name = "Testkolonie"; kol.koordinaten = nb[0]; kol.schiffe = { kleiner_frachter: 1 }; kol.verteidigung = {};
    kol.gebaeude.raumflughafen = 1; kol.startplaetze[0].stufe = 1;
    z.gegner = [
      { id: "alpha", name: "Testgegner Alpha", sektor: nb[1].sektor, system: nb[1].system, planet: nb[1].planet,
        schiffe: { kleine_drohne: 3, aufklaerer: 1 }, verteidigung: { raketenbatterie: 1 }, solarsatelliten: 0, rohstoffe: { metall: 60000, silizium: 40000, rohoel: 20000, kunststoff_t1: 3000, kunststoff_t2: 1000 }, truemmer: leerT() },
      { id: "beta", name: "Testgegner Beta", sektor: nb[2].sektor, system: nb[2].system, planet: nb[2].planet,
        schiffe: { kleine_drohne: 1 }, verteidigung: { maschinennest: 2, laserturm: 2 }, solarsatelliten: 0, rohstoffe: { metall: 30000, silizium: 20000, rohoel: 10000 }, truemmer: leerT() }
    ];
    z.flotten = []; // ANNAHME: laufende Flüge verwerfen (sauberer Testbeginn)
    z.favoriten = z.favoriten || [];
    var fav = function (k, name) { z.favoriten = z.favoriten.filter(function (f) { return !gleich(f, k); }); z.favoriten.push({ name: name, sektor: k.sektor, system: k.system, planet: k.planet }); };
    fav(kol.koordinaten, "Testkolonie"); z.gegner.forEach(function (x) { fav(x, x.name); });
    z.letzterKampfbericht = null; z.kampfberichte = []; z.letzterSpionagebericht = null;
    return z;
  }

  SS.kern.testphase = { alleGegner: alleGegner, bereinige: bereinige, gegnerAn: gegnerAn, kampfPlanet: kampfPlanet, spionage: spionage, angriff: angriff, ankunft: ankunft, berge: berge, legeTestphaseAn: legeTestphaseAn, TEST_POSITIONEN: TEST_POSITIONEN };
})(typeof globalThis !== "undefined" ? globalThis : this);
