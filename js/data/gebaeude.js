/*
 * Sternenspiel – Gebäude (Kapitel 2 „Anlagen“). ALLE Gebäudewerte zentral hier.
 *
 * FEST (Sandro): Gebäudeliste und Rollen (Metallmine, Siliziummine, Bohrstation, Solarfarm, Ölverbrennungsstation,
 *   Solarsatelliten, Kunststoffwerk T1–T3, Geologiestation, Raumflughafen, Werft, Verteidigungswerft, Forschungseinrichtung),
 *   KEINE Stufenobergrenze (0.8.0, außer Raumflughafen 1), Kostenfaktor 1,5–2,0,
 *   Rezepte (0.7.0): T2 = 40 Rohöl + 20 Metall je Einheit, T3 = 1000 Rohöl + 500 Silizium + 500 Metall je Einheit,
 *   Kunststoffwerk T2/T3 werden über Spielerpunkte freigeschaltet (0.8.0; Schwellen ANNAHME, BALANCE.KUNSTSTOFFWERK_FREISCHALT_PUNKTE), Bohrstation fördert aus dem Rohölvorkommen,
 *   Geologiestation findet alle 24 h ein Feld,
 *   keine Speicher, kein Allianzdepot, keine Roboter-/Nanitenfabrik.
 * OGame-angelehnt (Formeln): Kosten(n) = Basis · Faktor^(n−1); Produktion/Verbrauch(n) = basis · n · 1,1^n.
 * ANNAHME: alle konkreten Zahlen (Basiskosten, Faktoren außer Rahmen, Produktions-/Verbrauchsbasen, T1-Input, Ausstoßmengen).
 *
 * Felder:
 *  kosten        Kosten Stufe 1 (Rohstoff → Menge), faktor = Kostenfaktor je Stufe
 *  erzeugt       { rohstoff, basis }          → Ertrag/h = basis · n · 1,1^n (× Strom-Produktionsfaktor)
 *  stromErzeugt  basis                        → Strom = basis · n · 1,1^n
 *  stromBedarf   basis                        → Strombedarf = basis · n · 1,1^n
 *  verbrauch     { rohstoff: basis }          → laufender Verbrauch/h = basis · n · 1,1^n (Ölverbrennung)
 *  werk          { ausgabe, basis, input }    → Einheiten/h = basis · n · 1,1^n; input = Rohstoffe JE EINHEIT
 *  fund          true                         → Geologiestation: alle 24 h ein Rohölfeld (Größe siehe BALANCE.GEOLOGIE)
 *  sperre        { flag }                     → nur baubar ab BALANCE.KUNSTSTOFFWERK_FREISCHALT_PUNKTE[flag] Punkten bzw. wenn
 *                                               zustand.freigeschaltet[flag] === true (wird beim Erreichen gesetzt); Master ignoriert
 *  info          ausführliche Beschreibung für das Info-Fenster (ⓘ)
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
      info: "Metall ist der wichtigste Baustoff. Jede Stufe steigert die Förderung um gut 10 % mehr als linear, braucht aber auch mehr Strom. Ohne genug Strom sinkt der Ertrag anteilig (Produktionsfaktor).",
      kosten: { metall: 60, silizium: 15 }, faktor: 1.5,
      erzeugt: { rohstoff: "metall", basis: 30 }, stromBedarf: 10, regler: true },
    { id: "siliziummine", name: "Siliziummine", gruppe: "abbau", bild: "assets/gebaeude/siliziummine.svg",
      beschreibung: "Baut Silizium ab – gleiche Mechanik wie die Metallmine.",
      info: "Silizium wird für Elektronik, Solartechnik und höhere Kunststoffe gebraucht. Gleiche Mechanik wie die Metallmine, aber geringerer Grundertrag.",
      kosten: { metall: 48, silizium: 24 }, faktor: 1.5,
      erzeugt: { rohstoff: "silizium", basis: 20 }, stromBedarf: 10, regler: true },
    { id: "bohrstation", name: "Bohrstation", gruppe: "abbau", bild: "assets/gebaeude/bohrstation.svg",
      beschreibung: "Fördert Rohöl aus dem bekannten Rohölvorkommen des Planeten. Ist das Vorkommen leer, steht sie still.",
      info: "Die Bohrstation fördert aus dem entdeckten Rohölvorkommen; das Vorkommen sinkt um jede geförderte Einheit. Ist es leer, fördert sie nichts mehr – neue Felder findet die Geologiestation. Der Hauptplanet startet mit 1.000.000 entdecktem Rohöl.",
      kosten: { metall: 225, silizium: 75 }, faktor: 1.5,
      erzeugt: { rohstoff: "rohoel", basis: 15 }, stromBedarf: 20, regler: true },
    // ---- Energie ----
    { id: "solarfarm", name: "Solarfarm", gruppe: "energie", bild: "assets/gebaeude/solarfarm.svg",
      beschreibung: "Erzeugt Strom aus Sonnenlicht – ohne Betriebskosten.",
      info: "Strom ist eine Bilanz: Erzeugung minus Bedarf. Reicht die Erzeugung nicht, drosseln alle Verbraucher anteilig. Die Solarfarm liefert Strom ohne laufende Kosten.",
      kosten: { metall: 75, silizium: 30 }, faktor: 1.5,
      stromErzeugt: 20, regler: true },
    { id: "oelverbrennung", name: "Ölverbrennungsstation", gruppe: "energie", bild: "assets/gebaeude/oelverbrennung.svg",
      beschreibung: "Erzeugt mehr Strom als die Solarfarm, verbrennt dafür laufend Rohöl. Ohne Rohöl steht sie still.",
      info: "Liefert je Stufe etwa doppelt so viel Strom wie die Solarfarm, verbraucht dafür dauerhaft Rohöl aus dem Lager. Mit dem Regler (Seite Ressourcen) lässt sich der Verbrauch drosseln.",
      kosten: { metall: 900, silizium: 360, rohoel: 180 }, faktor: 1.8,
      stromErzeugt: 40, verbrauch: { rohoel: 10 }, regler: true },
    // ---- Kunststoffproduktion ----
    { id: "kunststoffwerk_t1", name: "Kunststoffwerk T1", gruppe: "kunststoff", bild: "assets/gebaeude/kunststoffwerk_t1.svg",
      beschreibung: "Verarbeitet Rohöl zu Kunststoff T1.",
      info: "Je Einheit Kunststoff T1 werden 10 Rohöl verbraucht. Fehlt Rohöl, drosselt das Werk – Bestände werden nie negativ.",
      kosten: { metall: 300, silizium: 200, rohoel: 100 }, faktor: 2.0,
      werk: { ausgabe: "kunststoff_t1", basis: 2, input: { rohoel: 10 } }, stromBedarf: 10, regler: true },
    { id: "kunststoffwerk_t2", name: "Kunststoffwerk T2", gruppe: "kunststoff", bild: "assets/gebaeude/kunststoffwerk_t2.svg",
      beschreibung: "Verarbeitet Rohöl und Metall zu Kunststoff T2.",
      info: "Je Einheit Kunststoff T2: 40 Rohöl + 20 Metall. Wird mit Spielerpunkten freigeschaltet (ab 500 Punkten).",
      sperre: { flag: "kunststoffwerk_t2" },
      kosten: { metall: 1200, silizium: 800, rohoel: 400, kunststoff_t1: 50 }, faktor: 2.0,
      werk: { ausgabe: "kunststoff_t2", basis: 0.5, input: { rohoel: 40, metall: 20 } }, stromBedarf: 15, regler: true },
    { id: "kunststoffwerk_t3", name: "Kunststoffwerk T3", gruppe: "kunststoff", bild: "assets/gebaeude/kunststoffwerk_t3.svg",
      beschreibung: "Verarbeitet Rohöl, Silizium und Metall zu hochwertigem Kunststoff T3.",
      info: "Je Einheit Kunststoff T3: 1000 Rohöl + 500 Silizium + 500 Metall. Wird mit Spielerpunkten freigeschaltet (ab 5.000 Punkten).",
      sperre: { flag: "kunststoffwerk_t3" },
      kosten: { metall: 5000, silizium: 4000, rohoel: 2000, kunststoff_t2: 25 }, faktor: 2.0,
      werk: { ausgabe: "kunststoff_t3", basis: 0.02, input: { rohoel: 1000, silizium: 500, metall: 500 } }, stromBedarf: 20, regler: true },
    // ---- Weitere Anlagen ----
    { id: "geologiestation", name: "Geologiestation", gruppe: "weitere", bild: "assets/gebaeude/geologiestation.svg",
      beschreibung: "Entdeckt alle 24 Stunden ein neues Rohölfeld; je höher die Stufe, desto größer die Funde.",
      info: "Ab dem Bau läuft alle 24 Stunden (Echtzeit, auch offline) eine Suche, die ein neues Rohölfeld findet. Die Größe ist zufällig im Bereich der aktuellen Stufe und wird zum Rohölvorkommen addiert. Ohne Geologiestation gibt es keine neuen Funde. Auf anderen Planeten (später) ist sie Voraussetzung für jede Förderung.",
      kosten: { metall: 400, silizium: 300, rohoel: 100 }, faktor: 1.75,
      fund: true, stromBedarf: 10 },
    { id: "raumflughafen", name: "Raumflughafen", gruppe: "weitere", bild: "assets/gebaeude/raumflughafen.svg",
      beschreibung: "Verwaltet die Startplätze A–Z für Flotten. Einmal errichtet; danach werden die Startplätze einzeln ausgebaut.",
      info: "Der Raumflughafen ist der Rahmen für 26 Startplätze (A–Z) mit je 10 Stufen. Ihre Summe bestimmt, wie viele Schiffe gleichzeitig vom Planeten starten können. Ein Buchstabe wird baubar, wenn der vorige Stufe 10 hat und die Punkteschwelle erreicht ist.",
      kosten: { metall: 1000, silizium: 600, rohoel: 300 }, faktor: 2.0, maxStufe: 1 },
    { id: "werft", name: "Werft", gruppe: "weitere", bild: "assets/gebaeude/werft.svg",
      beschreibung: "Baut später Schiffe und Solarsatelliten. Jetzt nur als Gebäude ausbaubar.",
      info: "Höhere Stufen werden später den Schiffbau beschleunigen. Die Funktion folgt im Werft-Kapitel.",
      kosten: { metall: 400, silizium: 200, rohoel: 100 }, faktor: 2.0 },
    { id: "verteidigungswerft", name: "Verteidigungswerft", gruppe: "weitere", bild: "assets/gebaeude/verteidigungswerft.svg",
      beschreibung: "Baut später Verteidigungsanlagen. Jetzt nur als Gebäude ausbaubar.",
      info: "Höhere Stufen werden später den Bau von Verteidigungsanlagen beschleunigen. Die Funktion folgt im Verteidigungs-Kapitel.",
      kosten: { metall: 300, silizium: 300, rohoel: 100 }, faktor: 2.0 },
    { id: "forschungseinrichtung", name: "Forschungseinrichtung", gruppe: "weitere", bild: "assets/gebaeude/forschungseinrichtung.svg",
      beschreibung: "Ort aller Forschungen (Menü „Forschung“). Höhere Stufen verkürzen die Forschungszeit.",
      info: "Ohne Forschungseinrichtung keine Forschung. Die Forschungszeit wird durch (1 + Stufe) geteilt (OGame-Labor). Während einer laufenden Forschung kann sie nicht ausgebaut werden – und während des Ausbaus kann nicht geforscht werden.",
      kosten: { metall: 200, silizium: 400, rohoel: 200 }, faktor: 2.0, forschungszeit: true }
  ];
  L.forEach(function (d) { if (d.kosten) Object.freeze(d.kosten); if (d.sperre) Object.freeze(d.sperre); Object.freeze(d); });
  SS.DATEN.gebaeude = Object.freeze(L);

  // Solarsatelliten: KEIN Gebäude – Bau später in der Werft; hier nur Anzeige/Regler.
  SS.DATEN.solarsatellit = Object.freeze({ id: "solarsatellit", name: "Solarsatelliten", gruppe: "energie", bild: "assets/gebaeude/solarsatellit.svg",
    beschreibung: "Umkreisen den Planeten und liefern Strom. Gebaut werden sie später in der Werft." });

  SS.DATEN.gebaeudeNachId = function (id) {
    for (var i = 0; i < L.length; i++) if (L[i].id === id) return L[i];
    return null;
  };
  /** Höchststufe eines Gebäudes – Infinity, wenn keine Obergrenze gilt (FEST 0.8.0). */
  SS.DATEN.maxStufe = function (d) { return d.maxStufe || SS.BALANCE.GEBAEUDE_MAX_STUFE || Infinity; };
})(typeof globalThis !== "undefined" ? globalThis : this);
