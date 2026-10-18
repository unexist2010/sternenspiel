/*
 * Sternenspiel – Geologie & Rohölvorkommen (Nachbesserung Kapitel 2, 0.7.0). Reine Logik ohne DOM → in Node testbar.
 *
 * FEST (Sandro):
 *  - Jeder Planet hat ein bekanntes Rohölvorkommen (Menge); der Hauptplanet startet mit 1.000.000 entdecktem Rohöl.
 *  - Die Bohrstation fördert aus dem Vorkommen (Förderung = min(Rate, Vorkommen)) – siehe produktion.js.
 *  - Die Geologiestation entdeckt alle 24 h (Echtzeit, offline nachgeholt, je volle 24 h ab Bau bzw. letztem Fund)
 *    ein neues Feld; Größe zufällig im Bereich der Stufe: Stufe 1 = 50.000–100.000, Stufe 2 = 80.000–125.000.
 *  - Ohne Geologiestation keine neuen Funde; theoretisch unbegrenzt.
 * ANNAHME: ab Stufe 3 wachsen Minimum und Maximum je Stufe um ×1,25 (gerundet auf 1.000); Zufall reproduzierbar je Planet
 *          (Startwert im Spielstand), Fund-Log höchstens 100 Einträge, Test-Fund (Master) verschiebt den 24-h-Takt nicht.
 */
(function (g) {
  "use strict";
  var SS = (g.SS = g.SS || {});
  SS.kern = SS.kern || {};
  var G = function () { return SS.BALANCE.GEOLOGIE; };
  var MS_PRO_STUNDE = 3600000;

  function intervallMs() { return G().FUND_INTERVALL_STUNDEN * MS_PRO_STUNDE; }

  /** Fundbereich [Minimum, Maximum] für eine Stufe (≥ 1). */
  function fundBereich(stufe) {
    var fest = G().FUND_BEREICH_FEST, n = Math.max(1, Math.floor(stufe));
    if (n <= fest.length) return [fest[n - 1][0], fest[n - 1][1]];
    var letzte = fest[fest.length - 1], f = Math.pow(G().FUND_WACHSTUM_AB_STUFE_3, n - fest.length), r = G().FUND_RUNDUNG;
    return [Math.round(letzte[0] * f / r) * r, Math.round(letzte[1] * f / r) * r];
  }

  /** Neuer Zufalls-Startwert (32 Bit). */
  function neuerStartwert() { return Math.floor(Math.random() * 4294967296) >>> 0; }

  /** Reproduzierbarer Zufall (mulberry32) – Zustand liegt im Planeten (geologie.zufall). */
  function zufall(p) {
    var t = (p.geologie.zufall = (p.geologie.zufall + 0x6D2B79F5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Leerer Geologie-Datensatz eines Planeten. */
  function neu() { return { naechsterFund: null, funde: [], zufall: neuerStartwert() }; }

  /** Fügt einen Fund hinzu (Vorkommen + Log). */
  function fund(p, zeit, stufe, test) {
    var b = fundBereich(stufe);
    var menge = b[0] + Math.floor(zufall(p) * (b[1] - b[0] + 1));
    p.rohoelVorkommen = (p.rohoelVorkommen || 0) + menge;
    var eintrag = { zeit: zeit, stufe: stufe, menge: menge };
    if (test) eintrag.test = true;
    p.geologie.funde.push(eintrag);
    if (p.geologie.funde.length > G().LOG_MAX) p.geologie.funde.splice(0, p.geologie.funde.length - G().LOG_MAX);
    return eintrag;
  }

  /** Wird beim Fertigstellen der Geologiestation aufgerufen: erster Bau startet den 24-h-Takt. */
  function gebaut(p, zeit) {
    if (p.geologie.naechsterFund == null) p.geologie.naechsterFund = zeit + intervallMs();
  }

  /** Nächster fälliger Fundzeitpunkt (oder null). */
  function naechsterFund(p) {
    return (p.gebaeude.geologiestation || 0) > 0 && p.geologie.naechsterFund != null ? p.geologie.naechsterFund : null;
  }

  /** Alle Funde bis einschließlich „bis“ nachholen (je volle 24 h). */
  function faelligeFunde(p, bis) {
    var liste = [], sicherung = 0;
    while (naechsterFund(p) != null && p.geologie.naechsterFund <= bis && sicherung++ < 100000) {
      var e = fund(p, p.geologie.naechsterFund, p.gebaeude.geologiestation, false);
      e.planet = p.id;
      liste.push(e);
      p.geologie.naechsterFund += intervallMs();
    }
    return liste;
  }

  /** Master/Test: sofort einen Fund auslösen (24-h-Takt bleibt unverändert, ANNAHME). */
  function fundAusloesen(p, jetzt) {
    var st = p.gebaeude.geologiestation || 0;
    if (st < 1) return { ok: false, grund: "Zuerst die Geologiestation bauen." };
    if (p.geologie.naechsterFund == null) gebaut(p, jetzt);
    return { ok: true, fund: fund(p, jetzt, st, true) };
  }

  SS.kern.geologie = {
    fundBereich: fundBereich, neu: neu, neuerStartwert: neuerStartwert, zufall: zufall, fund: fund, gebaut: gebaut,
    naechsterFund: naechsterFund, faelligeFunde: faelligeFunde, fundAusloesen: fundAusloesen, intervallMs: intervallMs
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
