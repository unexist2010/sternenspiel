/*
 * Sternenspiel – Startplätze = Start-/Abschussplattformen (Launch Pads) für Flotten auf dem Hauptplaneten.
 * NUR Doku/Datenmodell-Platzhalter – in Kapitel 1 NICHT sichtbar. Ausbau, Kosten und Flottenstart folgen in einem späteren eigenen Kapitel.
 *
 * FEST (Sandro):
 *  - bis zu 10 Startplätze, mit Buchstaben beschriftet
 *  - jeder Startplatz hat eigene Ausbaustufen 1–15, die Kosten steigen stark
 *  - neue Startplätze werden punktebasiert freigeschaltet (Schwellen offen)
 *  - Kapazität zählt NUR die Anzahl Schiffe (Größe egal)
 *  - die Summe aller Startplätze begrenzt, wie viele Schiffe gleichzeitig starten können
 *  - mit wachsender Flotte muss man immer wieder ausbauen
 *  - keine Zuordnung Schiff → Startbahn, nur Kapazität
 * ANNAHME: Buchstaben A–J; Start mit Startplatz A auf Stufe 1 (siehe konstanten.js).
 */
(function (g) {
  "use strict";
  var SS = (g.SS = g.SS || {});
  SS.DATEN = SS.DATEN || {};
  var K = SS.BALANCE.STARTPLAETZE;

  SS.DATEN.startplatzBuchstaben = Object.freeze(K.BUCHSTABEN.split("").slice(0, K.MAX_ANZAHL));

  SS.DATEN.startplatzRegeln = Object.freeze([
    "Bis zu " + K.MAX_ANZAHL + " Startplätze, beschriftet mit Buchstaben (" + K.BUCHSTABEN[0] + "–" + K.BUCHSTABEN[K.MAX_ANZAHL - 1] + ").",
    "Jeder Startplatz hat eigene Ausbaustufen " + K.STUFE_MIN + "–" + K.STUFE_MAX + "; die Kosten steigen stark.",
    "Neue Startplätze werden über Punkte freigeschaltet.",
    "Die Kapazität zählt nur die Anzahl der Schiffe – die Größe ist egal.",
    "Die Summe aller Startplätze begrenzt, wie viele Schiffe gleichzeitig starten können.",
    "Wächst die Flotte, müssen die Startplätze immer wieder ausgebaut werden.",
    "Schiffe werden keinem bestimmten Startplatz zugeordnet – es zählt nur die Gesamtkapazität."
  ]);

  /** Anfangszustand der Startplätze für einen neuen Spielstand (ANNAHME: A frei, Stufe 1). */
  SS.DATEN.startplaetzeAnfang = function () {
    return SS.DATEN.startplatzBuchstaben.map(function (b, i) {
      var frei = i < K.START_FREIGESCHALTET;
      return { buchstabe: b, stufe: frei ? K.START_STUFE : 0, freigeschaltet: frei };
    });
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
