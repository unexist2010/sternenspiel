// Kapitel 3 – Forschung: Kosten, Voraussetzungen (UND/ODER), Sichtbarkeit, Forschungszeit, Wirkungen, Schleife, Offline, Master.
const test = require("node:test");
const assert = require("node:assert/strict");
const { ladeSpiel, speicherAttrappe } = require("./lade-spiel");

const STD = 3600000;
const T0 = Date.UTC(2026, 9, 19, 8, 0, 0);
const gleich = (a, b) => assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)));
function setup(geb = {}, roh = {}, fo = {}) {
  const SS = ladeSpiel();
  const z = SS.kern.zustand.neuerSpielstand({ jetzt: T0, name: "Test" });
  Object.assign(z.planeten[0].gebaeude, geb);
  Object.assign(z.rohstoffe, roh);
  Object.assign(z.forschung, fo);
  return { SS, z, p: z.planeten[0], P: SS.kern.produktion, Bau: SS.kern.bau, FO: SS.kern.forschung, D: SS.DATEN };
}
const VIEL = { metall: 1e12, silizium: 1e12, rohoel: 1e12, kunststoff_t1: 1e9, kunststoff_t2: 1e9, kunststoff_t3: 1e9 };

test("Liste: genau die 18 vorgegebenen Forschungen, je mit Bild, Gruppe, Wirkung; keine Obergrenze", () => {
  const { D } = setup();
  gleich(D.forschungIds, ["energie", "roboter", "computer", "waffen", "schild", "panzerung", "laser", "ionen", "plasma", "verbrennung", "impuls",
    "hyperraumantrieb", "spionage", "astrophysik", "komprimierung", "hyperspace", "netzwerk", "graviton"]);
  for (const f of D.forschung) {
    assert.ok(f.bild === "assets/forschung/" + f.id + ".svg");
    assert.ok(D.forschungGruppen.some((g) => g.id === f.gruppe), f.id);
    assert.ok(f.faktor >= 1.75 && f.wirkung && f.info && f.beschreibung, f.id);
    assert.ok(!("maxStufe" in f));
  }
  assert.ok(!D.forschungIds.some((id) => /nanit|speicher|antimaterie/i.test(id)));
});

test("Kostenformel OGame: Basis · Faktor^(n−1); Roboter überproportional (2,5)", () => {
  const { FO, D } = setup();
  gleich(FO.kosten(D.forschungNachId("energie"), 1), { silizium: 800, rohoel: 400 });
  gleich(FO.kosten(D.forschungNachId("energie"), 4), { silizium: 6400, rohoel: 3200 });
  gleich(FO.kosten(D.forschungNachId("laser"), 3), { metall: 800, silizium: 400 });
  gleich(FO.kosten(D.forschungNachId("astrophysik"), 2), { metall: 7000, silizium: 14000, rohoel: 7000 });
  assert.equal(D.forschungNachId("roboter").faktor, 2.5);
  gleich(FO.kosten(D.forschungNachId("roboter"), 3), { metall: 2500, silizium: 750, rohoel: 1250 });
  assert.ok(FO.kosten(D.forschungNachId("graviton"), 1).kunststoff_t3 > 0, "späte Forschung mit Kunststoff");
  assert.ok(isFinite(FO.kosten(D.forschungNachId("energie"), 60).silizium), "Stufe 60 berechenbar");
});

test("Voraussetzungen UND/ODER, blockieren den Start; Komprimierung: Hyperspace 2 ODER Computer 4", () => {
  const { FO, D, z } = setup({ forschungseinrichtung: 1 }, VIEL);
  assert.match(FO.pruefe(z, "laser").grund, /Voraussetzung fehlt: Energie-Technologie 2/);
  z.forschung.energie = 2;
  assert.equal(FO.pruefe(z, "laser").ok, true);
  // Ionen: Laser 5 UND ET 4
  z.forschung.laser = 5;
  assert.match(FO.pruefe(z, "ionen").grund, /Energie-Technologie 4/);
  z.forschung.energie = 4;
  assert.equal(FO.pruefe(z, "ionen").ok, true);
  // ODER
  const k = D.forschungNachId("komprimierung");
  assert.equal(FO.voraussetzungenOk(z, k), false);
  assert.match(FO.pruefe(z, "komprimierung").grund, /Hyperspace-Technologie 2 oder Computer-Technologie 4/);
  z.forschung.computer = 4;
  assert.equal(FO.voraussetzungenOk(z, k), true, "Computer 4 reicht");
  z.forschung.computer = 0; z.forschung.hyperspace = 2;
  assert.equal(FO.voraussetzungenOk(z, k), true, "Hyperspace 2 reicht");
  // Graviton ET 12 + Plasma 8
  gleich(D.forschungNachId("graviton").vor, [[{ id: "energie", stufe: 12 }], [{ id: "plasma", stufe: 8 }]]);
});

test("Sichtbarkeit: ohne Voraussetzung sichtbar, sonst sobald mindestens eine erfüllt; Master zeigt alle", () => {
  const { FO, D, z } = setup();
  const sicht = () => D.forschung.filter((f) => FO.sichtbar(z, f)).map((f) => f.id);
  gleich(sicht(), ["energie", "roboter", "computer", "waffen", "panzerung", "spionage"]);
  z.forschung.energie = 3;
  for (const id of ["schild", "laser", "verbrennung", "impuls", "hyperspace"]) assert.ok(sicht().includes(id), id);
  assert.ok(!sicht().includes("ionen") && !sicht().includes("plasma"), "Ionen (Laser 5 / ET 4) noch keine erfüllt");
  z.forschung.energie = 4;
  assert.ok(sicht().includes("ionen"), "eine von zwei Voraussetzungen reicht für die Sichtbarkeit");
  assert.ok(!sicht().includes("graviton") && !sicht().includes("hyperraumantrieb") && !sicht().includes("komprimierung"));
  z.forschung.computer = 4;
  assert.ok(sicht().includes("komprimierung"), "ODER-Gruppe erfüllt");
  assert.ok(sicht().includes("netzwerk") === false);
  z.einstellungen.master = true;
  assert.equal(sicht().length, 18);
});

test("Forschungszeit = (M + Si) / (1000 · (1 + Stufe Einrichtung)); Einrichtung nötig", () => {
  const { FO, z, p } = setup({}, VIEL);
  assert.match(FO.pruefe(z, "energie").grund, /Forschungseinrichtung bauen/);
  p.gebaeude.forschungseinrichtung = 1;
  assert.equal(FO.dauerMs(z, { silizium: 800, rohoel: 400 }), Math.round(800 / 2000 * STD)); // 24 Min.
  p.gebaeude.forschungseinrichtung = 4;
  assert.equal(FO.dauerMs(z, { metall: 1000, silizium: 1500 }), Math.round(2500 / 5000 * STD));
  assert.equal(FO.dauerMs(z, { rohoel: 100 }), 5000, "Mindestdauer 5 s");
  // Netzwerk ohne Kolonien wirkungslos
  z.forschung.netzwerk = 5;
  assert.equal(FO.einrichtungStufe(z), 4);
});

test("Energie-Technologie erhöht die Stromerzeugung (Solar, Ölverbrennung, Satelliten) um 5 % je Stufe", () => {
  const { P, z, p } = setup({ solarfarm: 5, oelverbrennung: 2 }, { rohoel: 1e6 });
  p.solarsatelliten = 10;
  const vorher = P.uebersicht(z).strom.erzeugung;
  z.forschung.energie = 4;
  const nachher = P.uebersicht(z).strom.erzeugung;
  assert.ok(Math.abs(nachher / vorher - 1.2) < 1e-9, nachher / vorher);
  const oel = P.uebersicht(z).gebaeude.oelverbrennung.verbraucht.rohoel;
  z.forschung.energie = 0;
  assert.ok(Math.abs(P.uebersicht(z).gebaeude.oelverbrennung.verbraucht.rohoel - oel) < 1e-9, "Ölverbrauch unverändert");
});

test("Roboterforschung verkürzt Gebäude- und Startplatz-Bauzeit (÷ (1 + 1,5·n)), aber nicht die Forschung", () => {
  const { Bau, FO, D, z, p } = setup({ forschungseinrichtung: 1 }, VIEL);
  const k = Bau.gebaeudeKosten(D.gebaeudeNachId("metallmine"), 10), kS = Bau.startplatzKosten("C", 5);
  const geb0 = Bau.bauzeitMs(k, z), sp0 = Bau.startplatzBauzeitMs(kS, z), fo0 = FO.dauerMs(z, { metall: 4000, silizium: 4000 });
  z.forschung.roboter = 2;
  assert.ok(Math.abs(Bau.bauzeitMs(k, z) - geb0 / 4) <= 1, "Gebäude ÷ 4");
  assert.ok(Math.abs(Bau.startplatzBauzeitMs(kS, z) - sp0 / 4) <= 1, "Startplatz ÷ 4");
  assert.equal(FO.dauerMs(z, { metall: 4000, silizium: 4000 }), fo0, "Forschung unverändert");
  assert.equal(FO.bonus(z, "roboter"), 0.25);
  assert.equal(Bau.ziel(z, p, { art: "gebaeude", id: "metallmine" }).bauzeit, Bau.bauzeitMs(Bau.gebaeudeKosten(D.gebaeudeNachId("metallmine"), 1), z));
});

test("Schleife: eine Forschung gleichzeitig, unabhängig vom Bauauftrag; Einrichtung ↔ Forschung sperren sich gegenseitig", () => {
  const { Bau, FO, z, p } = setup({ forschungseinrichtung: 1 }, VIEL);
  assert.equal(FO.starte(z, "energie", T0).ok, true);
  assert.match(FO.pruefe(z, "computer").grund, /bereits eine Forschung/);
  assert.equal(Bau.starte(z, p, { art: "gebaeude", id: "metallmine" }, T0).ok, true, "Bau parallel zur Forschung");
  Bau.abbrechen(z, p);
  assert.match(Bau.pruefe(z, p, { art: "gebaeude", id: "forschungseinrichtung" }).grund, /Während einer Forschung/);
  const vorher = z.rohstoffe.silizium;
  FO.abbrechen(z);
  assert.equal(z.rohstoffe.silizium, vorher + 800, "volle Erstattung");
  assert.equal(Bau.starte(z, p, { art: "gebaeude", id: "forschungseinrichtung" }, T0).ok, true);
  assert.match(FO.pruefe(z, "energie").grund, /wird gerade ausgebaut/);
});

test("Echtzeit + offline: Forschung endet genau pünktlich, Punkte wie OGame, Kosten abgezogen", () => {
  const { P, FO, z } = setup({ forschungseinrichtung: 1 }, { silizium: 1000, rohoel: 1000 });
  const r = FO.starte(z, "energie", T0);
  assert.equal(r.ok, true); assert.equal(r.auftrag.ende - T0, 24 * 60000);
  assert.equal(z.rohstoffe.rohoel, 600);
  P.tick(z, T0 + 23 * 60000);
  assert.equal(z.forschung.energie, 0);
  const off = P.offlineFortschritt(z, T0 + 30 * STD); // lange offline
  assert.equal(z.forschung.energie, 1); assert.equal(z.forschungsauftrag, null);
  assert.ok(off.fertig.some((a) => a.art === "forschung" && a.id === "energie"));
  assert.ok(Math.abs(z.punkte - 1.2) < 1e-9, "1.200 Rohstoffe = 1,2 Punkte");
});

test("Master: Forschung sofort, kostenlos, Voraussetzungen ignoriert; laufende Forschung wird beim Einschalten fertig", () => {
  const { Bau, FO, z } = setup({ forschungseinrichtung: 1 }, { silizium: 1000, rohoel: 1000 });
  FO.starte(z, "energie", T0);
  const fertig = Bau.masterSetzen(z, true, T0 + 1000);
  assert.ok(fertig.some((a) => a && a.art === "forschung")); assert.equal(z.forschung.energie, 1);
  z.rohstoffe.metall = 0; z.rohstoffe.silizium = 0; z.rohstoffe.rohoel = 0;
  const r = FO.starte(z, "graviton", T0 + 2000);
  assert.equal(r.ok, true); assert.equal(r.sofort, true); assert.equal(z.forschung.graviton, 1);
  assert.equal(z.rohstoffe.metall, 0, "nichts abgezogen");
  assert.ok(z.punkte > 750, "Punkte trotzdem gutgeschrieben (Annahme)");
  z.planeten[0].gebaeude.forschungseinrichtung = 0;
  assert.match(FO.pruefe(z, "energie").grund, /Forschungseinrichtung/, "Einrichtung bleibt nötig (Annahme)");
});

test("Wirkungen und zentrale bonus()-Funktion für spätere Kapitel", () => {
  const { FO, z } = setup();
  Object.assign(z.forschung, { laser: 3, computer: 2, astrophysik: 3, komprimierung: 2, plasma: 2, spionage: 5, graviton: 1, hyperspace: 4, impuls: 1 });
  assert.equal(FO.bonus(z, "laser"), 30); assert.equal(FO.wirkung("laser", 3).text, "+30 % Laserwaffen-Schaden");
  assert.equal(FO.bonus(z, "computer"), 3, "1 + 2 Flotten-Slots");
  assert.equal(FO.bonus(z, "astrophysik"), 2); assert.equal(FO.bonus(z, "komprimierung"), 20);
  assert.equal(FO.bonus(z, "plasma"), 30); assert.equal(FO.bonus(z, "spionage"), 5); assert.equal(FO.bonus(z, "graviton"), 1);
  assert.equal(FO.bonus(z, "hyperspace"), 20); assert.equal(FO.bonus(z, "impuls"), 20);
  assert.equal(FO.energieFaktor(z), 1);
});

test("Migration v5 → v6 (Profil): Forschung ergänzt, Auftrag bereinigt, Stand bleibt beim Neuladen", () => {
  const SS = ladeSpiel(), sp = speicherAttrappe(), PR = SS.kern.profile;
  const a = PR.erstelle(sp, { name: "Alt", jetzt: T0 });
  const key = PR.spielstandSchluessel(a.profil.id);
  const v5 = JSON.parse(sp.getItem(key));
  v5.version = 5; v5.forschung = { energie: "3", nanit: 9 }; delete v5.forschungsauftrag; v5.punkte = 700;
  v5.freigeschaltet.kunststoffwerk_t2 = false;
  sp.setItem(key, JSON.stringify(v5));
  const z = PR.ladeProfil(sp, a.profil.id).zustand;
  assert.equal(z.version, 6);
  assert.equal(z.forschung.energie, 3); assert.ok(!("nanit" in z.forschung)); assert.equal(z.forschung.graviton, 0);
  assert.equal(z.forschungsauftrag, null);
  assert.equal(z.freigeschaltet.kunststoffwerk_t2, true, "700 Punkte ≥ 500");
  z.forschungsauftrag = { art: "forschung", id: "laser", name: "Laser-Technologie", stufe: 1, kosten: { metall: 200 }, start: T0, ende: T0 + 1000 };
  PR.speichereProfil(sp, a.profil.id, z, T0);
  const z2 = PR.ladeProfil(sp, a.profil.id).zustand;
  assert.equal(z2.forschungsauftrag.id, "laser");
  // kaputter Auftrag wird verworfen
  const roh = JSON.parse(sp.getItem(key)); roh.forschungsauftrag = { id: "gibtsnicht" }; sp.setItem(key, JSON.stringify(roh));
  assert.equal(PR.ladeProfil(sp, a.profil.id).zustand.forschungsauftrag, null);
});
