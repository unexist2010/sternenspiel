/*
 * Sternenspiel – Werft (Kapitel 4): Schiffbau-Warteschlange je Planet, Kosten, Bauzeit, Voraussetzungen, Anzeigewerte.
 * Kein Kampf, keine Flottenbewegung – Schiffe werden nur gebaut und gezählt.
 *
 * Regeln (ANNAHME, OGame-nah – siehe SPEZIFIKATION C8):
 *  - Werft Stufe ≥ 1 nötig (auch im Master-Modus).
 *  - Eine Werft-Warteschlange je Planet (unabhängig von Bauauftrag und Forschung), unbegrenzt viele Aufträge (FEST, Sandro 2026-10-30);
 *    ein Auftrag = Menge × ein Schiffstyp; Aufträge laufen nacheinander, Einheiten werden einzeln fertig.
 *  - Bauzeit je Einheit = (Metall + Silizium) / (2500 · (1 + Werftstufe)) Std. × Roboter-Faktor, mindestens 1 s.
 *  - Kosten werden beim Start abgezogen; Abbrechen erstattet alle noch nicht fertigen Einheiten voll.
 *  - Punkte je fertiger Einheit (bau.punkteFuer). Solarsatelliten → planet.solarsatelliten, sonst planet.schiffe[id].
 *  - Während des Werft-Ausbaus kein Schiffbau; während Schiffbau kein Werft-Ausbau (OGame).
 *  - Master: sofort und kostenlos, Voraussetzungen ignoriert – Werft Stufe 1 bleibt Pflicht.
 */
(function (g) {
  "use strict";
  var SS = (g.SS = g.SS || {});
  SS.kern = SS.kern || {};
  var D = function () { return SS.DATEN; }, B = function () { return SS.BALANCE; };
  var FO = function () { return SS.kern.forschung; };

  function W() { return B().WERFT; }
  function istMaster(z) { return !!(z && z.einstellungen && z.einstellungen.master); }
  function werftStufe(p) { return (p && p.gebaeude && p.gebaeude.werft) || 0; }
  function anzahl(p, id) { return id === "solarsatellit" ? (p.solarsatelliten || 0) : ((p.schiffe && p.schiffe[id]) || 0); }
  function auftraege(p) { if (!Array.isArray(p.werftauftraege)) p.werftauftraege = []; return p.werftauftraege; }

  /** Sichtbar? Schiffe mit Flag (Antimaterie-Frachter) erst nach Freischaltung; Master zeigt alles. */
  function sichtbar(z, s) { return !s.flag || istMaster(z) || !!(z.freigeschaltet && z.freigeschaltet[s.flag] === true); }

  /** Bauzeit je Einheit in ms. */
  function stueckMs(z, p, s) {
    var BZ = B().BAUZEIT, h = ((s.kosten.metall || 0) + (s.kosten.silizium || 0)) / (BZ.TEILER * (1 + werftStufe(p))) * BZ.FAKTOR * FO().roboterFaktor(z);
    return Math.max(W().MIN_SEKUNDEN * 1000, Math.round(h * 3600000));
  }
  function kostenMal(k, n) { var r = {}; Object.keys(k).forEach(function (id) { r[id] = k[id] * n; }); return r; }

  /** Voraussetzungen → [{art, id, name, stufe, ist, ok}] (Werft zuerst). */
  function voraussetzungen(z, p, s) {
    var l = [{ art: "werft", id: "werft", name: "Werft", stufe: s.vor.werft, ist: werftStufe(p), ok: werftStufe(p) >= s.vor.werft }];
    s.vor.forschung.forEach(function (v) {
      var f = D().forschungNachId(v.id), ist = FO().stufe(z, v.id);
      l.push({ art: "forschung", id: v.id, name: f ? f.name : v.id, stufe: v.stufe, ist: ist, ok: ist >= v.stufe });
    });
    return l;
  }
  function voraussetzungenOk(z, p, s) { return voraussetzungen(z, p, s).every(function (v) { return v.ok; }); }

  /** Prüft einen Bauwunsch. → {ok, grund, kosten, master} */
  function pruefe(z, p, id, menge) {
    var s = D().schiffNachId(id);
    if (!s) return { ok: false, grund: "Unbekanntes Schiff." };
    menge = Math.floor(Number(menge));
    if (!(menge >= 1)) return { ok: false, grund: "Menge mindestens 1." };
    if (menge > W().MAX_MENGE) return { ok: false, grund: "Höchstens " + W().MAX_MENGE.toLocaleString("de-DE") + " je Auftrag." };
    if (!(werftStufe(p) > 0)) return { ok: false, grund: "Zuerst die Werft bauen." };
    if (!sichtbar(z, s)) return { ok: false, grund: "Noch nicht freigeschaltet." };
    if (p.bauauftrag && p.bauauftrag.id === "werft") return { ok: false, grund: "Die Werft wird gerade ausgebaut." };
    var master = istMaster(z), kosten = kostenMal(s.kosten, menge);
    if (master) return { ok: true, grund: "", kosten: kosten, master: true };
    var fehlt = voraussetzungen(z, p, s).filter(function (v) { return !v.ok; });
    if (fehlt.length) return { ok: false, grund: "Voraussetzung fehlt: " + fehlt.map(function (v) { return v.name + " " + v.stufe; }).join(", ") + ".", gesperrt: true };
    var fe = SS.kern.bau.fehlend(z, kosten);
    if (Object.keys(fe).length) {
      return { ok: false, grund: "Es fehlen: " + Object.keys(fe).map(function (r) { var x = D().rohstoffNachId(r); return (x ? x.name : r) + " " + (SS.format ? SS.format.zahl(fe[r]) : fe[r]); }).join(", ") + ".", fehlend: fe };
    }
    return { ok: true, grund: "", kosten: kosten };
  }

  /** Wie viele Einheiten sind höchstens bezahlbar? (für „max“) */
  function maxBezahlbar(z, s) {
    var n = W().MAX_MENGE;
    Object.keys(s.kosten).forEach(function (id) { if (s.kosten[id] > 0) n = Math.min(n, Math.floor((z.rohstoffe[id] || 0) / s.kosten[id] + 1e-9)); });
    return Math.max(0, n);
  }

  function liefere(z, p, s, n) {
    if (n <= 0) return;
    if (s.id === "solarsatellit") p.solarsatelliten = (p.solarsatelliten || 0) + n;
    else { p.schiffe = p.schiffe || {}; p.schiffe[s.id] = (p.schiffe[s.id] || 0) + n; }
    z.punkte = (z.punkte || 0) + SS.kern.bau.punkteFuer(s.kosten) * n;
    z.statistik = z.statistik || {}; z.statistik.schiffeGebaut = (z.statistik.schiffeGebaut || 0) + n;
  }

  /** Startet einen Auftrag; Master: sofort fertig. → {ok, auftrag, sofort} */
  function starte(z, p, id, menge, jetzt) {
    var pr = pruefe(z, p, id, menge);
    if (!pr.ok) return pr;
    var s = D().schiffNachId(id), q = auftraege(p);
    menge = Math.floor(Number(menge));
    if (pr.master) { liefere(z, p, s, menge); return { ok: true, sofort: true, auftrag: { art: "schiff", id: id, name: s.name, menge: menge } }; }
    Object.keys(pr.kosten).forEach(function (r) { z.rohstoffe[r] -= pr.kosten[r]; });
    var st = stueckMs(z, p, s), beginn = q.length ? Math.max(jetzt, q[q.length - 1].ende) : jetzt;
    var a = { art: "schiff", id: id, name: s.name, menge: menge, fertig: 0, stueckMs: st, stueckKosten: Object.assign({}, s.kosten), start: beginn, ende: beginn + st * menge };
    q.push(a);
    return { ok: true, auftrag: a };
  }

  /** Liefert alle bis t fertigen Einheiten aus. → Liste vollständig abgeschlossener Aufträge */
  function faellige(z, p, t) {
    var q = auftraege(p), erledigt = [];
    while (q.length) {
      var a = q[0], s = D().schiffNachId(a.id);
      if (!s) { q.shift(); continue; }
      var soll = t >= a.start ? Math.min(a.menge, Math.floor((t - a.start) / a.stueckMs + 1e-9)) : 0;
      if (soll > a.fertig) { liefere(z, p, s, soll - a.fertig); a.fertig = soll; }
      if (a.fertig < a.menge) break;
      q.shift();
      erledigt.push({ art: "schiff", id: a.id, name: a.name, menge: a.menge });
    }
    return erledigt;
  }
  /** Nächster Zeitpunkt, an dem ein Auftrag endet (für die Abschnitte der Simulation). */
  function naechstesEnde(p) { var q = p.werftauftraege; return q && q.length ? q[0].ende : null; }

  /** Bricht Auftrag Nr. i ab: nicht fertige Einheiten voll erstattet, spätere Aufträge rücken auf. */
  function abbrechen(z, p, i, jetzt) {
    var q = auftraege(p), a = q[i];
    if (!a) return null;
    faellige(z, p, jetzt);
    a = q[i];
    if (!a) return null;
    var rest = a.menge - a.fertig, frei = a.ende - Math.max(jetzt, a.start);
    Object.keys(a.stueckKosten).forEach(function (r) { z.rohstoffe[r] = (z.rohstoffe[r] || 0) + a.stueckKosten[r] * rest; });
    q.splice(i, 1);
    for (var k = i; k < q.length; k++) { q[k].start -= frei; q[k].ende -= frei; }
    return { name: a.name, erstattet: rest };
  }

  /** Master einschalten: alle Aufträge sofort fertig. */
  function alleSofort(z, p, jetzt) {
    var q = auftraege(p), fertig = [];
    while (q.length) {
      var a = q.shift(), s = D().schiffNachId(a.id);
      if (s) liefere(z, p, s, a.menge - a.fertig);
      fertig.push({ art: "schiff", id: a.id, name: a.name, menge: a.menge });
    }
    return fertig;
  }

  /** Schadensfaktor aus Waffen-Technologie × gewichteter Typ-Forschung (für Schiffe und Verteidigung). */
  function waffenFaktor(z, waffen) {
    var b = function (id) { return id ? FO().bonus(z, id) : 0; };
    var typ = 0, summe = 0;
    Object.keys(waffen).forEach(function (w) {
      var wt = D().waffentypNachId(w), f = wt && wt.forschung ? D().forschungNachId(wt.forschung) : null;
      var pz = f && f.wirkung.typ === "prozent" ? b(wt.forschung) : 0;
      typ += waffen[w] * (1 + pz / 100); summe += waffen[w];
    });
    return (1 + b("waffen") / 100) * (summe > 0 ? typ / summe : 1);
  }

  /** Anzeigewerte mit Forschungsbonus (bonus() liefert Prozent). schild = Energiehülle, huelle = Metallhülle (0.12.0). */
  function werte(z, s) {
    var b = function (id) { return id ? FO().bonus(z, id) : 0; };
    var waffenF = waffenFaktor(z, s.waffen);
    var h = D().huellentypNachId(s.huelle), struktur = ((s.kosten.metall || 0) + (s.kosten.silizium || 0)) * h.faktor;
    var ladeP = b("hyperspace") + (s.transporter ? b("komprimierung") : 0);
    var energie = s.schild * (1 + b("schild") / 100), metall = struktur / 10 * (1 + b("panzerung") / 100);
    return {
      angriff: s.angriff * waffenF, schild: energie, energie: energie,
      huelle: metall, metall: metall, struktur: struktur,
      tempo: s.antrieb ? s.tempo * (1 + b(s.antrieb) / 100) : 0,
      ladung: s.ladung * (1 + ladeP / 100), verbrauch: s.verbrauch,
      grund: { angriff: s.angriff, schild: s.schild, huelle: struktur / 10, tempo: s.tempo, ladung: s.ladung },
      bonus: { waffen: (waffenF - 1) * 100, schild: b("schild"), panzerung: b("panzerung"), antrieb: s.antrieb ? b(s.antrieb) : 0, ladung: ladeP }
    };
  }

  /** Schnellfeuer: gegen wen (aus Daten) und von wem (Gegenrichtung). */
  function schnellfeuer(s) {
    var gegen = Object.keys(s.schnellfeuer).map(function (id) { return { id: id, n: s.schnellfeuer[id] }; });
    var von = D().schiffe.filter(function (x) { return x.schnellfeuer[s.id]; }).map(function (x) { return { id: x.id, n: x.schnellfeuer[s.id] }; });
    return { gegen: gegen, von: von };
  }

  SS.kern.werft = {
    werftStufe: werftStufe, anzahl: anzahl, sichtbar: sichtbar, stueckMs: stueckMs, voraussetzungen: voraussetzungen, voraussetzungenOk: voraussetzungenOk,
    pruefe: pruefe, maxBezahlbar: maxBezahlbar, starte: starte, faellige: faellige, naechstesEnde: naechstesEnde, abbrechen: abbrechen,
    alleSofort: alleSofort, werte: werte, waffenFaktor: waffenFaktor, schnellfeuer: schnellfeuer, istMaster: istMaster
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
