// 0.19.0 (Sandro t52u): Beute, Rückruf, Angriffsschild, Wrack-/Bodensammlung.
const test = require("node:test");
const assert = require("node:assert/strict");
const { ladeSpiel } = require("./lade-spiel");
const T0 = Date.UTC(2026, 9, 31, 8, 0, 0);
function setup(tp) {
  const SS = ladeSpiel();
  const z = SS.kern.zustand.neuerSpielstand({ jetzt: T0, name: "Test" });
  if (tp) SS.kern.testphase.legeTestphaseAn(z, T0);
  return { SS, z, p: z.planeten[0], FL: SS.kern.flotte, BG: SS.kern.bergung };
}

test("Beute: Laderaum-Grenze, M:Si:Öl 3:2:1, Kunststoff klein 6:3:1, Sammler zählen nicht", () => {
  const { SS, BG } = setup();
  const kap = BG.beuteKapazitaet({ kleiner_frachter: 10, wracksammler: 5 });
  assert.equal(kap, 10 * SS.DATEN.schiffNachId("kleiner_frachter").ladung);
  const big = { metall: 1e9, silizium: 1e9, rohoel: 1e9, kunststoff_t1: 1e9, kunststoff_t2: 1e9, kunststoff_t3: 1e9 };
  const r = BG.beuteBerechnen({ kleiner_frachter: 100 }, null, big);
  assert.ok(r.summe <= r.kapazitaet && r.summe >= r.kapazitaet - 6);
  const k = (r.beute.kunststoff_t1 || 0) + (r.beute.kunststoff_t2 || 0) + (r.beute.kunststoff_t3 || 0);
  assert.ok(k <= r.kapazitaet * 0.05 + 1 && k > 0);
  assert.ok(Math.abs(r.beute.metall / r.beute.rohoel - 3) < 0.01 && Math.abs(r.beute.silizium / r.beute.rohoel - 2) < 0.01);
  assert.ok(r.beute.kunststoff_t1 > r.beute.kunststoff_t2 && r.beute.kunststoff_t2 > r.beute.kunststoff_t3);
  const ohne = BG.beuteBerechnen({ kleiner_frachter: 100 }, null, { metall: 1e9, silizium: 1e9, rohoel: 1e9 });
  assert.ok(!ohne.beute.kunststoff_t1, "kein Kunststoff, wenn Ziel keinen hat");
  const knapp = BG.beuteBerechnen({ kleiner_frachter: 100 }, null, { metall: 1000 });
  assert.deepEqual({ ...knapp.beute }, { metall: 500 }, "max. 50 % des Bestands");
});

test("Angriff mit Sieg bringt Beute heim, Kampfbericht zeigt sie", () => {
  const { SS, z, p, FL } = setup(true);
  const alpha = z.gegner[0], m0 = z.rohstoffe.metall, a0 = alpha.rohstoffe.metall;
  const r = FL.senden(z, p, { schiffe: { korvette: 4, zerstoerer: 3, kreuzer: 2, kleiner_frachter: 2 }, ziel: alpha, mission: "angriff" }, T0);
  assert.ok(r.ok, r.grund);
  const b = z.letzterKampfbericht;
  assert.equal(b.sieger, "angreifer"); assert.ok(b.beute && b.beute.metall > 0);
  assert.equal(alpha.rohstoffe.metall, a0 - b.beute.metall);
  assert.equal(z.rohstoffe.metall - m0, b.beute.metall);
  assert.match(SS.ui.kampfbericht.html(b), /Beute/);
});

test("Rückruf: sofort umkehren, Rohöl-Erstattung für ungeflogenen Anteil", () => {
  const { z, BG } = setup();
  z.rohstoffe.rohoel = 0;
  z.flotten.push({ id: "f1", mission: "transport", phase: "hin", abflug: T0, ankunft: T0 + 1000000, rueckkehr: T0 + 2000000, rohoel: 1000, schiffe: { kleiner_frachter: 1 }, anzahl: 1 });
  assert.equal(BG.erstattung(z.flotten[0], T0 + 250000), 750);
  const r = BG.rueckruf(z, "f1", T0 + 250000);
  assert.ok(r.ok); assert.equal(r.erstattung, 750); assert.equal(z.rohstoffe.rohoel, 750);
  assert.equal(z.flotten[0].phase, "rueck"); assert.equal(z.flotten[0].rueckkehr, T0 + 500000);
  assert.equal(BG.rueckruf(z, "f1", T0 + 300000).ok, false);
});

test("Angriffsschild: Kosten, Dauer, Abklingzeit, Blockade", () => {
  const { SS, z, p, FL, BG } = setup();
  z.einstellungen.master = false; z.rohstoffe.rohoel = 5000;
  const a = BG.schildAktivieren(z, p, T0);
  assert.ok(a.ok, a.grund); assert.equal(z.rohstoffe.rohoel, 4000);
  assert.ok(BG.schildStatus(p, T0 + 1000).aktiv);
  assert.ok(BG.angriffBlockiert(z, FL.herkunftKoord(z, p), T0 + 1000));
  const t = T0 + 25 * 3600000;
  assert.ok(!BG.schildStatus(p, t).aktiv); assert.equal(BG.schildPruefe(z, p, t).ok, false, "Abklingzeit");
  assert.ok(BG.schildPruefe(z, p, T0 + 49 * 3600000).ok);
  const z2 = SS.kern.zustand.bereinigen ? SS.kern.zustand.bereinigen(JSON.parse(JSON.stringify(z))) : null;
  if (z2) assert.ok(z2.planeten[0].schild, "Schild überlebt Speichern");
});

test("Bodensammlung/Wracksammlung: nur passende Sammler, eigene Koordinaten", () => {
  const { z, p, FL } = setup(true);
  const k = FL.herkunftKoord(z, p), alpha = z.gegner[0];
  p.schiffe.bodensammler = 3; p.schiffe.wracksammler = 3;
  p.truemmer = { orbit: { metall: 100, silizium: 50 }, boden: { metall: 200, silizium: 80 } };
  assert.match(FL.pruefe(z, p, { schiffe: { bodensammler: 1, kleiner_frachter: 1 }, ziel: k, mission: "bodensammlung" }).grund, /nur Bodensammler/);
  assert.match(FL.pruefe(z, p, { schiffe: { bodensammler: 1 }, ziel: alpha, mission: "bodensammlung" }).grund, /eigenen/);
  assert.match(FL.pruefe(z, p, { schiffe: { wracksammler: 1, bodensammler: 1 }, ziel: k, mission: "sammeln" }).grund, /nur Wracksammler/);
  assert.ok(FL.pruefe(z, p, { schiffe: { bodensammler: 1 }, ziel: k, mission: "bodensammlung" }).ok);
  assert.ok(FL.pruefe(z, p, { schiffe: { wracksammler: 1 }, ziel: k, mission: "sammeln" }).ok);
});
