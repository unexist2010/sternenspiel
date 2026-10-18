/*
 * Sternenspiel – Rohstoff-Definitionen.
 * Die Liste der Rohstoffe ist von Sandro festgelegt:
 * Metall, Silizium, Rohöl, Strom, Kunststoff (T1, T2, T3), Antimaterie.
 * Kürzel, Farben, Gruppen und Icons sind ANNAHMEN für die Darstellung (Icons: eigene SVGs unter assets/rohstoffe/).
 * FEST: Antimaterie ist versteckt, bis sie freigeschaltet wird (Spielstand: freigeschaltet.antimaterie).
 */
(function (g) {
  "use strict";
  var SS = (g.SS = g.SS || {});
  SS.DATEN = SS.DATEN || {};

  SS.DATEN.rohstoffe = Object.freeze([
    { id: "metall",        name: "Metall",        kurz: "Me", gruppe: "grund",    farbe: "#9fb3c8", icon: "assets/rohstoffe/metall.svg" },
    { id: "silizium",      name: "Silizium",      kurz: "Si", gruppe: "grund",    farbe: "#7fd1c7", icon: "assets/rohstoffe/silizium.svg" },
    { id: "rohoel",        name: "Rohöl",         kurz: "Öl", gruppe: "grund",    farbe: "#c9a46a", icon: "assets/rohstoffe/rohoel.svg" },
    { id: "strom",         name: "Strom",         kurz: "St", gruppe: "grund",    farbe: "#ffd75e", icon: "assets/rohstoffe/strom.svg" },
    { id: "kunststoff_t1", name: "Kunststoff T1", kurz: "K1", gruppe: "veredelt", tier: 1, farbe: "#b9e07a", icon: "assets/rohstoffe/kunststoff_t1.svg" },
    { id: "kunststoff_t2", name: "Kunststoff T2", kurz: "K2", gruppe: "veredelt", tier: 2, farbe: "#7ac8e0", icon: "assets/rohstoffe/kunststoff_t2.svg" },
    { id: "kunststoff_t3", name: "Kunststoff T3", kurz: "K3", gruppe: "veredelt", tier: 3, farbe: "#c58cf0", icon: "assets/rohstoffe/kunststoff_t3.svg" },
    { id: "antimaterie",   name: "Antimaterie",   kurz: "AM", gruppe: "exotisch", farbe: "#ff6fae", icon: "assets/rohstoffe/antimaterie.svg", freischaltung: "antimaterie" }
  ]);

  SS.DATEN.rohstoffIds = Object.freeze(SS.DATEN.rohstoffe.map(function (r) { return r.id; }));

  /** Sichtbare Rohstoffe für einen Spielstand (versteckte erst nach Freischaltung). */
  SS.DATEN.sichtbareRohstoffe = function (zustand) {
    var fr = (zustand && zustand.freigeschaltet) || {};
    return SS.DATEN.rohstoffe.filter(function (r) { return !r.freischaltung || fr[r.freischaltung] === true; });
  };

  SS.DATEN.rohstoffNachId = function (id) {
    for (var i = 0; i < SS.DATEN.rohstoffe.length; i++) {
      if (SS.DATEN.rohstoffe[i].id === id) return SS.DATEN.rohstoffe[i];
    }
    return null;
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
