/*
 * Sternenspiel – Verteidigungsanlagen (Kapitel 5 „Verteidigung“, 0.12.0). ALLE Verteidigungswerte zentral hier.
 *
 * FEST (Sandro 2026-10-31): Rollen/Namen nach OGame – Raketenbatterie, Laser-Turm, Puls-Laser, Magnetkanone, Ionen-Geschütz,
 *   Plasma-Turm, Schildkuppel, Festungsschild, Maschinen-Nest (früh); Bau über die Verteidigungswerft;
 *   Orbitalverteidigungsplattform ist KEIN Schiff mehr, sondern Verteidigung (Phase Orbit), 6 Stufenbilder bleiben.
 *   Zwei Hüllen je Anlage: Metallhülle + Energiehülle.
 * ANNAHME (Sandro prüft – OFFENE-PUNKTE Frage 21): alle Kosten, Angriffswerte, Energiehüllen, Waffenanteile, Voraussetzungen,
 *   Höchstanzahl der Schilde (je 1) und die Wirkung der Schilde als gemeinsamer Planetenschild.
 *
 * Felder:
 *  phase        boden | orbit   – in welcher Kampfphase die Anlage kämpft
 *  kosten       je Einheit
 *  waffen       { waffentyp: Anteil } (Summe 1, leer = unbewaffnet)
 *  angriff      Grundangriff je Einheit
 *  energie      Energiehülle je Einheit (Grund, + Schildtechnik)
 *  Metallhülle  = (Metall + Silizium) / 10 × Hüllenfaktor (berechnet, + Panzerung)
 *  huelle       leichtmetall | verbund (Faktor wie bei Schiffen)
 *  schutzschild true → kein Ziel, sondern gemeinsamer Planetenschild: fängt Boden-Schaden ab, bis er zusammenbricht
 *  max          Höchstanzahl je Planet (Schilde: 1)
 *  vor          { verteidigungswerft: Stufe, forschung: [{ id, stufe }] }
 */
(function (g) {
  "use strict";
  var SS = (g.SS = g.SS || {});
  SS.DATEN = SS.DATEN || {};
  SS.DATEN.VERTEIDIGUNG_ANZAHL_SOLL = 10; // 9 Boden (Sandro) + Orbitalverteidigungsplattform

  SS.DATEN.verteidigungGruppen = Object.freeze([
    { id: "geschuetz", name: "Bodengeschütze" },
    { id: "schild", name: "Schutzschilde" },
    { id: "orbit", name: "Orbitalverteidigung" }
  ].map(Object.freeze));

  var V = function (id, st) { return { id: id, stufe: st }; };
  var L = [
    { id: "maschinennest", name: "Maschinen-Nest", gruppe: "geschuetz", phase: "boden", kosten: { metall: 1500, silizium: 500 },
      huelle: "leichtmetall", waffen: { gatling: 1 }, angriff: 60, energie: 0,
      vor: { verteidigungswerft: 1, forschung: [] },
      beschreibung: "Billige Frühverteidigung – Maschinenkanone gegen Metallhüllen.",
      info: "Reine Metallhülle. Gut gegen frühe Drohnen, schwach gegen Energiehüllen." },
    { id: "raketenbatterie", name: "Raketenbatterie", gruppe: "geschuetz", phase: "boden", kosten: { metall: 2000 },
      huelle: "leichtmetall", waffen: { raketen: 1 }, angriff: 80, energie: 0,
      vor: { verteidigungswerft: 1, forschung: [] },
      beschreibung: "Günstigste Anlage – Raketen zerlegen Metallhüllen.",
      info: "OGame-Raketenwerfer. Gegen Energiehüllen fast wirkungslos, nach deren Zusammenbruch sehr stark." },
    { id: "laserturm", name: "Laser-Turm", gruppe: "geschuetz", phase: "boden", kosten: { metall: 1500, silizium: 500 },
      huelle: "leichtmetall", waffen: { laser: 1 }, angriff: 100, energie: 25,
      vor: { verteidigungswerft: 2, forschung: [V("energie", 1), V("laser", 3)] },
      beschreibung: "Leichter Laser – knackt Energiehüllen.",
      info: "OGame-Leichter Laser. Gegen reine Metallschiffe (Aufklärer, Drohnen) nahezu wirkungslos." },
    { id: "pulslaser", name: "Puls-Laser", gruppe: "geschuetz", phase: "boden", kosten: { metall: 6000, silizium: 2000 },
      huelle: "leichtmetall", waffen: { laser: 0.7, ionen: 0.3 }, angriff: 250, energie: 100,
      vor: { verteidigungswerft: 4, forschung: [V("energie", 3), V("laser", 6)] },
      beschreibung: "Schwerer Laser mit Impulsanteil.",
      info: "OGame-Schwerer Laser. Stark gegen Energiehüllen mittlerer Schiffe." },
    { id: "magnetkanone", name: "Magnetkanone", gruppe: "geschuetz", phase: "boden", kosten: { metall: 20000, silizium: 15000, rohoel: 2000 },
      huelle: "leichtmetall", waffen: { railgun: 1 }, angriff: 1100, energie: 200,
      vor: { verteidigungswerft: 6, forschung: [V("energie", 6), V("waffen", 3), V("schild", 1)] },
      beschreibung: "Railgun – mittel gegen Energie, stark gegen Metall.",
      info: "OGame-Gaußkanone. Allrounder; besonders stark, sobald die Energiehülle des Ziels gefallen ist." },
    { id: "ionengeschuetz", name: "Ionen-Geschütz", gruppe: "geschuetz", phase: "boden", kosten: { metall: 5000, silizium: 3000 },
      huelle: "leichtmetall", waffen: { ionen: 1 }, angriff: 150, energie: 500,
      vor: { verteidigungswerft: 4, forschung: [V("ionen", 4)] },
      beschreibung: "Zerlegt Energiehüllen, starke eigene Energiehülle.",
      info: "OGame-Ionengeschütz. Konter gegen Schildflotten – gegen reine Metallhüllen schwach." },
    { id: "plasmaturm", name: "Plasma-Turm", gruppe: "geschuetz", phase: "boden", kosten: { metall: 50000, silizium: 50000, rohoel: 30000 },
      huelle: "leichtmetall", waffen: { plasma: 1 }, angriff: 3000, energie: 300,
      vor: { verteidigungswerft: 8, forschung: [V("plasma", 7)] },
      beschreibung: "Stärkste Bodenwaffe – ausgewogen gegen beide Hüllen.",
      info: "OGame-Plasmawerfer." },
    { id: "schildkuppel", name: "Schildkuppel", gruppe: "schild", phase: "boden", kosten: { metall: 10000, silizium: 10000 },
      huelle: "leichtmetall", waffen: {}, angriff: 0, energie: 2000, schutzschild: true, max: 1,
      vor: { verteidigungswerft: 1, forschung: [V("schild", 2)] },
      beschreibung: "Kleiner Planetenschild – höchstens 1.",
      info: "Kein Ziel: fängt als gemeinsamer Planetenschild Schaden an der Bodenverteidigung ab, bis er zusammenbricht. Aktiviert sich bei Angriff automatisch (Solo-Regel, ANNAHME)." },
    { id: "festungsschild", name: "Festungsschild", gruppe: "schild", phase: "boden", kosten: { metall: 50000, silizium: 50000 },
      huelle: "leichtmetall", waffen: {}, angriff: 0, energie: 10000, schutzschild: true, max: 1,
      vor: { verteidigungswerft: 6, forschung: [V("schild", 6)] },
      beschreibung: "Großer Planetenschild – höchstens 1.",
      info: "Wie die Schildkuppel, fünffache Stärke. Beide Schilde addieren sich." },
    { id: "orbitalverteidigungsplattform", name: "Orbitalverteidigungsplattform", gruppe: "orbit", phase: "orbit",
      kosten: { metall: 100000, silizium: 60000, rohoel: 20000, kunststoff_t2: 1000, kunststoff_t3: 500 },
      huelle: "verbund", waffen: { ionen: 0.5, railgun: 0.5 }, angriff: 2000, energie: 2000,
      waffenslots: { anzahl: 2, mehrAb: { forschung: "computer", stufe: 10, anzahl: 3 }, erlaubt: ["ionen", "plasma", "raketen", "laser", "railgun", "gatling"] },
      sondenabwehr: { forschung: [V("spionage", 12), V("computer", 12)], chanceJeStufe: 0.05, max: 0.9 },
      vor: { verteidigungswerft: 8, forschung: [V("schild", 6), V("ionen", 5), V("computer", 6)] },
      beschreibung: "Kämpft in Phase 1 im Orbit zusammen mit der Flotte.",
      info: "Seit 0.12.0 Verteidigung statt Schiff (zählt nicht mehr zu den Schiffen). Begrenzte Waffenslots: 2, ab Computer 10 drei (Graviton nicht). Freie Bestückung folgt später; jetzt fest 50 % Ionen / 50 % Magnetkanone (ANNAHME)." }
  ];
  L.forEach(function (d) {
    d.bild = d.id === "orbitalverteidigungsplattform" ? "assets/schiffe/orbitalverteidigungsplattform.svg" : "assets/verteidigung/" + d.id + ".svg";
    Object.freeze(d.kosten); Object.freeze(d.waffen); Object.freeze(d.vor.forschung); Object.freeze(d.vor); Object.freeze(d);
  });
  SS.DATEN.verteidigung = Object.freeze(L);
  SS.DATEN.verteidigungIds = Object.freeze(L.map(function (d) { return d.id; }));
  SS.DATEN.verteidigungNachId = function (id) { for (var i = 0; i < L.length; i++) if (L[i].id === id) return L[i]; return null; };
  /** Bild je Anzahl (Orbitalplattform: 6 Stufenbilder aus schiffe.js). */
  SS.DATEN.verteidigungBild = function (d, anzahl) { return SS.DATEN.schiffBild ? SS.DATEN.schiffBild(d, anzahl) : d.bild; };
})(typeof globalThis !== "undefined" ? globalThis : this);
