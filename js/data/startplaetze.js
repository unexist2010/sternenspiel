/*
 * Sternenspiel – Startplätze = Start-/Abschussplattformen (Launch Pads) für Flotten, gebaut über den Raumflughafen.
 *
 * FEST (Sandro, 0.7.0 – ersetzt A–J / Stufe 1–15):
 *  - Startplätze A bis Z (26), jeder mit 10 Ausbaustufen
 *  - Buchstabe X erst baubar, wenn der vorige Buchstabe Stufe 10 hat UND der Spieler die Mindest-Punktzahl für X hat
 *  - Kapazität = Anzahl Schiffe, die gleichzeitig vom Planeten starten können (Größe egal); A10 ≈ 100, bis Z10 ≈ 10 Mrd.
 *  - Für später (Flotten-Kapitel, NICHT umgesetzt): Schiffe, die nicht auf die Startplätze passen, stehen automatisch im
 *    Hangar (sicher bei Angriffen, keine Wahl); beim Versand sind alle Schiffe sichtbar, gleichzeitig unterwegs höchstens
 *    „Kapazität“; Kapazität wird erst nach Rückkehr/Zerstörung/Umstationierung frei.
 * ANNAHME: Kapazität je Stufe, Kosten, Punkteschwellen (siehe konstanten.js → STARTPLAETZE, Tabelle in SPEZIFIKATION).
 */
(function (g) {
  "use strict";
  var SS = (g.SS = g.SS || {});
  SS.DATEN = SS.DATEN || {};
  var K = SS.BALANCE.STARTPLAETZE;

  SS.DATEN.startplatzBuchstaben = Object.freeze(K.BUCHSTABEN.split("").slice(0, K.MAX_ANZAHL));

  SS.DATEN.startplatzRegeln = Object.freeze([
    K.MAX_ANZAHL + " Startplätze (A–Z), jeder mit " + K.STUFE_MAX + " Ausbaustufen.",
    "Ein Buchstabe wird baubar, wenn der vorige Stufe " + K.VORGAENGER_STUFE + " erreicht hat und deine Punkte die Schwelle erreichen.",
    "Kapazität = Anzahl Schiffe, die gleichzeitig vom Planeten starten können (Größe egal); es zählt die Summe aller Startplätze.",
    "Schiffe, die nicht auf die Startplätze passen, stehen später automatisch sicher im Hangar (Flotten-Kapitel)."
  ]);

  /** Anfangszustand der Startplätze eines Planeten: alle Stufe 0 (noch nicht gebaut). */
  SS.DATEN.startplaetzeAnfang = function () {
    return SS.DATEN.startplatzBuchstaben.map(function (b) { return { buchstabe: b, stufe: 0 }; });
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
