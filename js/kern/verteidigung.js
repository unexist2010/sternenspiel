/*
 * Sternenspiel – Verteidigungswerft (Kapitel 5): Bau von Verteidigungsanlagen, Warteschlange, Werte. Analog js/kern/werft.js.
 *
 * Regeln (ANNAHME, OGame-nah – SPEZIFIKATION C9):
 *  - Verteidigungswerft Stufe ≥ 1 nötig (auch im Master-Modus).
 *  - Eigene Warteschlange je Planet (planet.verteidigungsauftraege), unabhängig von Werft, Bau und Forschung; unbegrenzt viele Aufträge.
 *  - Bauzeit je Einheit = (Metall + Silizium) / (2500 · (1 + Verteidigungswerft-Stufe)) Std. × Roboter-Faktor, mind. 1 s.
 *  - Schilde (max 1): Bestand + offene Aufträge dürfen die Höchstzahl nicht überschreiten.
 *  - Während des Verteidigungswerft-Ausbaus kein Bau, während Bau kein Ausbau.
 *  - Master: sofort und kostenlos, Voraussetzungen ignoriert (Verteidigungswerft 1 bleibt Pflicht, Schild-Höchstzahl bleibt).
 */
(function (g) {
  "use strict";
  var SS = (g.SS = g.SS || {});
  SS.kern = SS.kern || {};
  var D = function () { return SS.DATEN; }, B = function () { return SS.BALANCE; };
  var FO = function () { return SS.kern.forschung; };
  var WF = function () { return SS.kern.werft; };

  function istMaster(z) { return !!(z && z.einstellungen && z.einstellungen.master); }
  function vwStufe(p) { return (p && p.gebaeude && p.gebaeude.verteidigungswerft) || 0; }
  function anzahl(p, id) { return (p && p.verteidigung && p.verteidigung[id]) || 0; }
  function auftraege(p) { if (!Array.isArray(p.verteidigungsauftraege)) p.verteidigungsauftraege = []; return p.verteidigungsauftraege; }
  function imBau(p, id) { return auftraege(p).reduce(function (s, a) { return s + (a.id === id ? a.menge - a.fertig : 0); }, 0); }

  function stueckMs(z, p, d) {
    var BZ = B().BAUZEIT, h = ((d.kosten.metall || 0) + (d.kosten.silizium || 0)) / (BZ.TEILER * (1 + vwStufe(p))) * BZ.FAKTOR / B().WIRTSCHAFT.BAU_TEMPO * FO().roboterFaktor(z);
    return Math.max(B().VERTEIDIGUNG.MIN_SEKUNDEN * 1000, Math.round(h * 3600000));
  }
  function kostenMal(k, n) { var r = {}; Object.keys(k).forEach(function (id) { r[id] = k[id] * n; }); return r; }

  function voraussetzungen(z, p, d) {
    var l = [{ art: "gebaeude", id: "verteidigungswerft", name: "Verteidigungswerft", stufe: d.vor.verteidigungswerft, ist: vwStufe(p), ok: vwStufe(p) >= d.vor.verteidigungswerft }];
    d.vor.forschung.forEach(function (v) {
      var f = D().forschungNachId(v.id), ist = FO().stufe(z, v.id);
      l.push({ art: "forschung", id: v.id, name: f ? f.name : v.id, stufe: v.stufe, ist: ist, ok: ist >= v.stufe });
    });
    return l;
  }
  function voraussetzungenOk(z, p, d) { return voraussetzungen(z, p, d).every(function (v) { return v.ok; }); }
  /** Wie viele dürfen noch gebaut werden (Schilde max 1)? Infinity ohne Grenze. */
  function frei(p, d) { return d.max ? Math.max(0, d.max - anzahl(p, d.id) - imBau(p, d.id)) : Infinity; }

  function pruefe(z, p, id, menge) {
    var d = D().verteidigungNachId(id);
    if (!d) return { ok: false, grund: "Unbekannte Anlage." };
    menge = Math.floor(Number(menge));
    if (!(menge >= 1)) return { ok: false, grund: "Menge mindestens 1." };
    if (menge > B().VERTEIDIGUNG.MAX_MENGE) return { ok: false, grund: "Höchstens " + B().VERTEIDIGUNG.MAX_MENGE.toLocaleString("de-DE") + " je Auftrag." };
    if (!(vwStufe(p) > 0)) return { ok: false, grund: "Zuerst die Verteidigungswerft bauen." };
    if (p.bauauftrag && p.bauauftrag.id === "verteidigungswerft") return { ok: false, grund: "Die Verteidigungswerft wird gerade ausgebaut." };
    if (menge > frei(p, d)) return { ok: false, grund: frei(p, d) ? "Höchstens noch " + frei(p, d) + "." : "Höchstens " + d.max + " je Planet – schon vorhanden oder im Bau.", max: true };
    var master = istMaster(z), kosten = kostenMal(d.kosten, menge);
    if (master) return { ok: true, grund: "", kosten: kosten, master: true };
    var fehlt = voraussetzungen(z, p, d).filter(function (v) { return !v.ok; });
    if (fehlt.length) return { ok: false, grund: "Voraussetzung fehlt: " + fehlt.map(function (v) { return v.name + " " + v.stufe; }).join(", ") + ".", gesperrt: true };
    var fe = SS.kern.bau.fehlend(z, kosten);
    if (Object.keys(fe).length) {
      return { ok: false, grund: "Es fehlen: " + Object.keys(fe).map(function (r) { var x = D().rohstoffNachId(r); return (x ? x.name : r) + " " + (SS.format ? SS.format.zahl(fe[r]) : fe[r]); }).join(", ") + ".", fehlend: fe };
    }
    return { ok: true, grund: "", kosten: kosten };
  }

  function maxBezahlbar(z, p, d) {
    var n = Math.min(B().VERTEIDIGUNG.MAX_MENGE, frei(p, d));
    Object.keys(d.kosten).forEach(function (id) { if (d.kosten[id] > 0) n = Math.min(n, Math.floor((z.rohstoffe[id] || 0) / d.kosten[id] + 1e-9)); });
    return Math.max(0, n);
  }

  function liefere(z, p, d, n) {
    if (n <= 0) return;
    p.verteidigung = p.verteidigung || {};
    p.verteidigung[d.id] = (p.verteidigung[d.id] || 0) + n;
    z.punkte = (z.punkte || 0) + SS.kern.bau.punkteFuer(d.kosten) * n;
    z.statistik = z.statistik || {}; z.statistik.verteidigungGebaut = (z.statistik.verteidigungGebaut || 0) + n;
  }

  function starte(z, p, id, menge, jetzt) {
    var pr = pruefe(z, p, id, menge);
    if (!pr.ok) return pr;
    var d = D().verteidigungNachId(id), q = auftraege(p);
    menge = Math.floor(Number(menge));
    if (pr.master) { liefere(z, p, d, menge); return { ok: true, sofort: true, auftrag: { art: "verteidigung", id: id, name: d.name, menge: menge } }; }
    Object.keys(pr.kosten).forEach(function (r) { z.rohstoffe[r] -= pr.kosten[r]; });
    var st = stueckMs(z, p, d), beginn = q.length ? Math.max(jetzt, q[q.length - 1].ende) : jetzt;
    var a = { art: "verteidigung", id: id, name: d.name, menge: menge, fertig: 0, stueckMs: st, stueckKosten: Object.assign({}, d.kosten), start: beginn, ende: beginn + st * menge };
    q.push(a);
    return { ok: true, auftrag: a };
  }

  function faellige(z, p, t) {
    var q = auftraege(p), erledigt = [];
    while (q.length) {
      var a = q[0], d = D().verteidigungNachId(a.id);
      if (!d) { q.shift(); continue; }
      var soll = t >= a.start ? Math.min(a.menge, Math.floor((t - a.start) / a.stueckMs + 1e-9)) : 0;
      if (soll > a.fertig) { liefere(z, p, d, soll - a.fertig); a.fertig = soll; }
      if (a.fertig < a.menge) break;
      q.shift();
      erledigt.push({ art: "verteidigung", id: a.id, name: a.name, menge: a.menge });
    }
    return erledigt;
  }
  function naechstesEnde(p) { var q = p.verteidigungsauftraege; return q && q.length ? q[0].ende : null; }

  function abbrechen(z, p, i, jetzt) {
    var q = auftraege(p);
    if (!q[i]) return null;
    faellige(z, p, jetzt);
    var a = q[i];
    if (!a) return null;
    var rest = a.menge - a.fertig, freiMs = a.ende - Math.max(jetzt, a.start);
    Object.keys(a.stueckKosten).forEach(function (r) { z.rohstoffe[r] = (z.rohstoffe[r] || 0) + a.stueckKosten[r] * rest; });
    q.splice(i, 1);
    for (var k = i; k < q.length; k++) { q[k].start -= freiMs; q[k].ende -= freiMs; }
    return { name: a.name, erstattet: rest };
  }

  function alleSofort(z, p) {
    var q = auftraege(p), fertig = [];
    while (q.length) {
      var a = q.shift(), d = D().verteidigungNachId(a.id);
      if (d) liefere(z, p, d, a.menge - a.fertig);
      fertig.push({ art: "verteidigung", id: a.id, name: a.name, menge: a.menge });
    }
    return fertig;
  }

  /** Kampfwerte mit Forschung: angriff, energie (Energiehülle, + Schildtechnik), metall (Metallhülle, + Panzerung). */
  function werte(z, d) {
    var b = function (id) { return id ? FO().bonus(z, id) : 0; };
    var waffenF = WF().waffenFaktor(z, d.waffen);
    var h = D().huellentypNachId(d.huelle), struktur = ((d.kosten.metall || 0) + (d.kosten.silizium || 0)) * h.faktor;
    return {
      angriff: d.angriff * waffenF, energie: d.energie * (1 + b("schild") / 100), metall: struktur / 10 * (1 + b("panzerung") / 100), struktur: struktur,
      grund: { angriff: d.angriff, energie: d.energie, metall: struktur / 10 },
      bonus: { waffen: (waffenF - 1) * 100, schild: b("schild"), panzerung: b("panzerung") }
    };
  }

  SS.kern.verteidigung = {
    vwStufe: vwStufe, anzahl: anzahl, imBau: imBau, frei: frei, stueckMs: stueckMs, voraussetzungen: voraussetzungen, voraussetzungenOk: voraussetzungenOk,
    pruefe: pruefe, maxBezahlbar: maxBezahlbar, starte: starte, faellige: faellige, naechstesEnde: naechstesEnde, abbrechen: abbrechen,
    alleSofort: alleSofort, werte: werte, istMaster: istMaster
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
