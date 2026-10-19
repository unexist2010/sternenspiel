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
  SS.VERSION = "0.8.0";

  SS.BALANCE = tiefFrieren({
    // Version des Spielstand-Formats (für Migrationen in späteren Kapiteln)
    SPIELSTAND_VERSION: 6,   // v2: Heimatplanet · v3: automatischer Start · v4: Kapitel 2 – Planeten mit Gebäuden, Bauauftrag, Startplätzen · v5: Rohölvorkommen/Geologie, Startplätze A–Z, Master-Modus · v6: Forschung (Stufen + Forschungsauftrag), T2/T3-Freischaltung über Punkte
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
    GEBAEUDE_MAX_STUFE: null,        // FEST (0.8.0): KEINE Obergrenze nach oben (außer Gebäude mit eigener maxStufe, z. B. Raumflughafen 1)
    // ANNAHME (0.8.0): Kunststoffwerk T2/T3 werden durch Spielerpunkte freigeschaltet (FEST: über Punkte; Schwellen ANNAHME).
    // T2 ab 500 Punkten ≈ 500.000 verbaute Rohstoffe (Minen um Stufe 12–14, liegt zwischen Startplatz D 400 und E 600);
    // T3 ab 5.000 Punkten ≈ 5 Mio. verbaute Rohstoffe (zwischen Startplatz I 4.000 und J 6.000) – T3 braucht 1.000 Rohöl je Einheit.
    KUNSTSTOFFWERK_FREISCHALT_PUNKTE: { kunststoffwerk_t2: 500, kunststoffwerk_t3: 5000 },
    WACHSTUM_BASIS: 1.1,             // OGame: Produktion/Verbrauch = basis · Stufe · 1,1^Stufe
    BAUZEIT: {
      TEILER: 2500,                  // OGame: Stunden = (Metall + Kristall) / 2500 → hier (Metall + Silizium) / 2500 (ANNAHME)
      FAKTOR: 1,                     // allgemeiner Faktor; Roboterforschung (Kapitel 3) wirkt zusätzlich über bau.bauzeitFaktorForschung
      MIN_SEKUNDEN: 5                // ANNAHME: Mindestbauzeit
    },
    // ---------- Kapitel 3: Forschung (Werte je Forschung in js/data/forschung.js) ----------
    // OGame-artig: Forschungszeit = (Metall + Silizium) / (1000 · (1 + Stufe Forschungseinrichtung)) Std. · FAKTOR (ANNAHME)
    FORSCHUNG: {
      ZEIT_TEILER: 1000,
      FAKTOR: 1,
      MIN_SEKUNDEN: 5,
      EINRICHTUNG_MIN_STUFE: 1         // FEST: Forschungseinrichtung Stufe ≥ 1 nötig
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

    // ---------- Geologie & Rohölvorkommen (FEST, Nachbesserung 0.7.0) ----------
    // Jeder Planet hat ein bekanntes Rohölvorkommen; die Bohrstation fördert daraus (Förderung = min(Rate, Vorkommen)).
    // Die Geologiestation entdeckt alle 24 h (Echtzeit, offline nachgeholt) ein neues Feld, Größe zufällig im Bereich der Stufe.
    GEOLOGIE: {
      START_VORKOMMEN_HAUPTPLANET: 1000000,   // FEST
      START_VORKOMMEN_ANDERE: 0,              // FEST (andere Planeten später: Geologiestation notwendig)
      FUND_INTERVALL_STUNDEN: 24,             // FEST
      FUND_BEREICH_FEST: [[50000, 100000], [80000, 125000]], // FEST: Stufe 1 und 2 (Minimum, Maximum)
      FUND_WACHSTUM_AB_STUFE_3: 1.25,         // ANNAHME: ab Stufe 3 Minimum und Maximum je Stufe ×1,25
      FUND_RUNDUNG: 1000,                     // ANNAHME: Bereichsgrenzen auf volle 1.000 gerundet
      LOG_MAX: 100                            // ANNAHME: höchstens 100 Einträge im Fund-Log je Planet
    },

    // ---------- Startplätze (FEST, Nachbesserung 0.7.0 – ersetzt A–J / Stufe 1–15) ----------
    // FEST: Startplätze A–Z (26), je 10 Ausbaustufen; Buchstabe X erst baubar, wenn der vorige Buchstabe Stufe 10 hat
    //       UND der Spieler die Mindest-Punktzahl des Buchstabens erreicht; Kapazität = Anzahl gleichzeitig startender Schiffe
    //       (Größe egal); Ziel A10 ≈ 100 Schiffe, alles bis Z10 ≈ 10 Milliarden.
    // ANNAHME: Kapazität je Stufe geometrisch (×≈2,03 je Buchstabe, auf 2 Stellen gerundet), Kosten, Punkteschwellen.
    STARTPLAETZE: {
      BUCHSTABEN: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
      MAX_ANZAHL: 26,
      STUFE_MAX: 10,
      VORGAENGER_STUFE: 10,                   // FEST: vorheriger Buchstabe muss Stufe 10 haben
      // Schiffe je Ausbaustufe (je Buchstabe gleich für alle 10 Stufen) → Kapazität Buchstabe = Stufe · Wert
      KAPAZITAET_JE_STUFE: [10, 20, 41, 84, 170, 350, 710, 1400, 2900, 5900, 12000, 25000, 50000, 100000, 210000, 420000,
        850000, 1700000, 3500000, 7200000, 15000000, 30000000, 60000000, 120000000, 250000000, 510000000],
      KOSTEN: { metall: 400, silizium: 200, rohoel: 100 }, // Stufe 1 von Startplatz A
      KOSTEN_FAKTOR_STUFE: 1.35,              // je Stufe innerhalb eines Buchstabens
      KOSTEN_FAKTOR_BUCHSTABE: 1.5,           // je weiterem Buchstaben
      // FEST (0.8.0): Startplatz-Bauzeiten deutlich verkürzt, Z Stufe 10 höchstens ~1 Jahr. Faktor 10 ergäbe 376 Tage → 11 gewählt
      // (Z10 ≈ 342 Tage ohne Roboterforschung). Bauzeit = OGame-Bauzeit / 11 (× Roboter-Faktor).
      BAUZEIT_TEILER: 11,
      FREISCHALT_PUNKTE: [0, 75, 200, 400, 600, 1000, 1500, 2500, 4000, 6000, 10000, 15000, 20000, 30000, 40000, 60000,
        100000, 150000, 250000, 300000, 500000, 750000, 1000000, 1500000, 2500000, 4000000],
      // Regel für das Flotten-Kapitel (FEST, noch NICHT umgesetzt): Schiffe, die nicht auf die Startplätze passen, stehen
      // automatisch im Hangar (Lager) – dort bei Angriffen sicher, keine Wahl. Beim Versand sind alle Schiffe sichtbar;
      // gleichzeitig unterwegs dürfen höchstens „Kapazität“ Schiffe sein; Kapazität wird erst nach Landung/Zerstörung frei.
      HANGAR_AKTIV: false
    }
  });
})(typeof globalThis !== "undefined" ? globalThis : this);
