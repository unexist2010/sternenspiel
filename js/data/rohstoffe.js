/*
 * Sternenspiel – Rohstoff-Definitionen.
 * Die Liste der Rohstoffe ist von Sandro festgelegt:
 * Metall, Silizium, Rohöl, Strom, Kunststoff (T1, T2, T3), Antimaterie.
 * Kürzel, Farben und Gruppen sind ANNAHMEN für die Darstellung.
 */
(function (g) {
  "use strict";
  var SS = (g.SS = g.SS || {});
  SS.DATEN = SS.DATEN || {};

  SS.DATEN.rohstoffe = Object.freeze([
    { id: "metall",        name: "Metall",        kurz: "Me", gruppe: "grund",    farbe: "#9fb3c8" },
    { id: "silizium",      name: "Silizium",      kurz: "Si", gruppe: "grund",    farbe: "#7fd1c7" },
    { id: "rohoel",        name: "Rohöl",         kurz: "Öl", gruppe: "grund",    farbe: "#c9a46a" },
    { id: "strom",         name: "Strom",         kurz: "St", gruppe: "grund",    farbe: "#ffd75e" },
    { id: "kunststoff_t1", name: "Kunststoff T1", kurz: "K1", gruppe: "veredelt", tier: 1, farbe: "#b9e07a" },
    { id: "kunststoff_t2", name: "Kunststoff T2", kurz: "K2", gruppe: "veredelt", tier: 2, farbe: "#7ac8e0" },
    { id: "kunststoff_t3", name: "Kunststoff T3", kurz: "K3", gruppe: "veredelt", tier: 3, farbe: "#c58cf0" },
    { id: "antimaterie",   name: "Antimaterie",   kurz: "AM", gruppe: "exotisch", farbe: "#ff6fae" }
  ]);

  SS.DATEN.rohstoffIds = Object.freeze(SS.DATEN.rohstoffe.map(function (r) { return r.id; }));

  SS.DATEN.rohstoffNachId = function (id) {
    for (var i = 0; i < SS.DATEN.rohstoffe.length; i++) {
      if (SS.DATEN.rohstoffe[i].id === id) return SS.DATEN.rohstoffe[i];
    }
    return null;
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
