/*
 * Sternenspiel – Startplätze = Start-/Abschussplattformen (Launch Pads) für Flotten, gebaut über den Raumflughafen (Kapitel 2).
 *
 * FEST (Sandro):
 *  - bis zu 10 Startplätze, mit Buchstaben beschriftet
 *  - jeder Startplatz hat eigene Ausbaustufen 1–15, deutlich teurer je Stufe
 *  - neue Startplätze werden nach Spielerpunkten freigeschaltet
 *  - Kapazität zählt NUR die Anzahl Schiffe (Größe egal)
 *  - die Summe aller Startplätze begrenzt, wie viele Schiffe gleichzeitig starten können
 *  - keine Zuordnung Schiff → Startplatz, nur Kapazität
 * ANNAHME: Buchstaben A–J, Kapazität/Kosten/Punkteschwellen (siehe konstanten.js → STARTPLAETZE).
 */
(function (g) {
  "use strict";
  var SS = (g.SS = g.SS || {});
  SS.DATEN = SS.DATEN || {};
  var K = SS.BALANCE.STARTPLAETZE;

  SS.DATEN.startplatzBuchstaben = Object.freeze(K.BUCHSTABEN.split("").slice(0, K.MAX_ANZAHL));

  SS.DATEN.startplatzRegeln = Object.freeze([
    "Bis zu " + K.MAX_ANZAHL + " Startplätze (" + K.BUCHSTABEN[0] + "–" + K.BUCHSTABEN[K.MAX_ANZAHL - 1] + "), jeder mit eigenen Stufen " + K.STUFE_MIN + "–" + K.STUFE_MAX + ".",
    "Jede Stufe ist deutlich teurer als die vorige.",
    "Neue Startplätze werden mit steigenden Spielerpunkten freigeschaltet.",
    "Kapazität = Anzahl Schiffe (Größe egal); die Summe aller Startplätze begrenzt gleichzeitige Starts.",
    "Schiffe werden keinem Startplatz zugeordnet – es zählt nur die Gesamtkapazität."
  ]);

  /** Anfangszustand der Startplätze eines Planeten: alle Stufe 0 (noch nicht gebaut). */
  SS.DATEN.startplaetzeAnfang = function () {
    return SS.DATEN.startplatzBuchstaben.map(function (b) { return { buchstabe: b, stufe: 0 }; });
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
