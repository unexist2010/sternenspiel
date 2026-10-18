/*
 * Sternenspiel – Bauen (Kapitel 2): Kosten, Bauzeit, Bauschleife (ein Auftrag je Planet), Startplätze, Punkte.
 * Reine Logik ohne DOM → in Node testbar.
 *
 * OGame-angelehnt:
 *  Kosten(n)  = Basis · Faktor^(n−1)                              (abgerundet)
 *  Bauzeit    = (Metall + Silizium) / 2500 Std. · BAUZEIT.FAKTOR  (Hook für Roboter-Forschung, jetzt 1; ANNAHME: min. 5 s)
 *  Punkte     = Σ Kosten · Gewicht / 1000                         (bei Fertigstellung; ANNAHME)
 *  Abbrechen  = volle Rückerstattung (ANNAHME)
 *
 * Master-Modus (Testmodus, FEST 0.7.0, je Profil in zustand.einstellungen.master):
 *  Bauzeit 0 (sofort fertig, auch laufende Aufträge), keine Rohstoffkosten (nichts abgezogen), Punkte-/Freischaltsperren
 *  (Startplätze, Kunststoffwerk T2/T3) ignoriert. Punkte werden trotzdem gutgeschrieben (ANNAHME).
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
  /** Kosten Startplatz: Grund · 1,5^(Buchstabenindex) · 1,35^(Stufe−1) (ANNAHME). */
  function startplatzKosten(buchstabe, stufe) {
    var K = B().STARTPLAETZE;
    return kostenAus(K.KOSTEN, K.KOSTEN_FAKTOR_STUFE, stufe, Math.pow(K.KOSTEN_FAKTOR_BUCHSTABE, startplatzIndex(buchstabe)));
  }
  function istMaster(z) { return !!(z && z.einstellungen && z.einstellungen.master); }

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
  function startplatzStufe(p, buchstabe) {
    var sp = (p.startplaetze || []).filter(function (x) { return x.buchstabe === buchstabe; })[0];
    return sp ? sp.stufe : 0;
  }
  /**
   * Freischaltung eines Buchstabens (FEST): voriger Buchstabe auf Stufe 10 UND Punkteschwelle erreicht.
   * → { frei, vorgaengerOk, punkteOk, grund } – Master ignoriert beide Sperren.
   */
  function startplatzStatus(z, p, buchstabe) {
    var K = B().STARTPLAETZE, i = startplatzIndex(buchstabe), vor = i > 0 ? D().startplatzBuchstaben[i - 1] : null;
    var vorgaengerOk = !vor || startplatzStufe(p, vor) >= K.VORGAENGER_STUFE;
    var schwelle = startplatzSchwelle(buchstabe), punkteOk = (z.punkte || 0) >= schwelle;
    var gruende = [];
    if (!vorgaengerOk) gruende.push(vor + " Stufe " + K.VORGAENGER_STUFE + " nötig");
    if (!punkteOk) gruende.push((SS.format ? SS.format.zahl(schwelle) : schwelle) + " Punkte nötig");
    var master = istMaster(z);
    return { frei: master || (vorgaengerOk && punkteOk), vorgaengerOk: vorgaengerOk, punkteOk: punkteOk, master: master, grund: gruende.join(" · ") };
  }
  function startplatzFrei(z, buchstabe, p) { return startplatzStatus(z, p || z.planeten[0], buchstabe).frei; }
  /** Kapazität eines Buchstabens bei Stufe s. */
  function kapazitaetBuchstabe(buchstabe, stufe) { return (stufe || 0) * B().STARTPLAETZE.KAPAZITAET_JE_STUFE[startplatzIndex(buchstabe)]; }
  /** Gesamtkapazität eines Planeten = Summe aller Startplätze (gleichzeitig startende Schiffe). */
  function kapazitaet(p) {
    return (p.startplaetze || []).reduce(function (s, sp) { return s + kapazitaetBuchstabe(sp.buchstabe, sp.stufe); }, 0);
  }
  /** Gebäude-Sperre (z. B. Kunststoffwerk T2/T3): → Text oder "" (Master ignoriert). */
  function gebaeudeSperre(z, d) {
    if (!d.sperre || istMaster(z)) return "";
    return z.freigeschaltet && z.freigeschaltet[d.sperre.flag] === true ? "" : d.sperre.text;
  }

  // ---------- Bauschleife ----------
  /** Beschreibt das nächste Ausbauziel: {art, id|buchstabe, name, stufe, kosten, bauzeit, max}. */
  function ziel(z, p, auftrag) {
    if (auftrag.art === "startplatz") {
      var sp = (p.startplaetze || []).filter(function (x) { return x.buchstabe === auftrag.buchstabe; })[0];
      if (!sp) return null;
      var st = sp.stufe + 1, kS = startplatzKosten(sp.buchstabe, Math.min(st, B().STARTPLAETZE.STUFE_MAX));
      return { art: "startplatz", buchstabe: sp.buchstabe, name: "Startplatz " + sp.buchstabe, stufe: st, kosten: kS, bauzeit: istMaster(z) ? 0 : bauzeitMs(kS, z), max: B().STARTPLAETZE.STUFE_MAX };
    }
    var d = D().gebaeudeNachId(auftrag.id);
    if (!d) return null;
    var max = D().maxStufe(d), stufe = (p.gebaeude[d.id] || 0) + 1, k = gebaeudeKosten(d, Math.min(stufe, max));
    return { art: "gebaeude", id: d.id, name: d.name, stufe: stufe, kosten: k, bauzeit: istMaster(z) ? 0 : bauzeitMs(k, z), max: max };
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
      var st = startplatzStatus(z, p, zl.buchstabe);
      if (!st.frei) return { ok: false, grund: "Gesperrt: " + st.grund + ".", ziel: zl, gesperrt: true };
    } else {
      var sperre = gebaeudeSperre(z, D().gebaeudeNachId(zl.id));
      if (sperre) return { ok: false, grund: sperre, ziel: zl, gesperrt: true };
    }
    if (p.bauauftrag) return { ok: false, grund: "Es läuft bereits ein Bauauftrag.", ziel: zl };
    if (istMaster(z)) return { ok: true, grund: "", ziel: zl, master: true };
    var fe = fehlend(z, zl.kosten);
    if (Object.keys(fe).length) {
      var namen = Object.keys(fe).map(function (id) { var r = D().rohstoffNachId(id); return (r ? r.name : id) + " " + (SS.format ? SS.format.zahl(fe[id]) : fe[id]); });
      return { ok: false, grund: "Es fehlen: " + namen.join(", ") + ".", ziel: zl, fehlend: fe };
    }
    return { ok: true, grund: "", ziel: zl };
  }

  /** Startet einen Auftrag (Rohstoffe werden sofort abgezogen). Vorher Produktion bis „jetzt“ abrechnen!
   *  Master: nichts abziehen, sofort fertigstellen (→ sofort: true). */
  function starte(z, p, auftrag, jetzt) {
    var pr = pruefe(z, p, auftrag);
    if (!pr.ok) return pr;
    var zl = pr.ziel, master = istMaster(z);
    if (!master) Object.keys(zl.kosten).forEach(function (id) { z.rohstoffe[id] -= zl.kosten[id]; });
    p.bauauftrag = { art: zl.art, id: zl.id || null, buchstabe: zl.buchstabe || null, name: zl.name, stufe: zl.stufe, kosten: zl.kosten, start: jetzt, ende: jetzt + (master ? 0 : zl.bauzeit) };
    if (master) { p.bauauftrag.master = true; return { ok: true, auftrag: fertigstellen(z, p), sofort: true }; }
    return { ok: true, auftrag: p.bauauftrag };
  }

  /** Master-Modus an/aus (je Profil). Beim Einschalten werden laufende Aufträge sofort fertig. → Liste fertiger Aufträge */
  function masterSetzen(z, an, jetzt) {
    z.einstellungen = z.einstellungen || {};
    z.einstellungen.master = !!an;
    var fertig = [];
    if (an) z.planeten.forEach(function (p) {
      if (p.bauauftrag) { p.bauauftrag.ende = Math.min(p.bauauftrag.ende, jetzt); fertig.push(fertigstellen(z, p)); }
    });
    return fertig;
  }

  /** Bricht den laufenden Auftrag ab – volle Rückerstattung (ANNAHME). */
  function abbrechen(z, p) {
    var a = p.bauauftrag;
    if (!a) return { ok: false, grund: "Kein Bauauftrag." };
    if (!a.master) Object.keys(a.kosten).forEach(function (id) { z.rohstoffe[id] = (z.rohstoffe[id] || 0) + a.kosten[id]; });
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
      if (d && d.fund && p.gebaeude[a.id] > 0 && SS.kern.geologie) SS.kern.geologie.gebaut(p, a.ende); // 24-h-Takt ab Bau
    }
    z.punkte = (z.punkte || 0) + punkteFuer(a.kosten); // auch für Master-Bauten (ANNAHME)
    p.bauauftrag = null;
    return a;
  }

  SS.kern.bau = {
    gebaeudeKosten: gebaeudeKosten, startplatzKosten: startplatzKosten, bauzeitMs: bauzeitMs, punkteFuer: punkteFuer,
    forschungszeitFaktor: forschungszeitFaktor, startplatzSchwelle: startplatzSchwelle, startplatzFrei: startplatzFrei,
    startplatzStatus: startplatzStatus, startplatzStufe: startplatzStufe, kapazitaetBuchstabe: kapazitaetBuchstabe,
    gebaeudeSperre: gebaeudeSperre, istMaster: istMaster, masterSetzen: masterSetzen,
    kapazitaet: kapazitaet, ziel: ziel, pruefe: pruefe, starte: starte, abbrechen: abbrechen, fertigstellen: fertigstellen
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
