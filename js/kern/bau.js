/*
 * Sternenspiel – Bauen (Kapitel 2): Kosten, Bauzeit, Bauschleife (ein Auftrag je Planet), Startplätze, Punkte.
 * Reine Logik ohne DOM → in Node testbar.
 *
 * OGame-angelehnt:
 *  Kosten(n)  = Basis · Faktor^(n−1)                              (abgerundet)
 *  Bauzeit    = (Metall + Silizium) / 2500 Std. · BAUZEIT.FAKTOR  (Hook für Roboter-Forschung, jetzt 1; ANNAHME: min. 5 s)
 *  Punkte     = Σ Kosten · Gewicht / 1000                         (bei Fertigstellung; ANNAHME)
 *  Abbrechen  = volle Rückerstattung (ANNAHME)
 */
(function (g) {
  "use strict";
  var SS = (g.SS = g.SS || {});
  SS.kern = SS.kern || {};
  var B = function () { return SS.BALANCE; };
  var D = function () { return SS.DATEN; };

  function kostenAus(basis, faktor, stufe, aufschlag) {
    var k = {};
    Object.keys(basis).forEach(function (id) { k[id] = Math.floor(basis[id] * (aufschlag || 1) * Math.pow(faktor, stufe - 1)); });
    return k;
  }

  /** Kosten für das Erreichen von „stufe“ (≥ 1). */
  function gebaeudeKosten(d, stufe) { return kostenAus(d.kosten, d.faktor, stufe); }

  function startplatzIndex(buchstabe) { return D().startplatzBuchstaben.indexOf(buchstabe); }
  function startplatzKosten(buchstabe, stufe) {
    var K = B().STARTPLAETZE;
    return kostenAus(K.KOSTEN, K.KOSTEN_FAKTOR, stufe, 1 + K.KOSTEN_AUFSCHLAG_JE_PLATZ * startplatzIndex(buchstabe));
  }

  /** Bauzeit in ms (OGame: (Metall + Kristall) / 2500 Stunden). */
  function bauzeitMs(kosten, z) {
    var BZ = B().BAUZEIT;
    var faktor = BZ.FAKTOR * bauzeitFaktorForschung(z);
    var h = ((kosten.metall || 0) + (kosten.silizium || 0)) / BZ.TEILER * faktor;
    return Math.max(BZ.MIN_SEKUNDEN * 1000, Math.round(h * 3600000));
  }
  /** Hook: Roboter-Forschung verkürzt die Bauzeit (später) – jetzt immer 1. */
  function bauzeitFaktorForschung(/* z */) { return 1; }

  function punkteFuer(kosten) {
    var P = B().PUNKTE, s = 0;
    Object.keys(kosten).forEach(function (id) { s += (kosten[id] || 0) * (P.GEWICHT[id] || 0); });
    return s / P.JE_ROHSTOFFE;
  }

  /** Forschungszeit-Faktor der Forschungseinrichtung (OGame: Zeit / (1 + Labor-Stufe)) – nur Anzeige. */
  function forschungszeitFaktor(p) { return 1 / (1 + (p.gebaeude.forschungseinrichtung || 0)); }

  // ---------- Startplätze ----------
  function startplatzSchwelle(buchstabe) { return B().STARTPLAETZE.FREISCHALT_PUNKTE[startplatzIndex(buchstabe)]; }
  function startplatzFrei(z, buchstabe) { return (z.punkte || 0) >= startplatzSchwelle(buchstabe); }
  function kapazitaet(p) {
    var K = B().STARTPLAETZE;
    return (p.startplaetze || []).reduce(function (s, sp) { return s + (sp.stufe || 0) * K.KAPAZITAET_PRO_STUFE; }, 0);
  }

  // ---------- Bauschleife ----------
  /** Beschreibt das nächste Ausbauziel: {art, id|buchstabe, name, stufe, kosten, bauzeit, max}. */
  function ziel(z, p, auftrag) {
    if (auftrag.art === "startplatz") {
      var sp = (p.startplaetze || []).filter(function (x) { return x.buchstabe === auftrag.buchstabe; })[0];
      if (!sp) return null;
      var st = sp.stufe + 1, kS = startplatzKosten(sp.buchstabe, Math.min(st, B().STARTPLAETZE.STUFE_MAX));
      return { art: "startplatz", buchstabe: sp.buchstabe, name: "Startplatz " + sp.buchstabe, stufe: st, kosten: kS, bauzeit: bauzeitMs(kS, z), max: B().STARTPLAETZE.STUFE_MAX };
    }
    var d = D().gebaeudeNachId(auftrag.id);
    if (!d) return null;
    var max = D().maxStufe(d), stufe = (p.gebaeude[d.id] || 0) + 1, k = gebaeudeKosten(d, Math.min(stufe, max));
    return { art: "gebaeude", id: d.id, name: d.name, stufe: stufe, kosten: k, bauzeit: bauzeitMs(k, z), max: max };
  }

  function fehlend(z, kosten) {
    var f = {};
    Object.keys(kosten).forEach(function (id) { var d = kosten[id] - (z.rohstoffe[id] || 0); if (d > 1e-9) f[id] = Math.ceil(d); });
    return f;
  }

  /** Prüft, ob gebaut werden kann. → {ok, grund, ziel, fehlend} */
  function pruefe(z, p, auftrag) {
    var zl = ziel(z, p, auftrag);
    if (!zl) return { ok: false, grund: "Unbekanntes Bauziel." };
    if (zl.stufe > zl.max) return { ok: false, grund: "Höchststufe " + zl.max + " erreicht.", ziel: zl };
    if (auftrag.art === "startplatz") {
      if (!(p.gebaeude.raumflughafen > 0)) return { ok: false, grund: "Zuerst den Raumflughafen errichten.", ziel: zl };
      if (!startplatzFrei(z, zl.buchstabe)) return { ok: false, grund: "Gesperrt bis " + startplatzSchwelle(zl.buchstabe) + " Punkte.", ziel: zl };
    }
    if (p.bauauftrag) return { ok: false, grund: "Es läuft bereits ein Bauauftrag.", ziel: zl };
    var fe = fehlend(z, zl.kosten);
    if (Object.keys(fe).length) {
      var namen = Object.keys(fe).map(function (id) { var r = D().rohstoffNachId(id); return (r ? r.name : id) + " " + (SS.format ? SS.format.zahl(fe[id]) : fe[id]); });
      return { ok: false, grund: "Es fehlen: " + namen.join(", ") + ".", ziel: zl, fehlend: fe };
    }
    return { ok: true, grund: "", ziel: zl };
  }

  /** Startet einen Auftrag (Rohstoffe werden sofort abgezogen). Vorher Produktion bis „jetzt“ abrechnen! */
  function starte(z, p, auftrag, jetzt) {
    var pr = pruefe(z, p, auftrag);
    if (!pr.ok) return pr;
    var zl = pr.ziel;
    Object.keys(zl.kosten).forEach(function (id) { z.rohstoffe[id] -= zl.kosten[id]; });
    p.bauauftrag = { art: zl.art, id: zl.id || null, buchstabe: zl.buchstabe || null, name: zl.name, stufe: zl.stufe, kosten: zl.kosten, start: jetzt, ende: jetzt + zl.bauzeit };
    return { ok: true, auftrag: p.bauauftrag };
  }

  /** Bricht den laufenden Auftrag ab – volle Rückerstattung (ANNAHME). */
  function abbrechen(z, p) {
    var a = p.bauauftrag;
    if (!a) return { ok: false, grund: "Kein Bauauftrag." };
    Object.keys(a.kosten).forEach(function (id) { z.rohstoffe[id] = (z.rohstoffe[id] || 0) + a.kosten[id]; });
    p.bauauftrag = null;
    return { ok: true, auftrag: a };
  }

  /** Stellt den Auftrag fertig (von der Produktion zum Endzeitpunkt aufgerufen). */
  function fertigstellen(z, p) {
    var a = p.bauauftrag;
    if (!a) return null;
    if (a.art === "startplatz") {
      var sp = p.startplaetze.filter(function (x) { return x.buchstabe === a.buchstabe; })[0];
      if (sp) sp.stufe = Math.min(B().STARTPLAETZE.STUFE_MAX, Math.max(sp.stufe, a.stufe));
    } else {
      var d = D().gebaeudeNachId(a.id);
      if (d) p.gebaeude[a.id] = Math.min(D().maxStufe(d), Math.max(p.gebaeude[a.id] || 0, a.stufe));
    }
    z.punkte = (z.punkte || 0) + punkteFuer(a.kosten);
    p.bauauftrag = null;
    return a;
  }

  SS.kern.bau = {
    gebaeudeKosten: gebaeudeKosten, startplatzKosten: startplatzKosten, bauzeitMs: bauzeitMs, punkteFuer: punkteFuer,
    forschungszeitFaktor: forschungszeitFaktor, startplatzSchwelle: startplatzSchwelle, startplatzFrei: startplatzFrei,
    kapazitaet: kapazitaet, ziel: ziel, pruefe: pruefe, starte: starte, abbrechen: abbrechen, fertigstellen: fertigstellen
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
