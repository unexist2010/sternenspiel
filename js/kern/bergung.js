/*
 * Sternenspiel – 0.20.0 (Sandro t52u): Beute, Flotten-Rückruf, Angriffsschild, Bergung (Boden-/Wracksammlung). DOM-frei, in Node testbar.
 *
 * BEUTE (nach Sieg): nur Laderaum der normalen Frachter/Kampfschiffe (Wrack-/Bodensammler haben eigenen Spezial-Laderaum → zählen nicht).
 *   - Metall : Silizium : Rohöl = 3 : 2 : 1 (FEST Sandro).
 *   - Kunststoff „wenig“: höchstens KUNSTSTOFF_ANTEIL (5 %) des Laderaums, nur wenn am Ziel vorhanden, T1 : T2 : T3 = 6 : 3 : 1 (ANNAHME).
 *   - Strom/Antimaterie nie. Plünderbar = PLUENDER_ANTEIL (50 %, OGame) des Ziel-Bestands (ANNAHME). Reicht ein Rohstoff nicht,
 *     wird der freie Laderaum auf die übrigen (gleiches Verhältnis) verteilt – bis Laderaum voll oder Ziel leer.
 * RÜCKRUF: Hinflug/Halten → sofort Rückflug (Rückweg = bereits geflogene Zeit). Keine Zusatzkosten.
 *   Erstattung Rohöl = bezahltes Rohöl × noch nicht geflogener Anteil des Hinflugs (Halten: 0 – Hinflug komplett).
 * ANGRIFFSSCHILD (Bonusgegenstand, vorerst frei aktivierbar): je eigenem Planeten. Aktiv SCHILD.DAUER_H Stunden; solange aktiv werden
 *   Angriffe auf den Planeten ohne Kampf abgewehrt (keine Verluste, keine Beute). Kosten SCHILD.KOSTEN_ROHOEL, danach Abklingzeit
 *   SCHILD.ABKLING_H. Startet der Planet selbst einen Angriff, erlischt sein Schild sofort (kein Angriff aus der Deckung). Alle Zahlen ANNAHME.
 * BERGUNG: Bodensammlung = nur eigene Koordinaten, nur Bodensammler, Boden-Schrott. Wracksammlung (Mission „sammeln“) = nur Wracksammler,
 *   eigene Koordinaten oder fremdes Trümmerfeld. Ziel = aktueller Planet erlaubt (kurzer Flug, Entfernung DIST_GLEICH).
 */
(function (g) {
  "use strict";
  var SS = (g.SS = g.SS || {});
  SS.kern = SS.kern || {};
  var D = function () { return SS.DATEN; };
  var B = function () { return SS.BALANCE.BEUTE; };
  var S = function () { return SS.BALANCE.SCHILD; };
  var summe = function (o) { return Object.keys(o || {}).reduce(function (s, k) { return s + (o[k] || 0); }, 0); };

  /** Beute-Laderaum: alle Schiffe mit Ladung ohne Spezial-Laderaum (ladungArt). */
  function beuteKapazitaet(schiffe, ladung) {
    var kap = Object.keys(schiffe || {}).reduce(function (s, id) { var x = D().schiffNachId(id); return s + (x && !x.ladungArt ? (x.ladung || 0) * schiffe[id] : 0); }, 0);
    return Math.max(0, kap - summe(ladung));
  }
  /** Verteilt kap nach Gewichten auf verfuegbar (gekappt), freier Rest geht an die übrigen. → {id:n} */
  function verteile(kap, gewichte, verfuegbar) {
    var out = {}, rest = Math.floor(kap), aktiv = Object.keys(gewichte).filter(function (id) { return (verfuegbar[id] || 0) >= 1; });
    while (rest > 0 && aktiv.length) {
      var gs = aktiv.reduce(function (s, id) { return s + gewichte[id]; }, 0), verteilt = 0;
      aktiv.forEach(function (id) {
        var will = Math.max(1, Math.floor(rest * gewichte[id] / gs)), n = Math.min(will, verfuegbar[id] - (out[id] || 0), rest - verteilt);
        if (n > 0) { out[id] = (out[id] || 0) + n; verteilt += n; }
      });
      rest -= verteilt;
      aktiv = aktiv.filter(function (id) { return verfuegbar[id] - (out[id] || 0) >= 1; });
      if (!verteilt) break;
    }
    return out;
  }
  /** Beute berechnen (ohne anzuwenden). bestand = Rohstoffe des Ziels. */
  function beuteBerechnen(schiffe, ladung, bestand) {
    var kap = beuteKapazitaet(schiffe, ladung), b = B(), verf = {};
    Object.keys(b.VERHAELTNIS).concat(Object.keys(b.KUNSTSTOFF)).forEach(function (id) { verf[id] = Math.floor((bestand && bestand[id] || 0) * b.PLUENDER_ANTEIL); });
    var kunst = verteile(Math.floor(kap * b.KUNSTSTOFF_ANTEIL), b.KUNSTSTOFF, verf);
    var haupt = verteile(kap - summe(kunst), b.VERHAELTNIS, verf);
    var r = {}; [haupt, kunst].forEach(function (o) { Object.keys(o).forEach(function (id) { if (o[id] > 0) r[id] = o[id]; }); });
    return { beute: r, kapazitaet: kap, summe: summe(r) };
  }
  /** Beute anwenden: aus bestand abziehen, in f.ladung legen. → {beute, kapazitaet, summe} */
  function pluendere(f, bestand) {
    var r = beuteBerechnen(f.schiffe, f.ladung, bestand);
    if (!r.summe) return r;
    f.ladung = f.ladung || {};
    Object.keys(r.beute).forEach(function (id) { bestand[id] -= r.beute[id]; f.ladung[id] = (f.ladung[id] || 0) + r.beute[id]; });
    f.beute = r.beute;
    return r;
  }

  // ---------- Rückruf ----------
  function kannRueckruf(f) { return !!f && (f.phase === "hin" || f.phase === "halten"); }
  /** Erstattungsvorschau (Rohöl) – Anteil der noch nicht geflogenen Hinflug-Strecke. */
  function erstattung(f, jetzt) {
    if (!kannRueckruf(f) || f.phase !== "hin") return 0;
    var dauer = Math.max(1, f.ankunft - f.abflug), anteil = Math.max(0, Math.min(1, (f.ankunft - jetzt) / dauer));
    return Math.floor((f.rohoel || 0) * anteil);
  }
  function rueckruf(z, id, jetzt) {
    var f = (z.flotten || []).filter(function (x) { return x.id === id; })[0];
    if (!f) return { ok: false, grund: "Flotte nicht gefunden." };
    if (!kannRueckruf(f)) return { ok: false, grund: "Flotte ist schon auf dem Rückflug." };
    var e = erstattung(f, jetzt), geflogen = f.phase === "hin" ? Math.max(0, jetzt - f.abflug) : (f.ankunft - f.abflug);
    if (f.phase === "halten") f.haltEnde = jetzt;
    f.phase = "rueck"; f.rueckkehr = jetzt + geflogen; f.zurueckgerufen = true;
    z.rohstoffe.rohoel = (z.rohstoffe.rohoel || 0) + e;
    f.bericht = "Zurückgerufen – Rohöl erstattet: " + e;
    return { ok: true, flotte: f, erstattung: e, rueckkehr: f.rueckkehr };
  }

  // ---------- Angriffsschild ----------
  function schildStatus(p, jetzt) {
    var s = p && p.schild;
    if (s && jetzt < s.bis) return { aktiv: true, rest: s.bis - jetzt, abklingBis: s.abklingBis };
    if (s && jetzt < s.abklingBis) return { aktiv: false, abklingen: true, rest: s.abklingBis - jetzt };
    return { aktiv: false, abklingen: false, rest: 0 };
  }
  function schildPruefe(z, p, jetzt) {
    var st = schildStatus(p, jetzt), master = SS.kern.werft.istMaster(z), k = master ? 0 : S().KOSTEN_ROHOEL;
    if (st.aktiv) return { ok: false, grund: "Schild ist schon aktiv.", kosten: k };
    if (st.abklingen && !master) return { ok: false, grund: "Schild lädt nach (Abklingzeit).", kosten: k };
    if ((z.rohstoffe.rohoel || 0) < k) return { ok: false, grund: "Nicht genug Rohöl (" + k + " nötig).", kosten: k };
    return { ok: true, kosten: k };
  }
  function schildAktivieren(z, p, jetzt) {
    var r = schildPruefe(z, p, jetzt);
    if (!r.ok) return r;
    z.rohstoffe.rohoel -= r.kosten;
    var bis = jetzt + S().DAUER_H * 3600000;
    p.schild = { seit: jetzt, bis: bis, abklingBis: bis + S().ABKLING_H * 3600000 };
    return r;
  }
  function schildAus(p, jetzt) { if (p && p.schild && jetzt < p.schild.bis) { var ab = jetzt + S().ABKLING_H * 3600000; p.schild.bis = jetzt; p.schild.abklingBis = ab; } }
  /** Für spätere KI/Angriffe auf eigene Planeten: blockiert der Schild einen Angriff auf koord? */
  function angriffBlockiert(z, koord, jetzt) {
    var FL = SS.kern.flotte, e = FL.eigenePlaneten(z).filter(function (x) { return x.sektor === koord.sektor && x.system === koord.system && x.planet === koord.planet; })[0];
    if (!e) return false;
    var p = (z.planeten || []).filter(function (x) { return x.id === e.id; })[0];
    return schildStatus(p, jetzt).aktiv;
  }

  // ---------- Bergung eigener Planet ----------
  function bergeEigen(z, f, p) {
    var art = f.mission === "bodensammlung" ? "boden" : "orbit", typ = art === "boden" ? "bodensammler" : "wracksammler";
    var kap = (f.schiffe[typ] || 0) * (D().schiffNachId(typ).ladung || 0) - summe(f.ladung), frei = Math.max(0, kap);
    p.truemmer = p.truemmer || { orbit: { metall: 0, silizium: 0 }, boden: { metall: 0, silizium: 0 } };
    var gb = { metall: 0, silizium: 0, kapazitaet: kap };
    // Verhältnis 3:2 wie das Feld selbst: anteilig statt „Metall zuerst“
    var feld = p.truemmer[art], ges = feld.metall + feld.silizium, nimm = Math.min(frei, ges);
    if (ges > 0) { gb.metall = Math.min(feld.metall, Math.round(nimm * feld.metall / ges)); gb.silizium = Math.min(feld.silizium, nimm - gb.metall); }
    feld.metall -= gb.metall; feld.silizium -= gb.silizium;
    gb.rest = { metall: feld.metall, silizium: feld.silizium };
    f.ladung = f.ladung || {};
    ["metall", "silizium"].forEach(function (r) { if (gb[r] > 0) f.ladung[r] = (f.ladung[r] || 0) + gb[r]; });
    if (!Object.keys(f.ladung).length) delete f.ladung;
    f.geborgen = gb;
    return gb;
  }

  SS.kern.bergung = { beuteKapazitaet: beuteKapazitaet, verteile: verteile, beuteBerechnen: beuteBerechnen, pluendere: pluendere,
    kannRueckruf: kannRueckruf, erstattung: erstattung, rueckruf: rueckruf,
    schildStatus: schildStatus, schildPruefe: schildPruefe, schildAktivieren: schildAktivieren, schildAus: schildAus, angriffBlockiert: angriffBlockiert,
    bergeEigen: bergeEigen };
})(typeof globalThis !== "undefined" ? globalThis : this);
