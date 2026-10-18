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

  // Programmversion: muss mit <html data-version> und den ?v=-Parametern in index.html übereinstimmen (Cache-Schutz).
  SS.VERSION = "0.6.0";

  SS.BALANCE = tiefFrieren({
    // Version des Spielstand-Formats (für Migrationen in späteren Kapiteln)
    SPIELSTAND_VERSION: 4,   // v2: Heimatplanet · v3: automatischer Start · v4: Kapitel 2 – Planeten mit Gebäuden, Bauauftrag, Startplätzen
    SPEICHER_SCHLUESSEL: "sternenspiel_spielstand_v1",          // alter Einzel-Spielstand (bis 0.3) – wird als erstes Profil übernommen
    PROFIL_INDEX_SCHLUESSEL: "sternenspiel_profile_v1",         // Liste der Spielerprofile
    PROFIL_SPIELSTAND_PRAEFIX: "sternenspiel_spielstand_p_",    // + Profil-ID = eigener Spielstand je Spieler
    MAX_PROFILE: 20,                                            // ANNAHME

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

    // ---------- Kapitel 2: Anlagen ----------
    // Formeln OGame-angelehnt (siehe docs/SPEZIFIKATION.md, Abschnitt C). Einzelwerte je Gebäude in js/data/gebaeude.js.
    GEBAEUDE_MAX_STUFE: 30,          // FEST: mind. 30 – zentral konfigurierbar
    WACHSTUM_BASIS: 1.1,             // OGame: Produktion/Verbrauch = basis · Stufe · 1,1^Stufe
    BAUZEIT: {
      TEILER: 2500,                  // OGame: Stunden = (Metall + Kristall) / 2500 → hier (Metall + Silizium) / 2500 (ANNAHME)
      FAKTOR: 1,                     // Hook: später Roboter-Forschung (verkürzt Bauzeit) – jetzt 1
      MIN_SEKUNDEN: 5                // ANNAHME: Mindestbauzeit
    },
    SIM_SCHRITT_MS: 60000,           // Abschnittslänge der Produktionsrechnung (offline/online), ANNAHME

    // ANNAHME: kleine Grundproduktion am Hauptplaneten (OGame: Metall 30, Kristall 15 pro Std.), unabhängig von Strom
    GRUNDPRODUKTION_HAUPTPLANET: { metall: 30, silizium: 15 },

    // ANNAHME: Startbestand – reicht für die ersten Minen und eine Solarfarm
    STARTBESTAND: {
      metall: 500,
      silizium: 300,
      rohoel: 100,
      strom: 0,                      // Strom ist Bilanz (Erzeugung − Bedarf), kein Lager (ANNAHME)
      kunststoff_t1: 0,
      kunststoff_t2: 0,
      kunststoff_t3: 0,
      antimaterie: 0
    },
    // Lagergrenzen: KEINE Speichergebäude (FEST) → Lager unbegrenzt (ANNAHME)

    // ANNAHME: 1 Punkt je 1000 verbaute Rohstoffe (OGame), gewichtet; Strom zählt nicht (ist keine Baukosten-Ressource)
    PUNKTE: {
      JE_ROHSTOFFE: 1000,
      GEWICHT: { metall: 1, silizium: 1, rohoel: 1, kunststoff_t1: 2, kunststoff_t2: 4, kunststoff_t3: 8, antimaterie: 10 }
    },

    // Solarsatelliten (Bau später in der Werft) – hier nur Energie je Satellit (ANNAHME, OGame ≈ 20–50 je nach Temperatur)
    SOLARSATELLIT_ENERGIE: 30,

    // Startplätze = Start-/Abschussplattformen für Flotten, gebaut über den Raumflughafen.
    // FEST: bis zu 10 Startplätze, je Stufe 1–15, deutlich teurer je Stufe, Freischaltung nach Spielerpunkten,
    //       Kapazität zählt nur Schiffsanzahl, Summe = max. gleichzeitig startende Schiffe, keine Zuordnung Schiff → Startplatz.
    // ANNAHME: Beschriftung A–J (Sandro: „bis zu 10, A–Z“ – offen), alle Werte unten.
    STARTPLAETZE: {
      MAX_ANZAHL: 10,
      BUCHSTABEN: "ABCDEFGHIJ",
      STUFE_MIN: 1,
      STUFE_MAX: 15,
      KAPAZITAET_PRO_STUFE: 5,                                   // ANNAHME: 5 Schiffe je Stufe
      KOSTEN: { metall: 2000, silizium: 1000, rohoel: 500 },    // ANNAHME: Stufe 1 von Startplatz A
      KOSTEN_FAKTOR: 2.0,                                        // ANNAHME: „deutlich teurer“ je Stufe
      KOSTEN_AUFSCHLAG_JE_PLATZ: 0.25,                           // ANNAHME: B = ×1,25, C = ×1,5 … J = ×3,25
      FREISCHALT_PUNKTE: [0, 50, 150, 400, 1000, 2500, 5000, 10000, 20000, 40000] // ANNAHME: Punkteschwelle je Platz A–J
    }
  });
})(typeof globalThis !== "undefined" ? globalThis : this);
