/*
 * Sternenspiel – Hauptmenü (linke Leiste).
 * FEST (Sandro): genau diese 8 Punkte in genau dieser Reihenfolge:
 *   Übersicht, Ressourcen, Anlagen, Forschung, Werft, Verteidigung, Flotte, Weltraum.
 * „kapitel“ = in welchem Kapitel die Seite ihren Inhalt bekommt (siehe docs/KAPITELPLAN.md).
 */
(function (g) {
  "use strict";
  var SS = (g.SS = g.SS || {});
  SS.DATEN = SS.DATEN || {};

  SS.DATEN.menue = Object.freeze([
    Object.freeze({ id: "uebersicht",   name: "Übersicht",    kapitel: 1, platzhalter: false }),
    Object.freeze({ id: "ressourcen",   name: "Ressourcen",   kapitel: 1, platzhalter: false }),
    Object.freeze({ id: "anlagen",      name: "Anlagen",      kapitel: 2, platzhalter: true, text: "Hier entstehen Gebäude wie die Geologiestation, Förderanlagen und Lager." }),
    Object.freeze({ id: "forschung",    name: "Forschung",    kapitel: 3, platzhalter: true, text: "Hier werden Technologien erforscht – u. a. Kunststoff-Tiers und die Freischaltung der Antimaterie." }),
    Object.freeze({ id: "werft",        name: "Werft",        kapitel: 4, platzhalter: true, text: "Hier werden die 23 Schiffe mit 2 Hüllentypen und 5 Waffentypen gebaut." }),
    Object.freeze({ id: "verteidigung", name: "Verteidigung", kapitel: 5, platzhalter: true, text: "Hier entstehen Verteidigungsanlagen und der Schutzschild (Autoaktivierung als Solo-Regel)." }),
    Object.freeze({ id: "flotte",       name: "Flotte",       kapitel: 6, platzhalter: true, text: "Hier werden Flotten zusammengestellt, über die Startplätze gestartet und mit Treibstoff zu Missionen entsandt." }),
    Object.freeze({ id: "weltraum",     name: "Weltraum",     kapitel: 1, platzhalter: false })
  ]);

  SS.DATEN.menuePunkt = function (id) {
    for (var i = 0; i < SS.DATEN.menue.length; i++) if (SS.DATEN.menue[i].id === id) return SS.DATEN.menue[i];
    return null;
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
