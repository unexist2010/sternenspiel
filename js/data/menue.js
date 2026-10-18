/*
 * Sternenspiel – Hauptmenü (linke Leiste).
 * FEST (Sandro): genau diese 8 Punkte in genau dieser Reihenfolge:
 *   Übersicht, Ressourcen, Anlagen, Forschung, Werft, Verteidigung, Flotte, Weltraum.
 * Inhalt haben: Übersicht, Ressourcen (Kapitel 1/2) und Anlagen (Kapitel 2). Alle anderen Seiten zeigen nur
 * Titel + neutralen Platzhalter.
 * Jeder Menüpunkt bzw. einzelne Mechaniken bekommen später eigene Kapitel (docs/KAPITELPLAN.md).
 */
(function (g) {
  "use strict";
  var SS = (g.SS = g.SS || {});
  SS.DATEN = SS.DATEN || {};

  SS.DATEN.PLATZHALTER_TEXT = "Wird in einem eigenen Kapitel ausgearbeitet.";

  SS.DATEN.menue = Object.freeze([
    Object.freeze({ id: "uebersicht",   name: "Übersicht",    platzhalter: false }),
    Object.freeze({ id: "ressourcen",   name: "Ressourcen",   platzhalter: false }),
    Object.freeze({ id: "anlagen",      name: "Anlagen",      platzhalter: false }),
    Object.freeze({ id: "forschung",    name: "Forschung",    platzhalter: true }),
    Object.freeze({ id: "werft",        name: "Werft",        platzhalter: true }),
    Object.freeze({ id: "verteidigung", name: "Verteidigung", platzhalter: true }),
    Object.freeze({ id: "flotte",       name: "Flotte",       platzhalter: true }),
    Object.freeze({ id: "weltraum",     name: "Weltraum",     platzhalter: true })
  ]);

  SS.DATEN.menuePunkt = function (id) {
    for (var i = 0; i < SS.DATEN.menue.length; i++) if (SS.DATEN.menue[i].id === id) return SS.DATEN.menue[i];
    return null;
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
