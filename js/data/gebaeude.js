/*
 * Sternenspiel – Gebäude (Andockpunkt für spätere Kapitel).
 * In Kapitel 1 noch NICHT spielbar. Fest von Sandro: es gibt eine Geologiestation.
 * Alles weitere (Kosten, Wirkung, weitere Gebäude) folgt in einem späteren Kapitel.
 */
(function (g) {
  "use strict";
  var SS = (g.SS = g.SS || {});
  SS.DATEN = SS.DATEN || {};

  SS.DATEN.gebaeude = Object.freeze([
    Object.freeze({
      id: "geologiestation",
      name: "Geologiestation",
      kapitel: 2,
      // ANNAHME: Zweck = Lagerstätten erkunden/bestimmen; genaue Wirkung offen
      beschreibung: "Erkundet und bestimmt die Rohstoffvorkommen des Hauptplaneten."
    })
  ]);
})(typeof globalThis !== "undefined" ? globalThis : this);
