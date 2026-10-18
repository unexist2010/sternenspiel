/*
 * Sternenspiel – Weltraum-Hierarchie: Universum → Sektor → Sonnensystem → Planet.
 * FEST (Sandro): 1 Universum, 5 Sektoren, 300 Sonnensysteme, 12 Planeten je System (= 3.600 Planeten).
 * FEST: Planetengrößen und Feldlimits werden ignoriert (es gibt dafür keine Daten und keine Anzeige).
 *
 * ANNAHMEN:
 *  - 60 Systeme je Sektor; Systemnummern laufen global 1–300 (Sektor 1 = 1–60, Sektor 2 = 61–120 …).
 *  - Koordinaten „Sektor:System:Planet“, z. B. 2:75:6.
 *  - Namen (Universum, Sektoren, Systeme, Planeten), Sterntyp und Planetentyp sind rein optisch und
 *    werden deterministisch aus der Nummer erzeugt (jeder Spieler sieht dasselbe Universum).
 *  - Nichts davon wird im Spielstand gespeichert – nur die Koordinaten des Hauptplaneten.
 *  - Der Hauptplanet liegt auf einer zufälligen Koordinate (siehe zufaelligeKoordinate).
 */
(function (g) {
  "use strict";
  var SS = (g.SS = g.SS || {});
  SS.DATEN = SS.DATEN || {};

  var W = SS.BALANCE.WELTRAUM;
  var PRO_SEKTOR = W.SYSTEME_GESAMT / W.SEKTOREN; // 60

  var UNIVERSUM_NAME = "Sternenreich";                                     // ANNAHME
  var SEKTOR_NAMEN = ["Alpha", "Beta", "Gamma", "Delta", "Epsilon"];       // ANNAHME
  var SILBEN_A = ["Ka", "Ve", "Or", "Ty", "Ma", "Se", "Lu", "Dra", "Ix", "No", "Ze", "Pha", "Qua", "Ri", "Bel", "Cor", "Hel", "Sy"];
  var SILBEN_B = ["ri", "lon", "ra", "the", "nis", "dor", "vex", "ta", "mir", "sar", "leo", "dan", "rux", "phi", "len", "go"];
  var SILBEN_C = ["", "", "a", "on", "is", "us", "ar", "ia", " Prime", " Minor"];
  var STERNTYPEN = [
    { id: "gelb", name: "Gelber Stern" }, { id: "rot", name: "Roter Zwerg" }, { id: "blau", name: "Blauer Riese" },
    { id: "weiss", name: "Weißer Zwerg" }, { id: "orange", name: "Oranger Stern" }
  ];
  // Rein optische Planetentypen (KEINE Größe, KEINE Felder)
  var PLANETENTYPEN = [
    { id: "lava", name: "Lavawelt" }, { id: "wueste", name: "Wüstenwelt" }, { id: "gestein", name: "Gesteinswelt" },
    { id: "ozean", name: "Ozeanwelt" }, { id: "gas", name: "Gasriese" }, { id: "eis", name: "Eiswelt" }
  ];
  var ROEMISCH = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

  // Kleiner deterministischer Zufallsgenerator (mulberry32)
  function zufall(saat) {
    var a = saat >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function wahl(r, liste) { return liste[Math.floor(r() * liste.length)]; }
  function ganz(n) { return typeof n === "number" && isFinite(n) && Math.floor(n) === n; }

  function sektorGueltig(s) { return ganz(s) && s >= 1 && s <= W.SEKTOREN; }
  function systemGueltig(n) { return ganz(n) && n >= 1 && n <= W.SYSTEME_GESAMT; }
  function planetGueltig(p) { return ganz(p) && p >= 1 && p <= W.PLANETEN_PRO_SYSTEM; }

  function sektorVonSystem(n) { return Math.floor((n - 1) / PRO_SEKTOR) + 1; }

  function sektor(s) {
    if (!sektorGueltig(s)) return null;
    return {
      nummer: s,
      name: "Sektor " + SEKTOR_NAMEN[s - 1],
      systemVon: (s - 1) * PRO_SEKTOR + 1,
      systemBis: s * PRO_SEKTOR
    };
  }

  var systemCache = {};
  function system(n) {
    if (!systemGueltig(n)) return null;
    if (systemCache[n]) return systemCache[n];
    var r = zufall(n * 7919 + 13);
    var name = wahl(r, SILBEN_A) + wahl(r, SILBEN_B) + wahl(r, SILBEN_C);
    var stern = wahl(r, STERNTYPEN);
    var sys = { nummer: n, sektor: sektorVonSystem(n), name: name, stern: stern, planeten: [] };
    for (var p = 1; p <= W.PLANETEN_PRO_SYSTEM; p++) sys.planeten.push(erzeugePlanet(sys, p));
    Object.freeze(sys.planeten);
    systemCache[n] = Object.freeze(sys);
    return sys;
  }

  function erzeugePlanet(sys, pos) {
    var r = zufall(sys.nummer * 104729 + pos * 31);
    // Innen eher heiß, außen eher kalt/Gas – nur für das Aussehen
    var zone = pos <= 3 ? [0, 0, 1, 2] : pos <= 8 ? [1, 2, 2, 3, 3, 4] : [4, 4, 5, 5, 2];
    var typ = PLANETENTYPEN[wahl(r, zone)];
    return Object.freeze({
      sektor: sys.sektor, system: sys.nummer, position: pos,
      name: sys.name + " " + ROEMISCH[pos - 1],
      typ: typ,
      koordinaten: sys.sektor + ":" + sys.nummer + ":" + pos
    });
  }

  function planet(sys, pos) {
    var s = system(sys);
    return s && planetGueltig(pos) ? s.planeten[pos - 1] : null;
  }

  function universum() {
    var liste = [];
    for (var s = 1; s <= W.SEKTOREN; s++) liste.push(sektor(s));
    return { name: UNIVERSUM_NAME, sektoren: liste };
  }

  /** Text „S:SYS:P“ → {sektor, system, planet} oder null (Sektor muss zum System passen). */
  function leseKoordinaten(text) {
    var m = /^\s*(\d+)\s*:\s*(\d+)\s*:\s*(\d+)\s*$/.exec(String(text || ""));
    if (!m) return null;
    var k = { sektor: +m[1], system: +m[2], planet: +m[3] };
    if (!sektorGueltig(k.sektor) || !systemGueltig(k.system) || !planetGueltig(k.planet)) return null;
    if (sektorVonSystem(k.system) !== k.sektor) return null;
    return k;
  }

  function koordinatenText(k) { return k.sektor + ":" + k.system + ":" + k.planet; }

  /**
   * ANNAHME: Zufällige Start-Koordinate für den Hauptplaneten (wie beim klassischen Spielstart ohne Auswahl).
   * Im Solo-Spiel sind alle anderen Planeten frei; „besetzt“ (z. B. KI in einem späteren Kapitel) kann übergeben werden.
   * @param {function():number} [zufallFn] Zufallsquelle 0..1 (Standard Math.random; Tests geben eine feste vor)
   * @param {function(object):boolean} [istBesetzt]
   */
  function zufaelligeKoordinate(zufallFn, istBesetzt) {
    var r = zufallFn || Math.random;
    for (var versuch = 0; versuch < 1000; versuch++) {
      var n = 1 + Math.floor(r() * W.SYSTEME_GESAMT);
      var k = { sektor: sektorVonSystem(n), system: n, planet: 1 + Math.floor(r() * W.PLANETEN_PRO_SYSTEM) };
      if (!istBesetzt || !istBesetzt(k)) return k;
    }
    throw new Error("Keine freie Koordinate gefunden");
  }

  SS.DATEN.weltraum = {
    SYSTEME_PRO_SEKTOR: PRO_SEKTOR,
    PLANETENTYPEN: PLANETENTYPEN,
    STERNTYPEN: STERNTYPEN,
    universum: universum,
    sektor: sektor,
    system: system,
    planet: planet,
    sektorVonSystem: sektorVonSystem,
    leseKoordinaten: leseKoordinaten,
    koordinatenText: koordinatenText,
    zufaelligeKoordinate: zufaelligeKoordinate,
    zufall: zufall,
    anzahlPlaneten: function () { return W.SYSTEME_GESAMT * W.PLANETEN_PRO_SYSTEM; }
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
