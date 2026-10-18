/*
 * Sternenspiel – Schiffe, Hüllentypen, Waffentypen (Andockpunkt für spätere Kapitel).
 * Von Sandro festgelegt: 23 Schiffe, 5 Waffentypen, 2 Hüllentypen.
 * Namen und Werte sind noch NICHT festgelegt → Listen bleiben in Kapitel 1 leer.
 */
(function (g) {
  "use strict";
  var SS = (g.SS = g.SS || {});
  SS.DATEN = SS.DATEN || {};

  SS.DATEN.SCHIFFE_ANZAHL_SOLL = 23;
  SS.DATEN.WAFFENTYPEN_ANZAHL_SOLL = 5;
  SS.DATEN.HUELLENTYPEN_ANZAHL_SOLL = 2;

  SS.DATEN.schiffe = [];      // späteres Kapitel
  SS.DATEN.waffentypen = [];  // späteres Kapitel
  SS.DATEN.huellentypen = []; // späteres Kapitel
})(typeof globalThis !== "undefined" ? globalThis : this);
