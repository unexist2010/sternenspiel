/*
 * Sternenspiel – Startplätze A–Z.
 * Von Sandro festgelegt: 26 Startplätze A–Z, jeder mit einer Stufe 1–15.
 * ANNAHME: Die Zuordnung Buchstabe → Stufe ist fest (deterministisch, deckt alle Stufen 1–15 ab):
 *          Stufe = ((Index × 4) mod 15) + 1   (A=1, B=5, C=9, D=13, E=2 …)
 * ANNAHME: Jeder Startplatz hat einen Schwerpunkt-Rohstoff (reihum Metall, Silizium, Rohöl, Strom).
 * ANNAHME: Höhere Stufe = höhere Rohstoffboni (Formel in js/kern/produktion.js, Werte in konstanten.js).
 */
(function (g) {
  "use strict";
  var SS = (g.SS = g.SS || {});
  SS.DATEN = SS.DATEN || {};

  var SCHWERPUNKTE = ["metall", "silizium", "rohoel", "strom"];
  var BUCHSTABEN = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  SS.DATEN.startplaetze = Object.freeze(BUCHSTABEN.map(function (b, i) {
    return Object.freeze({
      buchstabe: b,
      name: "Startplatz " + b,
      stufe: ((i * 4) % 15) + 1,
      schwerpunkt: SCHWERPUNKTE[i % SCHWERPUNKTE.length]
    });
  }));

  SS.DATEN.startplatzNachBuchstabe = function (b) {
    b = String(b || "").toUpperCase();
    for (var i = 0; i < SS.DATEN.startplaetze.length; i++) {
      if (SS.DATEN.startplaetze[i].buchstabe === b) return SS.DATEN.startplaetze[i];
    }
    return null;
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
