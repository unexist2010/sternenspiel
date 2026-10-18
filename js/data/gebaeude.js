/*
 * Sternenspiel – Gebäude (Kapitel 2 „Anlagen“). ALLE Gebäudewerte zentral hier.
 *
 * FEST (Sandro): Gebäudeliste und Rollen (Metallmine, Siliziummine, Bohrstation, Solarfarm, Ölverbrennungsstation,
 *   Solarsatelliten, Kunststoffwerk T1–T3, Geologiestation, Raumflughafen, Werft, Verteidigungswerft, Forschungseinrichtung),
 *   Stufen bis mind. 30, Kostenfaktor 1,5–2,0, T3-Beispiel 2000 Rohöl + 2000 Silizium + 750 Metall je Einheit,
 *   keine Speicher, kein Allianzdepot, keine Roboter-/Nanitenfabrik.
 * OGame-angelehnt (Formeln): Kosten(n) = Basis · Faktor^(n−1); Produktion/Verbrauch(n) = basis · n · 1,1^n.
 * ANNAHME: alle konkreten Zahlen (Basiskosten, Faktoren außer Rahmen, Produktions-/Verbrauchsbasen, Werk-Inputs außer T3).
 *
 * Felder:
 *  kosten        Kosten Stufe 1 (Rohstoff → Menge), faktor = Kostenfaktor je Stufe
 *  erzeugt       { rohstoff, basis }          → Ertrag/h = basis · n · 1,1^n (× Strom-Produktionsfaktor)
 *  stromErzeugt  basis                        → Strom = basis · n · 1,1^n
 *  stromBedarf   basis                        → Strombedarf = basis · n · 1,1^n
 *  verbrauch     { rohstoff: basis }          → laufender Verbrauch/h = basis · n · 1,1^n (Ölverbrennung)
 *  werk          { ausgabe, basis, input }    → Einheiten/h = basis · n · 1,1^n; input = Rohstoffe JE EINHEIT
 *  geologie      basis                        → gefundene Rohölfelder/h = basis · n · 1,1^n
 *  regler        true = Produktionsregler 0–100 % (Seite Ressourcen)
 */
(function (g) {
  "use strict";
  var SS = (g.SS = g.SS || {});
  SS.DATEN = SS.DATEN || {};

  SS.DATEN.gebaeudeGruppen = Object.freeze([
    { id: "abbau", name: "Ressourcenabbau" },
    { id: "energie", name: "Energie" },
    { id: "kunststoff", name: "Kunststoffproduktion" },
    { id: "weitere", name: "Weitere Anlagen" }
  ]);

  var L = [
    // ---- Ressourcenabbau ----
    { id: "metallmine", name: "Metallmine", gruppe: "abbau", bild: "assets/gebaeude/metallmine.svg",
      beschreibung: "Fördert Metall aus der Planetenkruste – Grundstoff für fast alles.",
      kosten: { metall: 60, silizium: 15 }, faktor: 1.5,
      erzeugt: { rohstoff: "metall", basis: 30 }, stromBedarf: 10, regler: true },
    { id: "siliziummine", name: "Siliziummine", gruppe: "abbau", bild: "assets/gebaeude/siliziummine.svg",
      beschreibung: "Baut Silizium ab – gleiche Mechanik wie die Metallmine.",
      kosten: { metall: 48, silizium: 24 }, faktor: 1.5,
      erzeugt: { rohstoff: "silizium", basis: 20 }, stromBedarf: 10, regler: true },
    { id: "bohrstation", name: "Bohrstation", gruppe: "abbau", bild: "assets/gebaeude/bohrstation.svg",
      beschreibung: "Fördert Rohöl. Am Hauptplaneten unbegrenzt; auf anderen Planeten nur so viele Stufen, wie die Geologiestation Rohölfelder gefunden hat.",
      kosten: { metall: 225, silizium: 75 }, faktor: 1.5,
      erzeugt: { rohstoff: "rohoel", basis: 15 }, stromBedarf: 20, regler: true },
    // ---- Energie ----
    { id: "solarfarm", name: "Solarfarm", gruppe: "energie", bild: "assets/gebaeude/solarfarm.svg",
      beschreibung: "Erzeugt Strom aus Sonnenlicht – ohne Betriebskosten.",
      kosten: { metall: 75, silizium: 30 }, faktor: 1.5,
      stromErzeugt: 20, regler: true },
    { id: "oelverbrennung", name: "Ölverbrennungsstation", gruppe: "energie", bild: "assets/gebaeude/oelverbrennung.svg",
      beschreibung: "Erzeugt mehr Strom als die Solarfarm, verbrennt dafür laufend Rohöl. Ohne Rohöl steht sie still.",
      kosten: { metall: 900, silizium: 360, rohoel: 180 }, faktor: 1.8,
      stromErzeugt: 40, verbrauch: { rohoel: 10 }, regler: true },
    // ---- Kunststoffproduktion ----
    { id: "kunststoffwerk_t1", name: "Kunststoffwerk T1", gruppe: "kunststoff", bild: "assets/gebaeude/kunststoffwerk_t1.svg",
      beschreibung: "Verarbeitet Rohöl zu Kunststoff T1.",
      kosten: { metall: 300, silizium: 200, rohoel: 100 }, faktor: 2.0,
      werk: { ausgabe: "kunststoff_t1", basis: 2, input: { rohoel: 10 } }, stromBedarf: 10, regler: true },
    { id: "kunststoffwerk_t2", name: "Kunststoffwerk T2", gruppe: "kunststoff", bild: "assets/gebaeude/kunststoffwerk_t2.svg",
      beschreibung: "Verarbeitet Rohöl und Metall zu Kunststoff T2.",
      kosten: { metall: 1200, silizium: 800, rohoel: 400, kunststoff_t1: 50 }, faktor: 2.0,
      werk: { ausgabe: "kunststoff_t2", basis: 0.5, input: { rohoel: 40, metall: 20 } }, stromBedarf: 15, regler: true },
    { id: "kunststoffwerk_t3", name: "Kunststoffwerk T3", gruppe: "kunststoff", bild: "assets/gebaeude/kunststoffwerk_t3.svg",
      beschreibung: "Verarbeitet Rohöl, Silizium und Metall zu hochwertigem Kunststoff T3.",
      kosten: { metall: 5000, silizium: 4000, rohoel: 2000, kunststoff_t2: 25 }, faktor: 2.0,
      werk: { ausgabe: "kunststoff_t3", basis: 0.02, input: { rohoel: 2000, silizium: 2000, metall: 750 } }, stromBedarf: 20, regler: true },
    // ---- Weitere Anlagen ----
    { id: "geologiestation", name: "Geologiestation", gruppe: "weitere", bild: "assets/gebaeude/geologiestation.svg",
      beschreibung: "Sucht Rohölfelder – je Stufe mehr pro Stunde. Am Hauptplaneten optional, auf anderen Planeten Voraussetzung für die Bohrstation.",
      kosten: { metall: 400, silizium: 300, rohoel: 100 }, faktor: 1.75,
      geologie: 0.1, stromBedarf: 10, regler: true },
    { id: "raumflughafen", name: "Raumflughafen", gruppe: "weitere", bild: "assets/gebaeude/raumflughafen.svg",
      beschreibung: "Verwaltet die Startplätze für Flotten (A–J). Einmal errichtet; danach werden die Startplätze einzeln ausgebaut.",
      kosten: { metall: 1000, silizium: 600, rohoel: 300 }, faktor: 2.0, maxStufe: 1 },
    { id: "werft", name: "Werft", gruppe: "weitere", bild: "assets/gebaeude/werft.svg",
      beschreibung: "Baut später Schiffe und Solarsatelliten. Jetzt nur als Gebäude ausbaubar.",
      kosten: { metall: 400, silizium: 200, rohoel: 100 }, faktor: 2.0 },
    { id: "verteidigungswerft", name: "Verteidigungswerft", gruppe: "weitere", bild: "assets/gebaeude/verteidigungswerft.svg",
      beschreibung: "Baut später Verteidigungsanlagen. Jetzt nur als Gebäude ausbaubar.",
      kosten: { metall: 300, silizium: 300, rohoel: 100 }, faktor: 2.0 },
    { id: "forschungseinrichtung", name: "Forschungseinrichtung", gruppe: "weitere", bild: "assets/gebaeude/forschungseinrichtung.svg",
      beschreibung: "Höhere Stufen verkürzen später die Forschungszeit (Forschung folgt in einem eigenen Kapitel).",
      kosten: { metall: 200, silizium: 400, rohoel: 200 }, faktor: 2.0, forschungszeit: true }
  ];
  L.forEach(function (d) { if (d.kosten) Object.freeze(d.kosten); Object.freeze(d); });
  SS.DATEN.gebaeude = Object.freeze(L);

  // Solarsatelliten: KEIN Gebäude – Bau später in der Werft; hier nur Anzeige/Regler.
  SS.DATEN.solarsatellit = Object.freeze({ id: "solarsatellit", name: "Solarsatelliten", gruppe: "energie", bild: "assets/gebaeude/solarsatellit.svg",
    beschreibung: "Umkreisen den Planeten und liefern Strom. Gebaut werden sie später in der Werft." });

  SS.DATEN.gebaeudeNachId = function (id) {
    for (var i = 0; i < L.length; i++) if (L[i].id === id) return L[i];
    return null;
  };
  SS.DATEN.maxStufe = function (d) { return d.maxStufe || SS.BALANCE.GEBAEUDE_MAX_STUFE; };
})(typeof globalThis !== "undefined" ? globalThis : this);
