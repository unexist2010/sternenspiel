/*
 * Sternenspiel – Rangliste (0.21.0, Sandro pt61u), OGame-artig.
 * FEST: Kategorien Gesamt, Gebäude, Forschung, Flotte, Verteidigung; Spieler + KI (Siedler/Piraten/Rivalen) + Testgegner Alpha/Beta.
 *       Klick auf einen Eintrag → Weltraum-Ansicht des (aktiven) Sonnensystems dieses Spielers (#weltraum/system/N).
 * Spieler: Punkte werden aus dem aktuellen Bestand berechnet (wie OGame: verlorene Schiffe zählen nicht mehr):
 *   Gebäude = alle gebauten Stufen inkl. Startplätze, Forschung = alle Stufen, Flotte = Schiffe auf Planeten/Hangar/unterwegs + Solarsatelliten,
 *   Verteidigung = Verteidigungsanlagen; je Kosten über SS.kern.bau.punkteFuer. Gesamt = Summe.
 *   (z.punkte – Freischalt-Punkte für Startplätze/Kunststoffwerk – bleibt unverändert.)
 * ANNAHME KI: Flotte/Verteidigung aus Bestand; Gesamt = max(KI-Punkte, Flotte+Verteidigung); Rest 65 % Gebäude / 35 % Forschung.
 * Alpha/Beta: nur Flotte + Verteidigung.
 */
(function (g) {
  "use strict";
  var SS = (g.SS = g.SS || {});
  SS.kern = SS.kern || {};
  var KATEGORIEN = [{ id: "gesamt", name: "Gesamt" }, { id: "gebaeude", name: "Gebäude" }, { id: "forschung", name: "Forschung" },
    { id: "flotte", name: "Flotte" }, { id: "verteidigung", name: "Verteidigung" }];
  var ANTEIL_GEBAEUDE = 0.65;

  function pk(k) { return SS.kern.bau.punkteFuer(k || {}); }
  function bestandPunkte(liste, nach) {
    var s = 0; Object.keys(liste || {}).forEach(function (id) { var d = nach(id), n = Number(liste[id]) || 0; if (d && n > 0) s += pk(d.kosten) * n; }); return s;
  }
  function punkteSpieler(z) {
    var D = SS.DATEN, BAU = SS.kern.bau, r = { gebaeude: 0, forschung: 0, flotte: 0, verteidigung: 0 };
    (z.planeten || []).forEach(function (p) {
      D.gebaeude.forEach(function (d) { for (var st = 1; st <= ((p.gebaeude && p.gebaeude[d.id]) || 0); st++) r.gebaeude += pk(BAU.gebaeudeKosten(d, st)); });
      (p.startplaetze || []).forEach(function (sp) { for (var st = 1; st <= sp.stufe; st++) r.gebaeude += pk(BAU.startplatzKosten(sp.buchstabe, st)); });
      r.flotte += bestandPunkte(p.schiffe, D.schiffNachId) + bestandPunkte(p.hangar && p.hangar.schiffe, D.schiffNachId);
      var sat = D.schiffNachId("solarsatellit"); if (sat) r.flotte += pk(sat.kosten) * (p.solarsatelliten || 0);
      r.verteidigung += bestandPunkte(p.verteidigung, D.verteidigungNachId);
    });
    (z.flotten || []).forEach(function (f) { r.flotte += bestandPunkte(f.schiffe, D.schiffNachId); });
    D.forschung.forEach(function (f) { var n = SS.kern.forschung.stufe(z, f.id); for (var st = 1; st <= n; st++) r.forschung += pk(SS.kern.forschung.kosten(f, st)); });
    return runde(r);
  }
  function punkteGegner(z, x, jetzt) {
    var D = SS.DATEN, r = { gebaeude: 0, forschung: 0, flotte: bestandPunkte(x.schiffe, D.schiffNachId), verteidigung: bestandPunkte(x.verteidigung, D.verteidigungNachId) };
    if (x.ki && SS.kern.ki) {
      var rest = Math.max(0, SS.kern.ki.punkte(z, x, jetzt) - r.flotte - r.verteidigung);
      r.gebaeude = rest * ANTEIL_GEBAEUDE; r.forschung = rest - r.gebaeude;
    }
    return runde(r);
  }
  function runde(r) {
    Object.keys(r).forEach(function (k) { r[k] = Math.floor(r[k]); });
    r.gesamt = r.gebaeude + r.forschung + r.flotte + r.verteidigung; return r;
  }
  var ART = { siedler: "Siedler", pirat: "Pirat", rivale: "Rivale" };
  /** Alle Einträge {id, name, art, eigen, koord:{sektor,system,planet}, punkte:{…}}; sortiert nach kategorie, mit platz. */
  function liste(z, kategorie, jetzt) {
    kategorie = KATEGORIEN.some(function (k) { return k.id === kategorie; }) ? kategorie : "gesamt";
    jetzt = jetzt || (z.zeit && z.zeit.letzterTick) || Date.now();
    var heim = SS.kern.flotte.herkunftKoord(z, z.planeten[0]);
    var out = [{ id: "spieler", name: (z.spieler && z.spieler.name) || z.name || "Du", art: "Spieler", eigen: true,
      koord: { sektor: heim.sektor, system: heim.system, planet: heim.planet }, punkte: punkteSpieler(z) }];
    var gg = SS.kern.testphase ? SS.kern.testphase.alleGegner(z) : (z.gegner || []);
    gg.forEach(function (x) {
      out.push({ id: x.id, name: x.name, art: x.ki ? ART[x.ki.art] || x.ki.art : "Testgegner", eigen: false,
        koord: { sektor: x.sektor, system: x.system, planet: x.planet }, punkte: punkteGegner(z, x, jetzt) });
    });
    out.sort(function (a, b) { return b.punkte[kategorie] - a.punkte[kategorie] || (a.eigen ? -1 : b.eigen ? 1 : 0); });
    out.forEach(function (e, i) { e.platz = i + 1; e.link = "#weltraum/system/" + e.koord.system; });
    return out;
  }
  SS.kern.rangliste = { KATEGORIEN: KATEGORIEN, liste: liste, punkteSpieler: punkteSpieler, punkteGegner: punkteGegner };
})(typeof globalThis !== "undefined" ? globalThis : this);
