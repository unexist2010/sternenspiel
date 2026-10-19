/*
 * Sternenspiel – Forschungen (Kapitel 3). ALLE Forschungswerte zentral hier.
 *
 * FEST (Sandro, Kapitel 3): genau diese 18 Forschungen (keine Naniten-, Speicher- oder Antimaterie-Forschung),
 *   ihre Voraussetzungen und Rollen; alle Forschungen in der Forschungseinrichtung (Stufe ≥ 1); höhere Stufe der
 *   Einrichtung verkürzt die Forschungsdauer; Energie-Technologie und Roboterforschung wirken JETZT
 *   (Energieausbeute bzw. Gebäude-Bauzeit), alle anderen Wirkungen werden berechnet und angezeigt, aber erst in
 *   späteren Kapiteln angewendet; Komprimierungsforschung +10 % Transporter-Ladekapazität je Stufe.
 * ANNAHME: Grundkosten (OGame-Retro: Metall/Kristall/Deuterium → Metall/Silizium/Rohöl), Faktoren, Kunststoff bei
 *   späten Forschungen, Wirkung je Stufe (außer Komprimierung), Graviton-Voraussetzung (ET 12 + Plasma 8),
 *   keine Stufenobergrenze.
 *
 * Felder:
 *  kosten     Kosten Stufe 1; faktor = Kostenfaktor je Stufe → Kosten(n) = floor(kosten · faktor^(n−1))
 *  vor        Voraussetzungen als Liste von Gruppen: ALLE Gruppen müssen erfüllt sein (UND),
 *             innerhalb einer Gruppe reicht EINE Alternative (ODER). [{ id, stufe }] je Gruppe.
 *  wirkung    { typ, je, basis, ziel, ziel1 (Einzahl, optional), aktiv } – typ: "prozent" (+je % je Stufe), "anzahl" (basis + je · Stufe),
 *             "bauzeit" (Faktor 1 / (1 + je · Stufe)), "kolonien" (aufgerundet Stufe / 2), "freischaltung"
 *             aktiv = true → wirkt bereits jetzt (Kapitel 3), sonst nur Anzeige für spätere Kapitel
 *  info       ausführliche Beschreibung für das Info-Fenster (ⓘ)
 */
(function (g) {
  "use strict";
  var SS = (g.SS = g.SS || {});
  SS.DATEN = SS.DATEN || {};

  SS.DATEN.forschungGruppen = Object.freeze([
    { id: "grundlagen", name: "Grundlagen" },
    { id: "waffen", name: "Waffen & Verteidigung" },
    { id: "antriebe", name: "Antriebe" },
    { id: "flotte", name: "Flotte & Spionage" },
    { id: "fortgeschritten", name: "Fortgeschritten" }
  ]);

  var v = function (id, stufe) { return { id: id, stufe: stufe }; };
  var L = [
    // ---- Grundlagen ----
    { id: "energie", name: "Energie-Technologie", gruppe: "grundlagen",
      beschreibung: "Erhöht die Energieausbeute aller Energiegebäude: Solarfarm, Ölverbrennungsstation und Solarsatelliten.",
      info: "Grundlage fast aller Technologien. Jede Stufe steigert die Stromerzeugung von Solarfarm, Ölverbrennungsstation und Solarsatelliten um 5 % (linear, bezogen auf den Grundwert). Der Rohölverbrauch der Ölverbrennung bleibt gleich – sie wird also effizienter. Wirkt sofort.",
      kosten: { silizium: 800, rohoel: 400 }, faktor: 2, vor: [],
      wirkung: { typ: "prozent", je: 5, ziel: "Energieausbeute", aktiv: true } },
    { id: "roboter", name: "Roboterforschung", gruppe: "grundlagen",
      beschreibung: "Ersetzt die Roboterfabrik: verkürzt die Bauzeit von Gebäuden, Startplätzen, Schiffen und Verteidigung – nicht die Forschung.",
      info: "Automatisierte Baukolonnen arbeiten rund um die Uhr. Bauzeit = Grundbauzeit / (1 + 1,5 · Stufe) – deutlich stärker als die OGame-Roboterfabrik (1 / (1 + Stufe)), dafür steigen die Kosten überproportional (Faktor 2,5). Wirkt sofort auf Gebäude und Startplätze, später auch auf Schiffe und Verteidigung. Die Forschungsdauer wird NICHT verkürzt.",
      kosten: { metall: 400, silizium: 120, rohoel: 200 }, faktor: 2.5, vor: [],
      wirkung: { typ: "bauzeit", je: 1.5, ziel: "Bauzeit (Gebäude, Schiffe, Verteidigung)", aktiv: true } },
    { id: "computer", name: "Computer-Technologie", gruppe: "grundlagen",
      beschreibung: "Mehr Rechenleistung zur Flottensteuerung: +1 Flotten-Slot je Stufe.",
      info: "Jede Stufe erlaubt eine weitere gleichzeitig fliegende Flotte (Grundwert 1 Slot). Wird im Flotten-Kapitel angewendet.",
      kosten: { silizium: 400, rohoel: 600 }, faktor: 2, vor: [],
      wirkung: { typ: "anzahl", basis: 1, je: 1, ziel: "Flotten-Slots", ziel1: "Flotten-Slot", aktiv: false } },
    // ---- Waffen & Verteidigung ----
    { id: "waffen", name: "Waffen-Technologie", gruppe: "waffen",
      beschreibung: "Steigert den Angriff aller Schiffe und Verteidigungsanlagen.",
      info: "+10 % Angriffswert je Stufe für alle Schiffe und Verteidigungsanlagen. Wird im Kampf-Kapitel angewendet.",
      kosten: { metall: 800, silizium: 200 }, faktor: 2, vor: [],
      wirkung: { typ: "prozent", je: 10, ziel: "Angriff aller Schiffe/Verteidigungen", aktiv: false } },
    { id: "schild", name: "Schild-Technologie", gruppe: "waffen", vor: [[v("energie", 3)]],
      beschreibung: "Verstärkt die Schilde (Energiehülle) aller Schiffe und Verteidigungsanlagen.",
      info: "+10 % Schildstärke (Energiehülle) je Stufe. Voraussetzung für die Hyperspace-Technologie. Wird im Kampf-Kapitel angewendet.",
      kosten: { metall: 200, silizium: 600 }, faktor: 2,
      wirkung: { typ: "prozent", je: 10, ziel: "Schildstärke (Energiehülle)", aktiv: false } },
    { id: "panzerung", name: "Panzerung-Technologie", gruppe: "waffen", vor: [],
      beschreibung: "Spezielle Legierungen verstärken die Metallhülle von Schiffen und Verteidigung.",
      info: "+10 % Hüllenpunkte (Metallhülle) je Stufe. Wird im Kampf-Kapitel angewendet.",
      kosten: { metall: 1000 }, faktor: 2,
      wirkung: { typ: "prozent", je: 10, ziel: "Hüllenpunkte (Metallhülle)", aktiv: false } },
    { id: "laser", name: "Laser-Technologie", gruppe: "waffen", vor: [[v("energie", 2)]],
      beschreibung: "Gebündeltes Licht als Waffe – Grundlage der Laserwaffen.",
      info: "+10 % Schaden der Laserwaffen je Stufe. Voraussetzung für die Ionen-Technologie. Wird im Kampf-Kapitel angewendet.",
      kosten: { metall: 200, silizium: 100 }, faktor: 2,
      wirkung: { typ: "prozent", je: 10, ziel: "Laserwaffen-Schaden", aktiv: false } },
    { id: "ionen", name: "Ionen-Technologie", gruppe: "waffen", vor: [[v("laser", 5)], [v("energie", 4)]],
      beschreibung: "Beschleunigte Ionenstrahlen – Grundlage der Ionenwaffen.",
      info: "+10 % Schaden der Ionenwaffen je Stufe. Voraussetzung für die Plasma-Technologie. Wird im Kampf-Kapitel angewendet.",
      kosten: { metall: 1000, silizium: 300, rohoel: 100 }, faktor: 2,
      wirkung: { typ: "prozent", je: 10, ziel: "Ionenwaffen-Schaden", aktiv: false } },
    { id: "plasma", name: "Plasma-Technologie", gruppe: "waffen", vor: [[v("ionen", 5)], [v("energie", 8)]],
      beschreibung: "Hochenergetisches Plasma – deutlich stärkere Plasmawaffen.",
      info: "+15 % Schaden der Plasmawaffen je Stufe (deutlich stärker als Laser/Ionen). Wird im Kampf-Kapitel angewendet.",
      kosten: { metall: 2000, silizium: 4000, rohoel: 1000 }, faktor: 2,
      wirkung: { typ: "prozent", je: 15, ziel: "Plasmawaffen-Schaden", aktiv: false } },
    // ---- Antriebe ----
    { id: "verbrennung", name: "Verbrennungstriebwerk", gruppe: "antriebe", vor: [[v("energie", 1)]],
      beschreibung: "Rohöl-basierte Raketentriebwerke für die ersten Schiffe.",
      info: "+10 % Geschwindigkeit aller Schiffe mit Verbrennungstriebwerk je Stufe. Treibstoff ist Rohöl. Wird im Flotten-Kapitel angewendet.",
      kosten: { metall: 400, rohoel: 600 }, faktor: 2,
      wirkung: { typ: "prozent", je: 10, ziel: "Geschwindigkeit (Verbrennungstriebwerk)", aktiv: false } },
    { id: "impuls", name: "Impulstriebwerk", gruppe: "antriebe", vor: [[v("energie", 2)], [v("verbrennung", 5)]],
      beschreibung: "Rückstoßantrieb mit Kernimpulsen – schneller als die Verbrennung.",
      info: "+20 % Geschwindigkeit aller Schiffe mit Impulstriebwerk je Stufe. Wird im Flotten-Kapitel angewendet.",
      kosten: { metall: 2000, silizium: 4000, rohoel: 600 }, faktor: 2,
      wirkung: { typ: "prozent", je: 20, ziel: "Geschwindigkeit (Impulstriebwerk)", aktiv: false } },
    { id: "hyperraumantrieb", name: "Hyperraumantrieb", gruppe: "antriebe", vor: [[v("impuls", 5)], [v("hyperspace", 3)]],
      beschreibung: "Krümmt den Raum um das Schiff – der schnellste Antrieb.",
      info: "+30 % Geschwindigkeit aller Schiffe mit Hyperraumantrieb je Stufe. Braucht etwas Kunststoff T1 für die Feldspulen. Wird im Flotten-Kapitel angewendet.",
      kosten: { metall: 10000, silizium: 20000, rohoel: 6000, kunststoff_t1: 200 }, faktor: 2,
      wirkung: { typ: "prozent", je: 30, ziel: "Geschwindigkeit (Hyperraumantrieb)", aktiv: false } },
    // ---- Flotte & Spionage ----
    { id: "spionage", name: "Spionage-Technologie", gruppe: "flotte", vor: [],
      beschreibung: "Bessere Sensoren für Spionagesonden: mehr Informationen je Scan.",
      info: "Jede Stufe erhöht die Spionage-Stufe um 1 – je höher gegenüber dem Ziel, desto mehr Details (Rohstoffe, Flotte, Verteidigung, Gebäude, Forschung). Wird im Spionage-Kapitel angewendet.",
      kosten: { metall: 200, silizium: 1000, rohoel: 200 }, faktor: 2,
      wirkung: { typ: "anzahl", basis: 0, je: 1, ziel: "Spionage-Stufe", aktiv: false } },
    { id: "astrophysik", name: "Astrophysik", gruppe: "flotte", vor: [[v("spionage", 4)], [v("impuls", 3)]],
      beschreibung: "Erforscht fremde Welten – mehr kolonisierbare Planeten.",
      info: "Je 2 Stufen kann ein weiterer Planet kolonisiert werden (aufgerundet: Stufe 1 = 1 Kolonie, Stufe 3 = 2 …). Wird im Kolonie-Kapitel angewendet.",
      kosten: { metall: 4000, silizium: 8000, rohoel: 4000 }, faktor: 1.75,
      wirkung: { typ: "kolonien", ziel: "kolonisierbare Planeten", ziel1: "kolonisierbarer Planet", aktiv: false } },
    { id: "komprimierung", name: "Komprimierungsforschung", gruppe: "flotte", vor: [[v("hyperspace", 2), v("computer", 4)]],
      beschreibung: "Verdichtet Fracht – +10 % Ladekapazität der Transporter je Stufe.",
      info: "Voraussetzung: Hyperspace-Technologie Stufe 2 ODER Computer-Technologie Stufe 4. Jede Stufe erhöht die Ladekapazität aller Transporter um 10 %. Wird im Flotten-Kapitel angewendet.",
      kosten: { metall: 1000, silizium: 2000, rohoel: 1000 }, faktor: 2,
      wirkung: { typ: "prozent", je: 10, ziel: "Transporter-Ladekapazität", aktiv: false } },
    // ---- Fortgeschritten ----
    { id: "hyperspace", name: "Hyperspace-Technologie", gruppe: "fortgeschritten", vor: [[v("energie", 3)], [v("schild", 1)]],
      beschreibung: "Theorie der höheren Dimensionen – mehr Ladekapazität und Grundlage moderner Antriebe.",
      info: "+5 % Ladekapazität aller Transporter je Stufe; Voraussetzung für Hyperraumantrieb, Komprimierung und das Forschungsnetzwerk. Wird im Flotten-Kapitel angewendet.",
      kosten: { silizium: 4000, rohoel: 2000 }, faktor: 2,
      wirkung: { typ: "prozent", je: 5, ziel: "Ladekapazität Transporter", aktiv: false } },
    { id: "netzwerk", name: "Intergalaktisches Forschungsnetzwerk", gruppe: "fortgeschritten", vor: [[v("computer", 8)], [v("hyperspace", 8)]],
      beschreibung: "Verbindet die Forschungseinrichtungen mehrerer Planeten und verkürzt so die Forschungszeit.",
      info: "Je Stufe wird eine weitere Forschungseinrichtung eines anderen Planeten mit der forschenden verbunden; ihre Stufen addieren sich für die Forschungszeit. Solange es nur den Hauptplaneten gibt, ist das Netzwerk wirkungslos – es wirkt erst mit Kolonien.",
      kosten: { metall: 240000, silizium: 400000, rohoel: 160000, kunststoff_t2: 500 }, faktor: 2,
      wirkung: { typ: "anzahl", basis: 0, je: 1, ziel: "verbundene Forschungseinrichtungen", ziel1: "verbundene Forschungseinrichtung", aktiv: false } },
    { id: "graviton", name: "Graviton-Technologie", gruppe: "fortgeschritten", vor: [[v("energie", 12)], [v("plasma", 8)]],
      beschreibung: "Bündelt Gravitonen zu einem künstlichen Schwerkraftfeld – die Spitze der Forschung.",
      info: "Schaltet in späteren Kapiteln Gravitonwaffen bzw. Spezialschiffe frei. Sehr teuer, mit Kunststoff T3; Kosten ×3 je Stufe.",
      kosten: { metall: 300000, silizium: 300000, rohoel: 150000, kunststoff_t3: 100 }, faktor: 3,
      wirkung: { typ: "freischaltung", ziel: "Gravitonwaffen (später)", aktiv: false } }
  ];
  L.forEach(function (f) {
    f.bild = "assets/forschung/" + f.id + ".svg";
    Object.freeze(f.kosten); Object.freeze(f.wirkung);
    f.vor.forEach(function (gr) { gr.forEach(Object.freeze); Object.freeze(gr); }); Object.freeze(f.vor);
    Object.freeze(f);
  });
  SS.DATEN.forschung = Object.freeze(L);
  SS.DATEN.forschungIds = Object.freeze(L.map(function (f) { return f.id; }));
  SS.DATEN.forschungNachId = function (id) {
    for (var i = 0; i < L.length; i++) if (L[i].id === id) return L[i];
    return null;
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
