// Kapitel 4 – Werft (0.10.0): 24 Schiffe nach Sandro, Kosten, Voraussetzungen, Bau inkl. Offline, Solarsatelliten-Strom, Master, Migration v7, Forschungsbonus.
const test = require("node:test");
const assert = require("node:assert/strict");
const { ladeSpiel, speicherAttrappe } = require("./lade-spiel");

const STD = 3600000;
const T0 = Date.UTC(2026, 9, 30, 8, 0, 0);
const gleich = (a, b) => assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)));
const VIEL = { metall: 1e12, silizium: 1e12, rohoel: 1e12, kunststoff_t1: 1e9, kunststoff_t2: 1e9, kunststoff_t3: 1e9 };
function setup(geb = {}, roh = {}, fo = {}) {
  const SS = ladeSpiel();
  const z = SS.kern.zustand.neuerSpielstand({ jetzt: T0, name: "Test" });
  Object.assign(z.planeten[0].gebaeude, geb);
  Object.assign(z.rohstoffe, roh);
  Object.assign(z.forschung, fo);
  return { SS, z, p: z.planeten[0], P: SS.kern.produktion, Bau: SS.kern.bau, WF: SS.kern.werft, D: SS.DATEN };
}

test("Daten: genau 24 Schiffe, 6 Waffentypen, 2 Hüllentypen, je mit Bild, Gruppe und gültigen Bezügen", () => {
  const { D } = setup();
  assert.equal(D.schiffe.length, 24);
  gleich(D.waffentypen.map((w) => w.id), ["gatling", "raketen", "laser", "ionen", "plasma", "railgun"]);
  gleich(D.huellentypen.map((h) => h.id), ["leichtmetall", "verbund"]);
  gleich(D.schiffGruppen.map((g) => g.id), ["kampf", "hilf", "spezial"]);
  const fs = require("fs"), path = require("path");
  for (const s of D.schiffe) {
    const png = D.schiffPngFreigegeben.indexOf(s.id) >= 0;
    assert.equal(s.bild, "assets/schiffe/" + s.id + (png ? ".png" : ".svg"));
    assert.ok(fs.existsSync(path.join(__dirname, "..", s.bild)), s.id + " Bild");
    assert.ok(D.huellentypNachId(s.huelle), s.id);
    for (const w of Object.keys(s.waffen)) assert.ok(D.waffentypNachId(w), s.id + " " + w);
    for (const v of s.vor.forschung) assert.ok(D.forschungNachId(v.id), s.id + " " + v.id);
    for (const g of Object.keys(s.schnellfeuer)) assert.ok(D.schiffNachId(g) || D.verteidigungNachId(g), s.id + " SF " + g);
    assert.ok(s.vor.werft >= 1 && s.beschreibung && s.info, s.id);
    if (s.huelle === "verbund") assert.ok(Object.keys(s.kosten).some((k) => /kunststoff/.test(k)), s.id + ": Verbund kostet Kunststoff");
  }
  gleich(D.schiffNachId("kleiner_frachter").kosten, { metall: 2000, silizium: 2000 });
  gleich(["kleiner_frachter", "mittlerer_frachter", "grosser_frachter", "massengutfrachter", "wracksammler"].map((id) => D.schiffNachId(id).ladung), [5000, 50000, 250000, 1000000, 100000]);
  gleich(D.schiffe.filter((s) => s.gruppe === "kampf").map((s) => s.name), ["Aufklärer", "Kleine Drohne", "Mittlere Drohne", "Schwere Drohne", "Korvette", "Fregatte", "Zerstörer", "Kreuzer", "Bomber", "Schlachtkreuzer", "Schlachtschiff", "Träger", "Koloss", "Titan"]);
  const k = (id) => D.schiffNachId(id).kosten;
  for (const d of ["kleine_drohne", "mittlere_drohne", "schwere_drohne"]) assert.ok(k(d).metall > k(d).silizium, d + " metalllastig");
  for (const d of ["traeger", "titan"]) assert.ok(k(d).silizium > k(d).metall, d + " siliziumlastig");
  assert.ok(k("bomber").kunststoff_t3 >= 1000, "Bomber: hoher T3-Anteil");
  gleich(D.schiffNachId("solarsatellit").kosten, { silizium: 2000, rohoel: 500 });
});

test("Ohne Werft: kein Bau, klare Meldung; Voraussetzungen werden geprüft", () => {
  const { z, p, WF } = setup({}, VIEL);
  assert.equal(WF.pruefe(z, p, "kleine_drohne", 1).grund, "Zuerst die Werft bauen.");
  p.gebaeude.werft = 1;
  const r = WF.pruefe(z, p, "kleine_drohne", 1);
  assert.equal(r.ok, false); assert.match(r.grund, /Voraussetzung fehlt: .*Verbrennung/);
  z.forschung.verbrennung = 1; z.forschung.computer = 1;
  assert.equal(WF.pruefe(z, p, "kleine_drohne", 1).ok, true);
  assert.equal(WF.pruefe(z, p, "kreuzer", 1).ok, false, "Werft 5 fehlt");
  assert.equal(WF.pruefe(z, p, "kleine_drohne", 0).ok, false);
  assert.equal(WF.pruefe(z, p, "solarsatellit", 1).ok, false, "Satellit braucht Energie 1");
  z.forschung.energie = 1;
  assert.equal(WF.pruefe(z, p, "solarsatellit", 1).ok, true, "Satellit: Werft 1 + Energie 1");
});

test("Bau: Kosten werden abgezogen, Einheiten werden einzeln fertig, Punkte und Abbrechen mit Erstattung", () => {
  const { z, p, WF, D } = setup({ werft: 2 }, { metall: 100000, silizium: 100000, rohoel: 0 }, { verbrennung: 2, computer: 1 });
  assert.ok(WF.stueckMs(z, p, D.schiffNachId("kleine_drohne")) >= 1000);
  const r = WF.starte(z, p, "kleine_drohne", 4, T0);
  assert.ok(r.ok);
  assert.equal(z.rohstoffe.metall, 100000 - 10000); assert.equal(z.rohstoffe.silizium, 100000 - 2000);
  assert.equal(r.auftrag.ende - r.auftrag.start, r.auftrag.stueckMs * 4);
  const punkte0 = z.punkte;
  WF.faellige(z, p, T0 + r.auftrag.stueckMs * 2 + 1);
  assert.equal(p.schiffe.kleine_drohne, 2);
  assert.ok(z.punkte > punkte0);
  const ab = WF.abbrechen(z, p, 0, T0 + r.auftrag.stueckMs * 2 + 1);
  assert.equal(ab.erstattet, 2);
  assert.equal(z.rohstoffe.metall, 100000 - 5000);
  assert.equal(p.werftauftraege.length, 0);
});

test("Bauzeit: (M+Si)/(2500·(1+Werft)) h, Roboter verkürzt, Mindestzeit; Warteschlange sequentiell, unbegrenzt", () => {
  const { z, p, WF, D } = setup({ werft: 1 }, VIEL, { verbrennung: 2, impuls: 2, energie: 1 });
  const kt = D.schiffNachId("kleiner_frachter");
  assert.equal(WF.stueckMs(z, p, kt), 4000 / 5000 * STD);
  p.gebaeude.werft = 3;
  assert.equal(WF.stueckMs(z, p, kt), 4000 / 10000 * STD);
  z.forschung.roboter = 2;
  assert.ok(WF.stueckMs(z, p, kt) < 4000 / 10000 * STD);
  const a = WF.starte(z, p, "kleiner_frachter", 2, T0).auftrag, b = WF.starte(z, p, "solarsatellit", 3, T0).auftrag;
  assert.equal(b.start, a.ende);
  for (let i = 0; i < 20; i++) assert.ok(WF.starte(z, p, "solarsatellit", 1, T0).ok, "Auftrag " + i);
  assert.equal(p.werftauftraege.length, 22);
});

test("Werft-Ausbau gesperrt während Schiffbau", () => {
  const { z, p, WF, Bau } = setup({ werft: 1 }, VIEL, { energie: 1 });
  WF.starte(z, p, "solarsatellit", 1, T0);
  const r = Bau.pruefe(z, p, { art: "gebaeude", id: "werft" });
  assert.equal(r.ok, false); assert.match(r.grund, /Werft Schiffe baut/);
});

test("Offline: simuliereBis liefert Satelliten aus, die danach Strom liefern", () => {
  const { z, p, WF, P } = setup({ werft: 1 }, { metall: 0, silizium: 10000, rohoel: 5000 }, { energie: 1 });
  const r = WF.starte(z, p, "solarsatellit", 4, T0);
  assert.ok(r.ok);
  const vorher = P.uebersicht(z).strom.erzeugung;
  const erg = P.simuliereBis(z, r.auftrag.ende + 120000);
  assert.equal(p.solarsatelliten, 4);
  assert.equal(p.werftauftraege.length, 0);
  assert.ok(P.uebersicht(z).strom.erzeugung > vorher, "Satelliten erhöhen die Stromerzeugung");
  assert.ok((erg.fertig || []).some((a) => a.art === "schiff" && a.menge === 4));
});

test("Master: sofort und kostenlos, Voraussetzungen egal, Werft nötig; Einschalten beendet laufende Aufträge; Punkte", () => {
  const { z, p, WF, Bau } = setup({ werft: 1 }, { metall: 0, silizium: 4000, rohoel: 1000 }, { energie: 1 });
  WF.starte(z, p, "solarsatellit", 2, T0);
  Bau.masterSetzen(z, true, T0 + 1000);
  assert.equal(p.solarsatelliten, 2); assert.equal(p.werftauftraege.length, 0);
  const pk = z.punkte, m = z.rohstoffe.metall;
  const r = WF.starte(z, p, "titan", 3, T0 + 2000);
  assert.ok(r.ok && r.sofort);
  assert.equal(p.schiffe.titan, 3); assert.equal(z.rohstoffe.metall, m); assert.ok(z.punkte > pk);
  p.gebaeude.werft = 0;
  assert.equal(WF.pruefe(z, p, "kleine_drohne", 1).grund, "Zuerst die Werft bauen.");
});

test("0.12.0: Orbitalverteidigungsplattform ist Verteidigung (kein Schiff); Waffenslots + Sondenabwehr; Bodensammler/Wracksammler getrennt", () => {
  const { D } = setup();
  assert.equal(D.schiffNachId("orbitalverteidigungsplattform"), null);
  const o = D.verteidigungNachId("orbitalverteidigungsplattform");
  assert.equal(o.phase, "orbit"); assert.equal(o.waffenslots.anzahl, 2);
  assert.ok(!o.waffenslots.erlaubt.includes("graviton"));
  gleich(o.sondenabwehr.forschung, [{ id: "spionage", stufe: 12 }, { id: "computer", stufe: 12 }]);
  assert.equal(D.schiffNachId("wracksammler").ladungArt, "orbit"); assert.equal(D.schiffNachId("bodensammler").ladungArt, "boden");
  assert.equal(D.schiffNachId("traeger").hangar.plaetze, 50);
});

test("Migration v7 → v8: alte IDs 1:1 umbenannt, übrige verworfen, offene Aufträge alter Schiffe erstattet", () => {
  const SS = ladeSpiel(), sp = speicherAttrappe(), PR = SS.kern.profile;
  const a = PR.erstelle(sp, { name: "Alt7", jetzt: T0 });
  const key = PR.spielstandSchluessel(a.profil.id);
  const v7 = JSON.parse(sp.getItem(key));
  v7.version = 7; v7.rohstoffe.metall = 0;
  v7.planeten[0].schiffe = { recycler: 2, kleiner_transporter: 5, kreuzer: 1, interzeptor: 7 };
  v7.planeten[0].werftauftraege = [
    { art: "schiff", id: "orbitalplattform", name: "Orbitalplattform", menge: 1, fertig: 0, stueckMs: 1000, stueckKosten: { metall: 1 }, start: T0, ende: T0 + 1000 },
    { art: "schiff", id: "minenleger", name: "Minenleger", menge: 3, fertig: 1, stueckMs: 1000, stueckKosten: { metall: 100 }, start: T0, ende: T0 + 3000 }];
  sp.setItem(key, JSON.stringify(v7));
  const z = PR.ladeProfil(sp, a.profil.id).zustand;
  assert.equal(z.version, SS.BALANCE.SPIELSTAND_VERSION);
  gleich(z.planeten[0].schiffe, { wracksammler: 2, kleiner_frachter: 5, kreuzer: 1 });
  gleich(z.planeten[0].werftauftraege.map((w) => w.id), [], "0.12.0: Orbitalplattform-Auftrag erstattet (jetzt Verteidigung)");
  assert.equal(z.rohstoffe.metall, 201, "2 offene Minenleger + 1 Orbitalplattform erstattet");
});

test("Werte mit Forschungsbonus (bonus()): Waffen, Waffentyp, Schild, Panzerung, Antrieb, Ladung", () => {
  const { z, WF, D, SS } = setup();
  const kt = D.schiffNachId("kleiner_frachter"), lj = D.schiffNachId("kleine_drohne");
  const g = WF.werte(z, lj);
  assert.equal(g.angriff, lj.angriff); assert.equal(g.huelle, (2500 + 500) / 10);
  z.forschung.waffen = 2; z.forschung.laser = 1; z.forschung.panzerung = 1; z.forschung.verbrennung = 3; z.forschung.hyperspace = 1; z.forschung.komprimierung = 1;
  const FO = SS.kern.forschung, w = WF.werte(z, lj), k = WF.werte(z, kt);
  assert.ok(Math.abs(w.angriff - lj.angriff * (1 + FO.bonus(z, "waffen") / 100)) < 1e-9, "Gatling/Raketen: nur Waffentechnik");
  const ko = D.schiffNachId("korvette");
  assert.ok(Math.abs(WF.werte(z, ko).angriff - ko.angriff * (1 + FO.bonus(z, "waffen") / 100) * (1 + 0.5 * FO.bonus(z, "laser") / 100)) < 1e-9, "Korvette 50 % Laser");
  assert.ok(Math.abs(w.huelle - 300 * (1 + FO.bonus(z, "panzerung") / 100)) < 1e-9);
  assert.ok(Math.abs(w.tempo - lj.tempo * (1 + FO.bonus(z, "verbrennung") / 100)) < 1e-9);
  assert.ok(Math.abs(k.ladung - kt.ladung * (1 + (FO.bonus(z, "hyperspace") + FO.bonus(z, "komprimierung")) / 100)) < 1e-9, "Transporter: beide Ladungsboni");
  const vb = WF.werte(z, D.schiffNachId("bomber"));
  assert.equal(vb.grund.huelle, (40000 + 25000) * 1.25 / 10, "Verbund ×1,25");
});

test("Migration v6 → v7 (Profil): Schiffsbestand je Planet, Werft-Aufträge bereinigt, alter z.schiffe übernommen", () => {
  const SS = ladeSpiel(), sp = speicherAttrappe(), PR = SS.kern.profile;
  const a = PR.erstelle(sp, { name: "Alt", jetzt: T0 });
  const key = PR.spielstandSchluessel(a.profil.id);
  const v6 = JSON.parse(sp.getItem(key));
  v6.version = 6; delete v6.planeten[0].schiffe; delete v6.planeten[0].werftauftraege; v6.schiffe = { kreuzer: 3, quatsch: 2 };
  sp.setItem(key, JSON.stringify(v6));
  const z = PR.ladeProfil(sp, a.profil.id).zustand;
  assert.equal(z.version, SS.BALANCE.SPIELSTAND_VERSION);
  gleich(z.planeten[0].schiffe, { kreuzer: 3 }); gleich(z.planeten[0].werftauftraege, []); gleich(z.schiffe, {});
  z.planeten[0].werftauftraege.push({ art: "schiff", id: "kreuzer", name: "Kreuzer", menge: 2, fertig: 0, stueckMs: 1000, stueckKosten: { metall: 1 }, start: T0, ende: T0 + 2000 }, { id: "gibtsnicht" });
  PR.speichereProfil(sp, a.profil.id, z, T0);
  const z2 = PR.ladeProfil(sp, a.profil.id).zustand;
  assert.equal(z2.planeten[0].werftauftraege.length, 1);
  assert.equal(z2.planeten[0].schiffe.kreuzer >= 3, true);
});

test("0.11.3: Orbitalverteidigungsplattform – 6 Stufenbilder nach Anzahl, Bomber PNG", () => {
  const { D } = setup();
  const fs = require("fs"), path = require("path");
  const o = D.verteidigungNachId("orbitalverteidigungsplattform");
  assert.equal(o.bild, "assets/schiffe/orbitalverteidigungsplattform.svg");
  assert.equal(D.schiffBild(o), o.bild);
  const erwartet = [[0, 1], [1, 1], [2, 2], [3, 2], [4, 3], [6, 3], [7, 4], [10, 4], [11, 5], [20, 5], [21, 6], [500, 6]];
  for (const [n, st] of erwartet) assert.equal(D.schiffBild(o, n), "assets/schiffe/orbitalverteidigungsplattform-" + st + ".png", "Anzahl " + n);
  for (let i = 1; i <= 6; i++) assert.ok(fs.existsSync(path.join(__dirname, "..", "assets/schiffe/orbitalverteidigungsplattform-" + i + ".png")));
  const b = D.schiffNachId("bomber");
  assert.equal(b.bild, "assets/schiffe/bomber.png");
  assert.equal(D.schiffBild(b, 5), b.bild);
});

test("0.11.4: Frachter-Leiter – Großer Frachter neu, Massengutfrachter 1 Mio., PNG, Staffelung", () => {
  const { D } = setup();
  const fs = require("fs"), path = require("path");
  const ids = ["kleiner_frachter", "mittlerer_frachter", "grosser_frachter", "massengutfrachter"];
  const s = ids.map((id) => D.schiffNachId(id));
  assert.deepEqual(s.map((x) => x.ladung), [5000, 50000, 250000, 1000000]);
  s.forEach((x) => { assert.equal(x.transporter, true); assert.equal(x.bild, "assets/schiffe/" + x.id + ".png"); assert.ok(fs.existsSync(path.join(__dirname, "..", x.bild))); });
  const g = s[2], m = s[1], mg = s[3];
  assert.equal(g.name, "Großer Frachter"); assert.equal(g.gruppe, "hilf");
  assert.ok(m.vor.werft < g.vor.werft && g.vor.werft < mg.vor.werft);
  assert.ok(m.tempo > g.tempo && g.tempo > mg.tempo);
  assert.ok(m.kosten.metall < g.kosten.metall && g.kosten.metall < mg.kosten.metall);
  assert.ok(mg.ladung / mg.verbrauch > g.ladung / g.verbrauch, "Massengut effizienter");
  assert.equal(D.schiffNachId("titan").ladung, 1000000, "Titan unverändert");
});
