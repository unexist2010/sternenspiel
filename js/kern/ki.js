/*
 * Sternenspiel – KI-Grundlage (0.20.0/0.20.1, Sandro t53–t55u).
 * NPC-Planeten leben in z.ki.npc (gleiches Format wie z.gegner) mit Zusatzfeld ki = { art, faktor, seit, tfSeit }; Alpha/Beta (ohne ki) bleiben.
 * FEST:
 *  - Arten: siedler (viel Verteidigung/„Minen“, Schiffe meist zivil, wachsen langsam nach, viele Rohstoffe = lukrativ),
 *    pirat (wenige Planeten, Kampfschiffe; „überfallen“ Siedler → nur Orbit-Trümmer am Siedler sichtbar, kein Bericht/Flug),
 *    rivale (5 im Universum, anfangs inaktiv, ab RIVALEN_AKTIV_TAGE aktiv; greifen den Spieler NIE an).
 *  - Stärke folgt den Spielerpunkten (Sandro pt55u): max. +10 %; ≈10 % stärker, ≈15 % gleich/leicht schwächer, Rest deutlich schwächer.
 *  - Trümmerfelder an KI-Planeten wachsen bei weiteren Überfällen und verschwinden nach max. 7 Tagen.
 *  - ≤5 neue Planeten/Tag; ≤50 % Belegung je System (Siedler+Piraten); keine direkten Nachbarpositionen (nicht in Reihe).
 *  - 0.20.1 (Sandro pt57u FEST): Die KI-Welt lebt NUR an Tagen, an denen der Spieler aktiv spielt. Pro aktivem Kalendertag
 *    (= Tick bei geöffnetem/geladenem Spiel) wird genau EIN Welt-Tag simuliert (Wachstum, Überfälle, TF-Alter, neue Planeten,
 *    Rivalen-Countdown). Offline-Tage werden NICHT nachgezogen – die Welt steht still. Alle KI-Tagesangaben (seit, tfSeit)
 *    zählen in Spieltagen (z.ki.spieltag). Minen-Offline-Produktion ist davon unberührt.
 *  - Kein Diplo/Allianz, keine KI-Expedition, kein KI-Koloniekrieg, keine Angriffe auf den Spieler.
 *  - 0.21.0 (Sandro pt61u FEST): KI siedelt rund um das Heimatsystem (auf+ab), nahe zuerst, fern eher schwächer (durchmischt).
 * ANNAHME: KI siedelt nicht in Systemen mit eigenen Planeten oder Testgegnern (leichtes Early Game, Testphase unverändert).
 */
(function (g) {
  "use strict";
  var SS = (g.SS = g.SS || {});
  SS.kern = SS.kern || {};
  var TAG = 86400000;
  var K = {
    NEU_PRO_TAG_MAX: 5, NEU_PRO_TAG_MIN: 2, BELEGUNG_MAX: 0.5, RIVALEN: 5, RIVALEN_AKTIV_TAGE: 14, RIVALE_INAKTIV_FAKTOR: 0.5,
    PIRATEN_ANTEIL: 0.1, PIRAT_UEBERFALL_CHANCE: 0.35, TF_MAX_TAGE: 7, NPC_MAX: 400,
    MAX_UEBER_SPIELER: 1.10, DRIFT: 0.05, MIN_PUNKTE: 20,
    STREU_START: 2, STREU_JE_NPC: 1 / 6, NAH_ABSTAND: 5, FERN_ABZUG_JE_SYSTEM: 0.02, FERN_MIN: 0.45, FERN_MIX: 0.3, RIVALEN_STREU: 12,
    NACHWUCHS: { siedler: 0.15, pirat: 0.35, rivale: 0.25 } // Anteil des Defizits, der pro Tag nachwächst
  };
  var MIX = { // Aufteilung des Werts (Rohstoff-Äquivalent)
    siedler: { def: 0.65, schiffe: 0.35, zivil: 0.8, lager: 0.6, defListe: ["raketenbatterie", "laserturm", "maschinennest", "pulslaser", "schildkuppel"], kampf: ["kleine_drohne", "aufklaerer"], ziv: ["kleiner_frachter", "mittlerer_frachter", "grosser_frachter"] },
    pirat: { def: 0.2, schiffe: 0.8, zivil: 0.1, lager: 0.15, defListe: ["raketenbatterie", "laserturm"], kampf: ["kleine_drohne", "mittlere_drohne", "korvette", "fregatte"], ziv: ["kleiner_frachter"] },
    rivale: { def: 0.45, schiffe: 0.55, zivil: 0.3, lager: 0.3, defListe: ["raketenbatterie", "laserturm", "pulslaser", "ionengeschuetz"], kampf: ["kleine_drohne", "korvette", "fregatte", "zerstoerer"], ziv: ["kleiner_frachter", "mittlerer_frachter"] }
  };
  var NAMEN = { siedler: "Siedlung", pirat: "Piratennest", rivale: "Rivale" };

  function zufall(saat) { var a = saat >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  var tagVon = function (ms) { return Math.floor(ms / TAG); };
  var gleich = function (a, b) { return a.sektor === b.sektor && a.system === b.system && a.planet === b.planet; };
  var W = function () { return SS.DATEN.weltraum; };
  function kosten(d) { var c = d.kosten || {}; return (c.metall || 0) + (c.silizium || 0) + (c.rohoel || 0); }

  /** Faktor relativ zu Spielerpunkten (Verteilung FEST pt55u). */
  function wuerfleFaktor(r) {
    var x = r();
    if (x < 0.10) return 1.0 + r() * (K.MAX_UEBER_SPIELER - 1.0);
    if (x < 0.25) return 0.9 + r() * 0.1;
    return 0.35 + r() * 0.55;
  }
  function effFaktor(n, tag) {
    var f = Math.min(K.MAX_UEBER_SPIELER, n.ki.faktor);
    if (n.ki.art === "rivale" && !aktiv(n, tag)) f *= K.RIVALE_INAKTIV_FAKTOR;
    return f;
  }
  function aktiv(n, tag) { return n.ki.art !== "rivale" || tag - n.ki.seit >= K.RIVALEN_AKTIV_TAGE; }
  function punkte(z, n, tag) { return Math.round(Math.max(K.MIN_PUNKTE * n.ki.faktor, (z.punkte || 0) * effFaktor(n, tag))); }

  /** Zielbestand aus Punkten (Rohstoff-Äquivalent = Punkte × JE_ROHSTOFFE). */
  function zielBestand(n, pkt) {
    var D = SS.DATEN, wert = pkt * SS.BALANCE.PUNKTE.JE_ROHSTOFFE, m = MIX[n.ki.art];
    var fuell = function (liste, budget, nach) { var out = {}, je = budget / liste.length;
      liste.forEach(function (id) { var d = nach(id); if (!d) return; var c = Math.max(1, kosten(d)), a = Math.floor(je / c); if (a > 0) out[id] = a; }); return out; };
    var sb = wert * m.schiffe;
    var sch = fuell(m.ziv, sb * m.zivil, D.schiffNachId), kampf = fuell(m.kampf, sb * (1 - m.zivil), D.schiffNachId);
    Object.keys(kampf).forEach(function (id) { sch[id] = (sch[id] || 0) + kampf[id]; });
    var r = Math.floor(wert * m.lager);
    return { schiffe: sch, verteidigung: fuell(m.defListe, wert * m.def, D.verteidigungNachId),
      rohstoffe: { metall: Math.floor(r * 0.5), silizium: Math.floor(r * 0.33), rohoel: Math.floor(r * 0.17) } };
  }
  function naehere(ist, soll, rate) {
    var out = {};
    Object.keys(soll).concat(Object.keys(ist || {})).forEach(function (id) {
      var a = (ist && ist[id]) || 0, b = soll[id] || 0, n = a < b ? a + Math.ceil((b - a) * rate) : b; // über Soll → sofort auf Soll
      if (n > 0) out[id] = n;
    });
    return out;
  }

  function besetzt(z) {
    var l = (z.gegner || []).concat(z.ki.npc || []).map(function (x) { return { sektor: x.sektor, system: x.system, planet: x.planet, ki: x.ki }; });
    return l.concat(SS.kern.flotte.eigenePlaneten(z));
  }
  function gesperrteSysteme(z) {
    var s = {}; SS.kern.flotte.eigenePlaneten(z).forEach(function (e) { s[e.system] = 1; });
    (z.gegner || []).forEach(function (x) { if (!x.ki) s[x.system] = 1; }); return s;
  }
  /**
   * Freie Position nach FEST-Regeln (≤50 % KI-Belegung, keine Nachbarposition belegt). null wenn nichts frei.
   * 0.21.0 (Sandro pt61u): KI füllt sich RUND UM das Heimatsystem des Spielers auf (aufwärts UND abwärts, auch über Sektorgrenzen).
   * Abstand d = 1 + ⌊r² · Streu⌋, Streu = STREU_START + Anzahl KI · STREU_JE_NPC (wächst mit der Welt) → nahe Systeme zuerst.
   * opt.streu überschreibt die Streuung (Rivalen). Rückgabe enthält abstand (Systeme zum Heimatsystem).
   */
  function suchePosition(z, r, opt) {
    opt = opt && typeof opt === "object" ? opt : {};
    var B = SS.BALANCE.WELTRAUM, sperre = gesperrteSysteme(z), alle = besetzt(z), heim = heimSystem(z);
    var anzahl = ((z.ki && z.ki.npc) || []).length, streu = opt.streu || (K.STREU_START + anzahl * K.STREU_JE_NPC);
    for (var v = 0; v < 60; v++) {
      var x = r(), d = 1 + Math.floor(x * x * streu + v / 6), sys = heim + (r() < 0.5 ? -d : d); // bei Fehlversuchen langsam weiter raus
      if (sys < 1 || sys > B.SYSTEME_GESAMT) sys = heim * 2 - sys; // am Rand spiegeln
      if (sys < 1 || sys > B.SYSTEME_GESAMT || sperre[sys]) continue;
      var hier = alle.filter(function (x) { return x.system === sys; });
      var kiZahl = hier.filter(function (x) { return x.ki && x.ki.art !== "rivale"; }).length;
      if (kiZahl + 1 > Math.floor(B.PLANETEN_PRO_SYSTEM * K.BELEGUNG_MAX)) continue;
      var pos = 1 + Math.floor(r() * B.PLANETEN_PRO_SYSTEM);
      if (hier.some(function (x) { return Math.abs(x.planet - pos) <= 1; })) continue;
      return { sektor: W().sektorVonSystem(sys), system: sys, planet: pos, abstand: Math.abs(sys - heim) };
    }
    return null;
  }
  function heimSystem(z) { return z.planeten && z.planeten.length ? SS.kern.flotte.herkunftKoord(z, z.planeten[0]).system : (SS.BALANCE.WELTRAUM.START_SYSTEM || 50); }
  /** 0.21.0: nahe KI wächst mit dem Spieler, weiter weg eher schwächer – aber durchmischt (FERN_MIX bleibt ungedämpft). */
  function abstandsFaktor(r, d) {
    if (!(d > K.NAH_ABSTAND) || r() < K.FERN_MIX) return 1;
    return Math.max(K.FERN_MIN, 1 - (d - K.NAH_ABSTAND) * K.FERN_ABZUG_JE_SYSTEM);
  }
  function neuerNpc(z, r, art, tag, k) {
    z.ki.zaehler = (z.ki.zaehler || 0) + 1;
    var n = { id: "ki-" + z.ki.zaehler, name: NAMEN[art] + " " + z.ki.zaehler, sektor: k.sektor, system: k.system, planet: k.planet,
      schiffe: {}, verteidigung: {}, rohstoffe: {}, solarsatelliten: 0, truemmer: { orbit: { metall: 0, silizium: 0 }, boden: { metall: 0, silizium: 0 } },
      ki: { art: art, faktor: Math.max(0.05, (art === "pirat" ? Math.min(wuerfleFaktor(r), 0.9) : wuerfleFaktor(r)) * (art === "rivale" ? 1 : abstandsFaktor(r, k.abstand))), seit: tag, tfSeit: null } };
    var soll = zielBestand(n, punkte(z, n, tag));
    // Neue Planeten starten bei 40 % ihres Solls (leichtes Early Game)
    n.schiffe = naehere({}, soll.schiffe, 0.4); n.verteidigung = naehere({}, soll.verteidigung, 0.4); n.rohstoffe = soll.rohstoffe;
    z.ki.npc.push(n); return n;
  }
  function npcs(z, art) { return ((z.ki && z.ki.npc) || []).filter(function (x) { return x.ki && (!art || x.ki.art === art); }); }

  function initialisiere(z, jetzt) {
    var tag = tagVon(jetzt);
    z.ki = { saat: (Math.floor(jetzt) ^ 0x5eed) >>> 0, letzterTag: tag, spieltag: tag, zaehler: 0, start: tag, npc: [] };
    var r = zufall(z.ki.saat);
    for (var i = 0; i < K.RIVALEN; i++) { var k = suchePosition(z, r, { streu: K.RIVALEN_STREU }); if (k) neuerNpc(z, r, "rivale", tag, k); }
  }

  function heimSektor(z) { return SS.kern.flotte.herkunftKoord(z, z.planeten[0]).sektor; }

  /** Ein Tag Welt-Simulation. */
  function simuliereTag(z, tag, meld) {
    var r = zufall(z.ki.saat + tag * 9973), alle = npcs(z);
    // 1) Wachstum zum Soll
    alle.forEach(function (n) {
      if (n.ki.art === "rivale" && !aktiv(n, tag)) return;
      var soll = zielBestand(n, punkte(z, n, tag)), rate = K.NACHWUCHS[n.ki.art];
      n.schiffe = naehere(n.schiffe, soll.schiffe, rate); n.verteidigung = naehere(n.verteidigung, soll.verteidigung, rate);
      ["metall", "silizium", "rohoel"].forEach(function (id) { var a = n.rohstoffe[id] || 0, b = soll.rohstoffe[id]; n.rohstoffe[id] = a < b ? a + Math.ceil((b - a) * 0.3) : a; });
    });
    // 2) Trümmer-Alter: nach TF_MAX_TAGE weg
    alle.forEach(function (n) {
      var o = n.truemmer.orbit, hat = o.metall + o.silizium > 0;
      if (!hat) { n.ki.tfSeit = null; return; }
      if (n.ki.tfSeit === null || n.ki.tfSeit === undefined) n.ki.tfSeit = tag;
      if (tag - n.ki.tfSeit >= K.TF_MAX_TAGE) { o.metall = 0; o.silizium = 0; n.ki.tfSeit = null; }
    });
    // 3) Piraten-Überfälle auf Siedler (nur Orbit-TF, kein Bericht)
    var siedler = npcs(z, "siedler");
    if (siedler.length) npcs(z, "pirat").forEach(function (p) {
      if (r() >= K.PIRAT_UEBERFALL_CHANCE) return;
      var nah = siedler.filter(function (s) { return s.sektor === p.sektor; }), ziel = (nah.length ? nah : siedler)[Math.floor(r() * (nah.length || siedler.length))];
      var verlust = 0;
      ["schiffe", "verteidigung"].forEach(function (t) { Object.keys(ziel[t]).forEach(function (id) {
        var d = t === "schiffe" ? SS.DATEN.schiffNachId(id) : SS.DATEN.verteidigungNachId(id), weg = Math.floor(ziel[t][id] * (0.05 + r() * 0.1));
        if (weg > 0 && d) { ziel[t][id] -= weg; verlust += weg * kosten(d); if (!ziel[t][id]) delete ziel[t][id]; } }); });
      var tf = Math.max(2000, Math.floor(verlust * 0.3)); // ANNAHME: 30 % als Orbit-Trümmer, mind. 2.000
      ziel.truemmer.orbit.metall += Math.floor(tf * 0.6); ziel.truemmer.orbit.silizium += Math.floor(tf * 0.4);
      if (ziel.ki.tfSeit === null || ziel.ki.tfSeit === undefined) ziel.ki.tfSeit = tag; // wächst, Alter läuft ab erstem TF
    });
    // 4) Neue Planeten (≤5/Tag)
    if (npcs(z).length < K.NPC_MAX) {
      var neu = K.NEU_PRO_TAG_MIN + Math.floor(r() * (K.NEU_PRO_TAG_MAX - K.NEU_PRO_TAG_MIN + 1));
      for (var i = 0; i < neu; i++) {
        var pir = npcs(z, "pirat").length, sie = npcs(z, "siedler").length;
        var art = (pir < Math.max(1, Math.floor((sie + 1) * K.PIRATEN_ANTEIL)) && r() < 0.3) ? "pirat" : "siedler";
        var k = suchePosition(z, r);
        if (k) neuerNpc(z, r, art, tag, k);
      }
    }
    // 5) Rivale wird aktiv → Meldung
    npcs(z, "rivale").forEach(function (n) { if (tag - n.ki.seit === K.RIVALEN_AKTIV_TAGE && meld) meld.push({ art: "ki", text: n.name + " ist aktiv geworden." }); });
  }

  /** Aktueller Spieltag (zählt nur aktive Tage). Ohne z/ältere Stände: Kalendertag. */
  function spielTag(z, jetzt) { return z && z.ki && isFinite(z.ki.spieltag) ? z.ki.spieltag : tagVon(jetzt); }

  /** Tick-Hook (0.20.1): neuer Kalendertag mit Aktivität → genau EIN Welt-Tag. Offline-Tage werden nicht nachgezogen. */
  function tick(z, jetzt) {
    if (!z || !z.planeten || !z.planeten.length) return [];
    if (!z.ki || typeof z.ki !== "object" || !isFinite(z.ki.letzterTag)) initialisiere(z, jetzt);
    if (!isFinite(z.ki.spieltag)) z.ki.spieltag = z.ki.letzterTag; // Migration 0.20.0 → Spieltage stetig weiterzählen
    var heute = tagVon(jetzt), meld = [];
    if (heute <= z.ki.letzterTag) return meld;
    z.ki.spieltag += 1;
    simuliereTag(z, z.ki.spieltag, meld);
    z.ki.letzterTag = heute;
    return meld;
  }

  /** Spionage-Drift: täglich leicht ± (deterministisch je Planet+Tag), max. ±DRIFT. */
  function driftFaktor(z, n, jetzt) {
    var h = 0, s = String(n.id); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    var r = zufall(((z.ki && z.ki.saat) || 1) ^ h ^ (tagVon(jetzt) * 2654435761));
    return 1 + (r() * 2 - 1) * K.DRIFT;
  }
  function drift(z, n, liste, jetzt) {
    var f = driftFaktor(z, n, jetzt), out = {};
    Object.keys(liste || {}).forEach(function (id) { var v = Math.max(0, Math.round(liste[id] * f)); if (v > 0 || liste[id] > 0) out[id] = Math.max(liste[id] > 0 ? 1 : 0, v); });
    return out;
  }
  function tfAlterTage(n, jetzt, z) { return n.ki && n.ki.tfSeit !== null && n.ki.tfSeit !== undefined ? spielTag(z, jetzt) - n.ki.tfSeit : null; }
  function bereinigeKi(x) {
    if (!x || typeof x !== "object" || !MIX[x.art]) return undefined;
    return { art: x.art, faktor: Math.max(0.05, Math.min(K.MAX_UEBER_SPIELER, Number(x.faktor) || 0.5)), seit: Math.floor(Number(x.seit) || 0),
      tfSeit: x.tfSeit === null || x.tfSeit === undefined ? null : Math.floor(Number(x.tfSeit) || 0) };
  }

  SS.kern.ki = { K: K, TAG: TAG, tick: tick, initialisiere: initialisiere, simuliereTag: simuliereTag, punkte: function (z, n, jetzt) { return punkte(z, n, spielTag(z, jetzt)); },
    aktiv: function (n, jetzt, z) { return aktiv(n, spielTag(z, jetzt)); }, spielTag: spielTag, zielBestand: zielBestand, suchePosition: suchePosition, abstandsFaktor: abstandsFaktor, heimSystem: heimSystem, npcs: npcs,
    driftFaktor: driftFaktor, drift: drift, tfAlterTage: tfAlterTage, bereinigeKi: bereinigeKi, wuerfleFaktor: wuerfleFaktor, zufall: zufall, NAMEN: NAMEN };
})(typeof globalThis !== "undefined" ? globalThis : this);
