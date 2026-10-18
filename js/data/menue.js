/*
 * Sternenspiel – Hauptmenü (linke Leiste).
 * FEST (Sandro): genau diese 8 Punkte in genau dieser Reihenfolge:
 *   Übersicht, Ressourcen, Anlagen, Forschung, Werft, Verteidigung, Flotte, Weltraum.
 * Kapitel 1 = reine Seitenstruktur: jede Seite existiert im gleichen Layout, aber ohne Inhalt
 * (nur Titel + neutraler Platzhalter). Übersicht zeigt Hauptplanet + Koordinaten + Spielstand-Knöpfe.
 * Jeder Menüpunkt bzw. einzelne Mechaniken bekommen später eigene Kapitel (docs/KAPITELPLAN.md).
 */
(function (g) {
  "use strict";
  var SS = (g.SS = g.SS || {});
  SS.DATEN = SS.DATEN || {};

  SS.DATEN.PLATZHALTER_TEXT = "Wird in einem eigenen Kapitel ausgearbeitet.";

  SS.DATEN.menue = Object.freeze([
    Object.freeze({ id: "uebersicht",   name: "Übersicht",    platzhalter: false }),
    Object.freeze({ id: "ressourcen",   name: "Ressourcen",   platzhalter: true }),
    Object.freeze({ id: "anlagen",      name: "Anlagen",      platzhalter: true }),
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
