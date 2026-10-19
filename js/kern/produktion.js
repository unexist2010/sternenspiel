/*
 * Sternenspiel – Produktion (Kapitel 2): Gebäude-Erträge, Energiebilanz, Kunststoffwerke, Ticks und Offline-Fortschritt.
 * Reine Logik ohne DOM → in Node testbar (tests/).
 *
 * Ablauf je Abschnitt (OGame-artig, siehe docs/SPEZIFIKATION.md C):
 *  1. Strom ist BILANZ (ANNAHME): Erzeugung (Solarfarm, Satelliten, Ölverbrennung) vs. Bedarf (Minen, Werke, Geologie).
 *     Produktionsfaktor f = min(1, Erzeugung / Bedarf) drosselt alle Verbraucher anteilig.
 *  2. Ölverbrennung läuft nur, soweit Rohöl verfügbar ist (Bestand + laufende Förderung).
 *  3. Kunststoffwerke: Inputs je Einheit; reicht ein Input nicht, drosselt das Werk anteilig (nie negativ).
 *  4. Bauaufträge werden genau zu ihrem Endzeitpunkt fertig; die Produktion wird abschnittsweise gerechnet.
 *  5. Bohrstation fördert aus dem Rohölvorkommen des Planeten: Förderung = min(Rate, Vorkommen) (FEST, 0.7.0).
 *  6. Geologie-Funde (alle 24 h) sind Ereignisse wie Bauaufträge – auch im gekappten Offline-Teil werden sie nachgeholt.
 *  7. Master-Modus: laufende Bau- und Forschungsaufträge werden sofort fertig.
 *  8. Forschung (Kapitel 3): Forschungsauftrag endet genau zum Endzeitpunkt; Energie-Technologie erhöht die Stromerzeugung.
 * Lager: unbegrenzt (keine Speichergebäude, ANNAHME).
 */
(function (g) {
  "use strict";
  var SS = (g.SS = g.SS || {});
  SS.kern = SS.kern || {};
  var MS_PRO_STUNDE = 3600000;
  var B = function () { return SS.BALANCE; };
  var D = function () { return SS.DATEN; };

  /** OGame-Wachstum: basis · n · 1,1^n (0 bei Stufe 0). */
  function wachstum(basis, n) { return n > 0 ? basis * n * Math.pow(B().WACHSTUM_BASIS, n) : 0; }

  function hauptplanetVon(z) { return z.planeten && z.planeten[0]; }

  /** Höchstmögliche Förderung der Bohrstation pro Stunde im Abschnitt dtH: Vorkommen / dtH (ohne dtH: 0 oder unbegrenzt). */
  function bohrGrenze(p, dtH) {
    var v = Math.max(0, p.rohoelVorkommen || 0);
    return dtH ? v / dtH : (v > 0 ? Infinity : 0);
  }

  function leer() { var m = {}; D().rohstoffIds.forEach(function (id) { m[id] = 0; }); return m; }

  /**
   * Raten (pro Stunde) eines Planeten.
   * @param z Spielstand  @param p Planet
   * @param dtH Abschnittslänge in Stunden – begrenzt Verbräuche auf Bestand/dtH + Zufluss. null = Bestand unbegrenzt.
   * @returns {{gebaeude:Object, produktion:Object, verbrauch:Object, netto:Object, strom:{erzeugung,bedarf,faktor,bilanz}, foerderung:number}}
   */
  function raten(z, p, dtH) {
    var G = D().gebaeude, st = z.rohstoffe;
    var r = function (id) { var v = p.regler && p.regler[id]; return (v == null ? 100 : v) / 100; };
    var stufe = function (id) { return p.gebaeude[id] || 0; };
    var verfuegbar = function (id) { return dtH ? Math.max(0, st[id] || 0) / dtH : Infinity; };
    var grund = p.istHauptplanet ? B().GRUNDPRODUKTION_HAUPTPLANET : {};
    var info = {};
    var eFaktor = SS.kern.forschung ? SS.kern.forschung.energieFaktor(z) : 1; // Energie-Technologie (Kapitel 3, wirkt jetzt)

    // Grundwerte bei voller Leistung
    var stromFix = 0, bedarf = 0, brennStrom = 0, brennRohoel = 0, minen = {};
    G.forEach(function (d) {
      var n = stufe(d.id), rr = r(d.id);
      info[d.id] = { id: d.id, stufe: stufe(d.id), regler: d.regler ? Math.round(rr * 100) : null, faktor: 1, erzeugt: {}, verbraucht: {}, strom: 0 };
      if (d.stromBedarf) { var b = wachstum(d.stromBedarf, n) * rr; bedarf += b; info[d.id].strom = -b; }
      if (d.stromErzeugt && !d.verbrauch) { var e = wachstum(d.stromErzeugt, n) * rr * eFaktor; stromFix += e; info[d.id].strom = e; }
      if (d.verbrauch) { brennStrom = wachstum(d.stromErzeugt, n) * rr * eFaktor; brennRohoel = wachstum(d.verbrauch.rohoel, n) * rr; }
      if (d.erzeugt) minen[d.id] = { rohstoff: d.erzeugt.rohstoff, menge: wachstum(d.erzeugt.basis, n) * rr };
    });
    var sat = (p.solarsatelliten || 0) * B().SOLARSATELLIT_ENERGIE * r("solarsatellit") * eFaktor;
    stromFix += sat;

    // 1.+2. Energiefaktor und Ölverbrennung (gegenseitig abhängig → kurze Fixpunkt-Iteration)
    var f = 1, fo = 0, erzeugung = stromFix, bohrMax = bohrGrenze(p, dtH);
    for (var i = 0; i < 4; i++) {
      var rohoelZufluss = (grund.rohoel || 0) + (minen.bohrstation ? Math.min(bohrMax, minen.bohrstation.menge * f) : 0);
      fo = brennRohoel > 0 ? Math.min(1, (verfuegbar("rohoel") + rohoelZufluss) / brennRohoel) : (brennStrom > 0 ? 1 : 0);
      erzeugung = stromFix + brennStrom * fo;
      f = bedarf > 0 ? Math.min(1, erzeugung / bedarf) : 1;
    }

    var prod = leer(), verb = leer();
    Object.keys(grund).forEach(function (id) { prod[id] += grund[id]; });
    Object.keys(minen).forEach(function (id) {
      var m = minen[id].menge * f;
      if (id === "bohrstation" && m > bohrMax) { m = bohrMax; info[id].vorkommenGrenze = true; }
      prod[minen[id].rohstoff] += m; info[id].erzeugt[minen[id].rohstoff] = m; info[id].faktor = f;
      if (info[id].strom) info[id].strom *= 1; // Bedarf bleibt (OGame: Verbrauch volle Höhe, Ertrag gedrosselt)
    });
    if (info.oelverbrennung) {
      info.oelverbrennung.strom = brennStrom * fo; info.oelverbrennung.faktor = brennRohoel > 0 ? fo : 1;
      if (brennRohoel > 0) { verb.rohoel += brennRohoel * fo; info.oelverbrennung.verbraucht.rohoel = brennRohoel * fo; }
    }

    // 3. Kunststoffwerke – Inputs anteilig verteilen, nie negativ
    var werke = G.filter(function (d) { return d.werk && stufe(d.id) > 0; });
    var bedarfIn = {};
    werke.forEach(function (d) {
      var einh = wachstum(d.werk.basis, stufe(d.id)) * r(d.id) * f;
      Object.keys(d.werk.input).forEach(function (res) { bedarfIn[res] = (bedarfIn[res] || 0) + d.werk.input[res] * einh; });
    });
    var anteil = {};
    Object.keys(bedarfIn).forEach(function (res) {
      var vorrat = verfuegbar(res) + prod[res] - verb[res];
      anteil[res] = bedarfIn[res] > 0 ? Math.max(0, Math.min(1, vorrat / bedarfIn[res])) : 1;
    });
    werke.forEach(function (d) {
      var a = 1;
      Object.keys(d.werk.input).forEach(function (res) { a = Math.min(a, anteil[res]); });
      var einh = wachstum(d.werk.basis, stufe(d.id)) * r(d.id) * f * a;
      info[d.id].faktor = f * a;
      prod[d.werk.ausgabe] += einh; info[d.id].erzeugt[d.werk.ausgabe] = einh;
      Object.keys(d.werk.input).forEach(function (res) { var m = d.werk.input[res] * einh; verb[res] += m; info[d.id].verbraucht[res] = m; });
    });

    var foerderung = info.bohrstation && info.bohrstation.erzeugt.rohoel || 0;

    var netto = leer();
    D().rohstoffIds.forEach(function (id) { netto[id] = prod[id] - verb[id]; });
    netto.strom = 0; prod.strom = 0; verb.strom = 0; // Strom = Bilanz, kein Bestand
    return {
      gebaeude: info, produktion: prod, verbrauch: verb, netto: netto, foerderung: foerderung,
      satelliten: { anzahl: p.solarsatelliten || 0, strom: sat },
      strom: { erzeugung: erzeugung, bedarf: bedarf, faktor: f, bilanz: erzeugung - bedarf, energieFaktor: eFaktor }
    };
  }

  /** Bequeme Gesamtsicht für die Anzeige (Hauptplanet, Abschnittslänge wie in der Simulation). */
  function uebersicht(z) {
    return raten(z, hauptplanetVon(z), B().SIM_SCHRITT_MS / MS_PRO_STUNDE);
  }

  /** Netto-Produktion pro Stunde je Rohstoff (Hauptplanet) – Kurzform für Anzeige/Tests. */
  function produktionProStunde(z) { return uebersicht(z).netto; }

  /** Lager: unbegrenzt (keine Speichergebäude). */
  function lagerKapazitaet() { return Infinity; }

  /** Wendet einen Abschnitt ohne Ereignisse an. */
  function abschnitt(z, p, ms, gewinne) {
    if (ms <= 0) return;
    var dtH = ms / MS_PRO_STUNDE;
    var rt = raten(z, p, dtH);
    D().rohstoffIds.forEach(function (id) {
      if (id === "strom") return;
      var vorher = z.rohstoffe[id] || 0;
      var neu = Math.max(0, vorher + rt.netto[id] * dtH);
      z.rohstoffe[id] = neu;
      gewinne[id] = (gewinne[id] || 0) + (neu - vorher);
      if (neu > vorher) z.statistik.produziertGesamt[id] += neu - vorher;
    });
    p.rohoelVorkommen = Math.max(0, (p.rohoelVorkommen || 0) - rt.foerderung * dtH); // Bohrstation leert das Vorkommen
  }

  /**
   * Rechnet die Zeit von zustand.zeit.letzterTick bis „bis“ ab – abschnittsweise, Bauaufträge exakt zum Endzeitpunkt.
   * @param {boolean} [ohneProduktion] nur Bauaufträge fertigstellen (für den gekappten Teil langer Abwesenheit)
   */
  function simuliereBis(z, bis, ohneProduktion) {
    var t = z.zeit.letzterTick, gewinne = {}, fertig = [], funde = [];
    var schritt = B().SIM_SCHRITT_MS, bau = SS.kern.bau, geo = SS.kern.geologie, fo = SS.kern.forschung;
    var master = !!(z.einstellungen && z.einstellungen.master);
    var sicherung = 0;
    var faellige = function () {
      z.planeten.forEach(function (p) {
        if (p.bauauftrag && bau && (p.bauauftrag.ende <= t || master)) {
          if (p.bauauftrag.ende > t) p.bauauftrag.ende = t; // Master: sofort fertig
          fertig.push(bau.fertigstellen(z, p));
        }
        if (geo) funde = funde.concat(geo.faelligeFunde(p, t));
      });
      var fa = z.forschungsauftrag; // Forschung: ein Auftrag je Spieler, genau zum Endzeitpunkt (Master: sofort)
      if (fa && fo && (fa.ende <= t || master)) { if (fa.ende > t) fa.ende = t; fertig.push(fo.fertigstellen(z)); }
    };
    faellige();
    while (t < bis && sicherung++ < 1e6) {
      var ziel = Math.min(bis, ohneProduktion ? bis : t + schritt);
      if (z.forschungsauftrag && z.forschungsauftrag.ende > t && z.forschungsauftrag.ende < ziel) ziel = z.forschungsauftrag.ende;
      z.planeten.forEach(function (p) {
        if (p.bauauftrag && p.bauauftrag.ende > t && p.bauauftrag.ende < ziel) ziel = p.bauauftrag.ende;
        var nf = geo && geo.naechsterFund(p);
        if (nf != null && nf > t && nf < ziel) ziel = nf;
      });
      if (!ohneProduktion) z.planeten.forEach(function (p) { abschnitt(z, p, ziel - t, gewinne); });
      t = ziel;
      faellige();
    }
    z.zeit.letzterTick = Math.max(z.zeit.letzterTick, bis);
    return { gewinne: gewinne, fertig: fertig, funde: funde };
  }

  /** Echtzeit-Tick / Offline: Produktion höchstens OFFLINE_MAX_STUNDEN, Bauaufträge werden immer fertig. */
  function tick(z, jetzt) {
    var delta = jetzt - z.zeit.letzterTick;
    if (!(delta > 0)) {
      z.zeit.letzterTick = jetzt; // Uhr zurückgestellt: nichts gutschreiben, ab jetzt weiterrechnen
      var r0 = simuliereBis(z, jetzt); // Master: auch ohne Zeitfortschritt sofort fertigstellen
      return { ms: 0, gewinne: {}, fertig: r0.fertig, funde: r0.funde };
    }
    var max = B().OFFLINE_MAX_STUNDEN * MS_PRO_STUNDE, fertig = [], funde = [];
    if (delta > max) { var k = simuliereBis(z, jetzt - max, true); fertig = k.fertig; funde = k.funde; } // gekappter Teil: nur Bau + Funde
    var r = simuliereBis(z, jetzt);
    return { ms: Math.min(delta, max), gewinne: r.gewinne, fertig: fertig.concat(r.fertig), funde: funde.concat(r.funde) };
  }

  function offlineFortschritt(z, jetzt) {
    var abwesend = Math.max(0, jetzt - z.zeit.letzterTick);
    var max = B().OFFLINE_MAX_STUNDEN * MS_PRO_STUNDE;
    var r = tick(z, jetzt);
    z.statistik.offlineMsGesamt += r.ms;
    return { abwesendMs: abwesend, angerechnetMs: r.ms, gekappt: abwesend > max, gewinne: r.gewinne, fertig: r.fertig, funde: r.funde };
  }

  SS.kern.produktion = {
    MS_PRO_STUNDE: MS_PRO_STUNDE,
    wachstum: wachstum,
    bohrGrenze: bohrGrenze,
    raten: raten,
    uebersicht: uebersicht,
    produktionProStunde: produktionProStunde,
    lagerKapazitaet: lagerKapazitaet,
    simuliereBis: simuliereBis,
    tick: tick,
    offlineFortschritt: offlineFortschritt
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
