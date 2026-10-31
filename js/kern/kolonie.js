/*
 * Sternenspiel – Kolonisieren (0.18.0, Sandro t49u „wie OGame“). DOM-frei, in Node testbar.
 * FEST (Sandro): Kolonieschiff wird bei Ankunft verbraucht; neuer eigener Planet an den Zielkoordinaten;
 *   Restflotte stationiert dort; mitgebrachte Rohstoffe werden entladen. Neuer Planet hat dieselben Gebäude (Stufe 0) wie die Heimat.
 * Spec (Astrophysik): Kolonien = aufgerundet Stufe / 2 (Stufe 1 = 1, Stufe 3 = 2 …).
 * ANNAHME: Rohstoffe sind global (ein Lager je Spieler) → Ladung wird dem Gesamtlager gutgeschrieben.
 * ANNAHME: Kolonien bekommen die Grundproduktion wie der Hauptplanet (OGame), Rohölvorkommen 0 (FEST 0.7.0), keine Startgebäude.
 */
(function (g) {
  "use strict";
  var SS = (g.SS = g.SS || {});
  SS.kern = SS.kern || {};
  var D = function () { return SS.DATEN; };

  function kolonien(z) { return (z.planeten || []).filter(function (p) { return !p.istHauptplanet; }).length; }
  function maxKolonien(z) { return Math.ceil(SS.kern.forschung.stufe(z, "astrophysik") / 2); }
  function belegtVon(z, k) {
    var gl = function (a) { return a && a.sektor === k.sektor && a.system === k.system && a.planet === k.planet; };
    if (SS.kern.flotte.eigenePlaneten(z).some(gl)) return "eigen";
    if ((SS.kern.testphase ? SS.kern.testphase.alleGegner(z) : (z.gegner || [])).some(gl)) return "gegner";
    return "";
  }
  /** Prüfung (Senden + Ankunft) → Fehlertext oder "" */
  function pruefe(z, k) {
    if (!k || !(k.planet >= 1 && k.planet <= 12)) return "Kolonisieren nur auf Position 1–12.";
    var b = belegtVon(z, k);
    if (b === "eigen") return "Planet gehört dir schon.";
    if (b === "gegner") return "Position ist besetzt.";
    if (kolonien(z) >= maxKolonien(z)) return "Kolonie-Limit erreicht (" + kolonien(z) + " / " + maxKolonien(z) + ", Astrophysik " + SS.kern.forschung.stufe(z, "astrophysik") + " → aufgerundet Stufe/2).";
    return "";
  }
  /** Ankunft: Planet anlegen, Kolonieschiff verbrauchen, Rest stationieren, Ladung entladen. Liefert Planet oder {fehler}. */
  function gruende(z, f) {
    var grund = pruefe(z, f.ziel);
    if (grund) return { fehler: grund };
    z.kolonieZaehler = (z.kolonieZaehler || 0) + 1;
    var p = SS.kern.zustand.neuerPlanet(false);
    p.id = "k" + z.kolonieZaehler + "-" + f.ziel.system + "-" + f.ziel.planet;
    p.kolonie = true;
    // 0.18.1: Raumflughafen 1 + Startplatz A Stufe 1, damit die stationierte Flotte sofort starten kann
    p.gebaeude.raumflughafen = 1; if (p.startplaetze && p.startplaetze[0]) p.startplaetze[0].stufe = 1;
    p.koordinaten = { sektor: f.ziel.sektor, system: f.ziel.system, planet: f.ziel.planet };
    p.name = (f.zielName && f.zielName.indexOf("[") < 0 ? f.zielName : "Kolonie " + z.kolonieZaehler).slice(0, 24);
    var rest = JSON.parse(JSON.stringify(f.schiffe));
    rest.kolonieschiff -= 1; if (rest.kolonieschiff <= 0) delete rest.kolonieschiff;
    p.schiffe = rest;
    if (f.ladung) Object.keys(f.ladung).forEach(function (rid) { z.rohstoffe[rid] = (z.rohstoffe[rid] || 0) + f.ladung[rid]; });
    z.planeten.push(p);
    return { planet: p, schiffe: rest, ladung: f.ladung || {} };
  }

  SS.kern.kolonie = { kolonien: kolonien, maxKolonien: maxKolonien, pruefe: pruefe, gruende: gruende, belegtVon: belegtVon };
})(typeof globalThis !== "undefined" ? globalThis : this);
