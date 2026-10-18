/*
 * Sternenspiel – zentrale Spielbalance-Konstanten.
 * ALLE Zahlen in dieser Datei sind ANNAHMEN (nicht von Sandro festgelegt),
 * siehe docs/SPEZIFIKATION.md und docs/OFFENE-PUNKTE.md.
 * Spätere Kapitel ergänzen hier ihre Konstanten (Gebäude, Schiffe, Kampf …).
 */
(function (g) {
  "use strict";
  var SS = (g.SS = g.SS || {});

  function tiefFrieren(o) {
    Object.getOwnPropertyNames(o).forEach(function (k) {
      if (o[k] && typeof o[k] === "object") tiefFrieren(o[k]);
    });
    return Object.freeze(o);
  }

  SS.BALANCE = tiefFrieren({
    // Version des Spielstand-Formats (für Migrationen in späteren Kapiteln)
    SPIELSTAND_VERSION: 2,   // v2: Heimatplanet (Weltraum-Hierarchie) + Freischaltungen
    SPEICHER_SCHLUESSEL: "sternenspiel_spielstand_v1",

    // Zeit
    TICK_MS: 1000,              // ANNAHME: 1 Tick pro Sekunde (Anzeige); Produktion rechnet mit echter Zeitdifferenz
    AUTOSPEICHERN_MS: 30000,    // ANNAHME: Autospeichern alle 30 s
    OFFLINE_MAX_STUNDEN: 24,    // ANNAHME: Offline-Fortschritt wird auf 24 h gekappt

    // Weltraum-Hierarchie (FEST: 1 Universum, 5 Sektoren, 300 Sonnensysteme, 12 Planeten je System)
    // ANNAHME: gleichmäßige Verteilung 60 Systeme je Sektor, Systemnummern global 1–300.
    // Planetengrößen und Feldlimits werden bewusst NICHT abgebildet (FEST).
    WELTRAUM: {
      SEKTOREN: 5,
      SYSTEME_GESAMT: 300,
      PLANETEN_PRO_SYSTEM: 12
    },

    // Startplätze A–Z mit Stufe 1–15 (Stufen sind von Sandro festgelegt, Boni-Formel ist ANNAHME)
    STARTPLATZ: {
      STUFE_MIN: 1,
      STUFE_MAX: 15,
      BONUS_ALLE_PRO_STUFE: 0.02,        // ANNAHME: +2 % auf alle Grundrohstoffe je Stufe über 1
      BONUS_SCHWERPUNKT_PRO_STUFE: 0.03  // ANNAHME: zusätzlich +3 % je Stufe auf den Schwerpunkt-Rohstoff
    },

    // ANNAHME: Grundproduktion pro Stunde ohne Gebäude (Kapitel 1).
    // Kunststoff T1–T3 und Antimaterie werden erst über Gebäude/Forschung (Kapitel 2/3) produziert.
    GRUNDPRODUKTION_PRO_STUNDE: {
      metall: 120,
      silizium: 80,
      rohoel: 60,
      strom: 100,
      kunststoff_t1: 0,
      kunststoff_t2: 0,
      kunststoff_t3: 0,
      antimaterie: 0
    },

    // ANNAHME: Startbestand
    STARTBESTAND: {
      metall: 500,
      silizium: 300,
      rohoel: 200,
      strom: 100,
      kunststoff_t1: 50,
      kunststoff_t2: 0,
      kunststoff_t3: 0,
      antimaterie: 0
    },

    // ANNAHME: Grund-Lagerkapazität (später durch Lager-Gebäude erweiterbar)
    LAGER_GRUND: {
      metall: 10000,
      silizium: 10000,
      rohoel: 10000,
      strom: 5000,
      kunststoff_t1: 2000,
      kunststoff_t2: 1000,
      kunststoff_t3: 500,
      antimaterie: 100
    }
  });
})(typeof globalThis !== "undefined" ? globalThis : this);
