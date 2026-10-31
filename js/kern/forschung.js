/*
 * Sternenspiel – Forschung (Kapitel 3): Kosten, Forschungszeit, Voraussetzungen (UND/ODER), Sichtbarkeit,
 * Forschungsschleife (ein Auftrag gleichzeitig, OGame), Wirkungen und zentrale Bonus-Funktion für spätere Kapitel.
 * Reine Logik ohne DOM → in Node testbar.
 *
 *  Kosten(n)       = floor(Grundkosten · Faktor^(n−1))                                  (OGame)
 *  Forschungszeit  = (Metall + Silizium) / (1000 · (1 + Stufe Forschungseinrichtung)) Std., mind. 5 s (ANNAHME)
 *                    – Roboterforschung verkürzt NICHT (Sandros Detailbeschreibung, Frage offen)
 *                    – Forschungsnetzwerk: verbundene Einrichtungen weiterer Planeten zählen mit (wirkungslos ohne Kolonien)
 *  Sichtbar        = keine Voraussetzung ODER mindestens eine Voraussetzungs-Gruppe erfüllt ODER Stufe > 0 ODER läuft
 *                    ODER Master (ANNAHME); sonst komplett ausgeblendet
 *  Schleife        = ein Forschungsauftrag gleichzeitig (zustand.forschungsauftrag), unabhängig vom Bauauftrag;
 *                    Forschungseinrichtung im Ausbau ↔ keine Forschung und umgekehrt (OGame, ANNAHME)
 *  Abbrechen       = volle Rückerstattung · Punkte = Kosten / 1000 (gewichtet) bei Fertigstellung
 *  Master          = sofort, kostenlos, Voraussetzungen ignoriert (Forschungseinrichtung bleibt nötig, ANNAHME wie Raumflughafen)
 */
(function (g) {
  "use strict";
  var SS = (g.SS = g.SS || {});
  SS.kern = SS.kern || {};
  var B = function () { return SS.BALANCE; };
  var D = function () { return SS.DATEN; };
  var fz = function (n) { return SS.format ? SS.format.zahl(n) : String(n); };

  function hp(z) { return z.planeten[0]; }
  function istMaster(z) { return !!(z && z.einstellungen && z.einstellungen.master); }
  function stufe(z, id) { return (z.forschung && z.forschung[id]) || 0; }
  function kosten(f, n) {
    var k = {};
    Object.keys(f.kosten).forEach(function (id) { k[id] = Math.floor(f.kosten[id] * Math.pow(f.faktor, n - 1)); });
    return k;
  }

  /** Stufe der Forschungseinrichtung inkl. verbundener Einrichtungen (Forschungsnetzwerk; jetzt nur Hauptplanet). */
  function einrichtungStufe(z) {
    var eigene = hp(z).gebaeude.forschungseinrichtung || 0;
    var andere = z.planeten.slice(1).map(function (p) { return p.gebaeude.forschungseinrichtung || 0; })
      .sort(function (a, b) { return b - a; }).slice(0, stufe(z, "netzwerk"));
    return andere.reduce(function (s, x) { return s + x; }, eigene);
  }
  /** Forschungszeit in ms für Kosten k (OGame: (M + K) / (1000 · (1 + Labor))). */
  function dauerMs(z, k) {
    var FO = B().FORSCHUNG;
    var h = ((k.metall || 0) + (k.silizium || 0)) / (FO.ZEIT_TEILER * (1 + einrichtungStufe(z))) * FO.FAKTOR;
    return Math.max(FO.MIN_SEKUNDEN * 1000, Math.round(h * 3600000));
  }

  /** Voraussetzungen mit Erfüllt-Status: [{ ok, alternativen: [{ id, name, stufe, ist, ok }] }] */
  function voraussetzungen(z, f) {
    return f.vor.map(function (gr) {
      var alt = gr.map(function (x) { var ist = stufe(z, x.id); return { id: x.id, name: D().forschungNachId(x.id).name, stufe: x.stufe, ist: ist, ok: ist >= x.stufe }; });
      return { ok: alt.some(function (a) { return a.ok; }), alternativen: alt };
    });
  }
  function voraussetzungenOk(z, f) { return voraussetzungen(z, f).every(function (gr) { return gr.ok; }); }
  function vorText(gr) { return gr.alternativen.map(function (a) { return a.name + " " + a.stufe; }).join(" oder "); }
  function laeuft(z, id) { return !!(z.forschungsauftrag && z.forschungsauftrag.id === id); }
  /** Sichtbarkeit (ANNAHME): sichtbar, sobald mindestens eine Voraussetzung erfüllt ist oder keine nötig ist. */
  function sichtbar(z, f) {
    if (istMaster(z) || stufe(z, f.id) > 0 || laeuft(z, f.id) || !f.vor.length) return true;
    return voraussetzungen(z, f).some(function (gr) { return gr.ok; });
  }

  /** Nächstes Forschungsziel: { id, name, stufe, kosten, dauer } */
  function ziel(z, id) {
    var f = D().forschungNachId(id);
    if (!f) return null;
    var st = stufe(z, id) + 1, k = kosten(f, st);
    return { id: id, name: f.name, stufe: st, kosten: k, dauer: istMaster(z) ? 0 : dauerMs(z, k) };
  }

  /** Prüft, ob geforscht werden kann. → { ok, grund, ziel, fehlend } */
  function pruefe(z, id) {
    var f = D().forschungNachId(id), zl = ziel(z, id);
    if (!f) return { ok: false, grund: "Unbekannte Forschung." };
    if ((hp(z).gebaeude.forschungseinrichtung || 0) < B().FORSCHUNG.EINRICHTUNG_MIN_STUFE) return { ok: false, grund: "Zuerst die Forschungseinrichtung bauen.", ziel: zl, einrichtung: true };
    var master = istMaster(z);
    if (!master) {
      var fehlt = voraussetzungen(z, f).filter(function (gr) { return !gr.ok; });
      if (fehlt.length) return { ok: false, grund: "Voraussetzung fehlt: " + fehlt.map(vorText).join(", ") + ".", ziel: zl, gesperrt: true };
    }
    if (z.forschungsauftrag) return { ok: false, grund: "Es läuft bereits eine Forschung.", ziel: zl };
    var ba = hp(z).bauauftrag;
    if (ba && ba.art === "gebaeude" && ba.id === "forschungseinrichtung") return { ok: false, grund: "Die Forschungseinrichtung wird gerade ausgebaut.", ziel: zl };
    if (master) return { ok: true, grund: "", ziel: zl, master: true };
    var fe = SS.kern.bau.fehlend(z, zl.kosten);
    if (Object.keys(fe).length) {
      var namen = Object.keys(fe).map(function (rid) { var r = D().rohstoffNachId(rid); return (r ? r.name : rid) + " " + fz(fe[rid]); });
      return { ok: false, grund: "Es fehlen: " + namen.join(", ") + ".", ziel: zl, fehlend: fe };
    }
    return { ok: true, grund: "", ziel: zl };
  }

  /** Startet eine Forschung (Kosten sofort abgezogen). Master: kostenlos und sofort fertig (→ sofort: true). */
  function starte(z, id, jetzt) {
    var pr = pruefe(z, id);
    if (!pr.ok) return pr;
    var zl = pr.ziel, master = istMaster(z);
    if (!master) Object.keys(zl.kosten).forEach(function (rid) { z.rohstoffe[rid] -= zl.kosten[rid]; });
    z.forschungsauftrag = { art: "forschung", id: id, name: zl.name, stufe: zl.stufe, kosten: zl.kosten, start: jetzt, ende: jetzt + (master ? 0 : zl.dauer), planet: hp(z).id };
    if (master) { z.forschungsauftrag.master = true; return { ok: true, auftrag: fertigstellen(z), sofort: true }; }
    return { ok: true, auftrag: z.forschungsauftrag };
  }
  function abbrechen(z) {
    var a = z.forschungsauftrag;
    if (!a) return { ok: false, grund: "Keine Forschung." };
    if (!a.master) Object.keys(a.kosten).forEach(function (rid) { z.rohstoffe[rid] = (z.rohstoffe[rid] || 0) + a.kosten[rid]; });
    z.forschungsauftrag = null;
    return { ok: true, auftrag: a };
  }
  function fertigstellen(z) {
    var a = z.forschungsauftrag;
    if (!a) return null;
    z.forschung[a.id] = Math.max(stufe(z, a.id), a.stufe);
    z.punkte = (z.punkte || 0) + SS.kern.bau.punkteFuer(a.kosten); // Punkte wie OGame (auch Master, ANNAHME)
    SS.kern.bau.freischaltungenPruefen(z);
    z.forschungsauftrag = null;
    return a;
  }

  // ---------- Wirkungen ----------
  /** Wirkung einer Forschung bei Stufe n → { wert, text } */
  function wirkung(id, n) {
    var f = D().forschungNachId(id), w = f.wirkung, wert, text;
    switch (w.typ) {
      case "prozent": wert = w.je * n; text = "+" + fz(wert) + " % " + w.ziel; break;
      case "anzahl": wert = w.basis + w.je * n; text = fz(wert) + " " + (wert === 1 && w.ziel1 ? w.ziel1 : w.ziel); break;
      case "bauzeit": wert = 1 / (1 + w.je * n); text = "Bauzeit ×" + (Math.round(wert * 1000) / 1000).toLocaleString("de-DE") + " (÷ " + (1 + w.je * n).toLocaleString("de-DE") + ")"; break;
      case "kolonien": wert = Math.ceil(n / 2); text = fz(wert) + " " + (wert === 1 && w.ziel1 ? w.ziel1 : w.ziel); break;
      default: wert = n > 0 ? 1 : 0; text = n > 0 ? w.ziel + " freigeschaltet" : "noch nicht freigeschaltet";
    }
    return { wert: wert, text: text };
  }
  /** Zentrale Bonus-Funktion für spätere Kapitel: Wert der Wirkung bei der aktuellen Stufe
   *  (Prozent → z. B. 30 für +30 %, Anzahl → Anzahl, Bauzeit → Faktor, Kolonien → Anzahl, Freischaltung → 0/1). */
  function bonus(z, id) { return wirkung(id, stufe(z, id)).wert; }
  /** Faktor auf die Stromerzeugung von Solarfarm, Ölverbrennung und Solarsatelliten (wirkt jetzt). */
  function energieFaktor(z) { return 1 + bonus(z, "energie") / 100; }
  /** Faktor auf Gebäude-/Startplatz-Bauzeit (wirkt jetzt; nicht auf Forschung). */
  function roboterFaktor(z) { return z && z.forschung ? bonus(z, "roboter") : 1; }

  // ---------- Warteschlange (0.22.0, Sandro pt65u) ----------
  // z.forschungsschlange = [{ id }] – max. WARTESCHLANGE.FORSCHUNG Plätze; Einreihen ohne Rohstoff-Check, Start FIFO.
  function schlangeMax() { return (B().WARTESCHLANGE || {}).FORSCHUNG || 5; }
  function geplanteStufe(z, id, bis) {
    var s = stufe(z, id);
    if (z.forschungsauftrag && z.forschungsauftrag.id === id) s = Math.max(s, z.forschungsauftrag.stufe);
    (z.forschungsschlange || []).slice(0, bis == null ? undefined : bis).forEach(function (q) { if (q.id === id) s++; });
    return s + 1;
  }
  function schlangeAnsicht(z) {
    return (z.forschungsschlange || []).map(function (q, i) {
      var f = D().forschungNachId(q.id), st = geplanteStufe(z, q.id, i);
      return { id: q.id, name: f ? f.name : q.id, stufe: st, kosten: f ? kosten(f, st) : {}, index: i };
    });
  }
  function pruefeEinreihen(z, id) {
    var f = D().forschungNachId(id);
    if (!f) return { ok: false, grund: "Unbekannte Forschung." };
    var ba = hp(z).bauauftrag, einrichtungKommt = (ba && ba.id === "forschungseinrichtung") || (hp(z).bauschlange || []).some(function (q) { return q.id === "forschungseinrichtung"; });
    if ((hp(z).gebaeude.forschungseinrichtung || 0) < B().FORSCHUNG.EINRICHTUNG_MIN_STUFE && !einrichtungKommt) return { ok: false, grund: "Zuerst die Forschungseinrichtung bauen.", einrichtung: true };
    if (!istMaster(z)) { // Voraussetzungen inkl. bereits eingereihter Forschungen
      var fehlt = f.vor.filter(function (gr) { return !gr.some(function (x) { return geplanteStufe(z, x.id) - 1 >= x.stufe; }); });
      if (fehlt.length) return { ok: false, grund: "Voraussetzung fehlt: " + voraussetzungen(z, f).filter(function (g2) { return !g2.ok; }).map(vorText).join(", ") + ".", gesperrt: true };
    }
    if ((z.forschungsschlange || []).length >= schlangeMax()) return { ok: false, grund: "Warteschlange voll (" + schlangeMax() + " Plätze)." };
    return { ok: true, grund: "", stufe: geplanteStufe(z, id) };
  }
  function beauftragen(z, id, jetzt) {
    z.forschungsschlange = z.forschungsschlange || [];
    if (!z.forschungsauftrag && !z.forschungsschlange.length && pruefe(z, id).ok) return starte(z, id, jetzt);
    var e = pruefeEinreihen(z, id);
    if (!e.ok) return e;
    z.forschungsschlange.push({ id: id });
    var gestartet = schlangeVoranbringen(z, jetzt);
    return { ok: true, eingereiht: true, stufe: e.stufe, gestartet: gestartet, platz: z.forschungsschlange.length };
  }
  function ausSchlangeEntfernen(z, index) {
    if (!z.forschungsschlange || !z.forschungsschlange[index]) return null;
    return z.forschungsschlange.splice(index, 1)[0];
  }
  function schlangeVoranbringen(z, jetzt) {
    var erg = [], sicherung = 0;
    while (!z.forschungsauftrag && z.forschungsschlange && z.forschungsschlange.length && sicherung++ < 100) {
      var q = z.forschungsschlange[0];
      if (!D().forschungNachId(q.id)) { z.forschungsschlange.shift(); continue; }
      var r = starte(z, q.id, jetzt);
      if (!r.ok) break;
      z.forschungsschlange.shift();
      erg.push(r.auftrag);
    }
    return erg;
  }
  function schlangeWartegrund(z) {
    if (!z.forschungsschlange || !z.forschungsschlange.length || z.forschungsauftrag) return "";
    var pr = pruefe(z, z.forschungsschlange[0].id);
    return pr.ok ? "" : (pr.fehlend ? "Wartet auf Rohstoffe – " : "Wartet – ") + pr.grund;
  }

  SS.kern.forschung = {
    schlangeMax: schlangeMax, geplanteStufe: geplanteStufe, schlangeAnsicht: schlangeAnsicht, pruefeEinreihen: pruefeEinreihen, beauftragen: beauftragen,
    ausSchlangeEntfernen: ausSchlangeEntfernen, schlangeVoranbringen: schlangeVoranbringen, schlangeWartegrund: schlangeWartegrund,
    stufe: stufe, kosten: kosten, dauerMs: dauerMs, einrichtungStufe: einrichtungStufe, voraussetzungen: voraussetzungen,
    voraussetzungenOk: voraussetzungenOk, sichtbar: sichtbar, ziel: ziel, pruefe: pruefe, starte: starte, abbrechen: abbrechen,
    fertigstellen: fertigstellen, wirkung: wirkung, bonus: bonus, energieFaktor: energieFaktor, roboterFaktor: roboterFaktor, istMaster: istMaster
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
