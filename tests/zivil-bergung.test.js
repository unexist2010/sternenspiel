// 0.14.2 (Sandro t33u): Zivilschiffe kämpfen nicht; Orbit-Trümmer bergen (Mission „sammeln“ + Auto-Bergung nach Sieg).
const test = require("node:test");
const assert = require("node:assert/strict");
const { ladeSpiel } = require("./lade-spiel");
const T0 = Date.UTC(2026, 9, 31, 8, 0, 0);
const sum = (o) => Object.values(o || {}).reduce((s, n) => s + n, 0);
function setup() {
  const SS = ladeSpiel();
  const z = SS.kern.zustand.neuerSpielstand({ jetzt: T0, name: "Test" });
  SS.kern.testphase.legeTestphaseAn(z, T0);
  return { SS, z, p: z.planeten[0], FL: SS.kern.flotte };
}
const LOG = process.env.TESTLAUF_LOG ? console.log : () => {};

test("Testablauf t33u: Spionage, Alpha ohne Sammler + Nachsammlung, Beta mit Auto-Bergung", () => {
  const { SS, z, p, FL } = setup();
  const [alpha, beta] = z.gegner;
  assert.equal(z.einstellungen.master, true); assert.equal(z.planeten.length + z.gegner.length, 4);
  for (const g of [alpha, beta]) {
    const r = FL.senden(z, p, { schiffe: { spionagesonde: 1 }, ziel: g, mission: "spionieren" }, T0);
    assert.ok(r.ok, r.grund); assert.equal(z.letzterSpionagebericht.gegner, g.id);
    LOG("Spionage", g.name, JSON.stringify(z.letzterSpionagebericht.schiffe), JSON.stringify(z.letzterSpionagebericht.verteidigung));
  }
  // Alpha OHNE Wracksammler, mit Frachter (zivil) dabei
  let r = FL.senden(z, p, { schiffe: { korvette: 4, zerstoerer: 3, kreuzer: 2, kleiner_frachter: 2 }, ziel: alpha, mission: "angriff" }, T0);
  assert.ok(r.ok, r.grund);
  let b = z.letzterKampfbericht;
  assert.equal(b.sieger, "angreifer"); assert.ok(b.phasen[0].runden.length && b.phasen[1].runden.length);
  assert.equal(b.geborgen, null);
  assert.equal(b.angreifer.find((x) => x.id === "kleiner_frachter").verloren, 0, "Frachter unversehrt");
  assert.ok(!b.phasen[0].runden[0].gruppen.angreifer.some((x) => x.id === "kleiner_frachter"), "Frachter kämpft nicht");
  assert.equal(p.schiffe.kleiner_frachter, 6, "Frachter zurück");
  const orbitA = { ...alpha.truemmer.orbit }, bodenA = { ...alpha.truemmer.boden };
  assert.ok(orbitA.metall > 0 && bodenA.metall >= 0);
  LOG("Alpha:", b.sieger, "Runden O/B", b.phasen[0].runden.length, b.phasen[1].runden.length, "Verluste A", JSON.stringify(b.angreifer.map((x) => [x.id, x.verloren])), "Orbit", JSON.stringify(orbitA), "Boden", JSON.stringify(bodenA));
  // Sammelflotte
  const met0 = z.rohstoffe.metall, si0 = z.rohstoffe.silizium;
  assert.match(FL.pruefe(z, p, { schiffe: { kleiner_frachter: 1 }, ziel: alpha, mission: "sammeln" }).grund, /Wracksammler/);
  r = FL.senden(z, p, { schiffe: { wracksammler: 2 }, ziel: alpha, mission: "sammeln" }, T0);
  assert.ok(r.ok, r.grund);
  assert.deepEqual({ ...alpha.truemmer.orbit }, { metall: 0, silizium: 0 }, "Orbit leer");
  assert.deepEqual({ ...alpha.truemmer.boden }, bodenA, "Boden-Schrott bleibt beim Besitzer");
  assert.equal(z.rohstoffe.metall - met0, orbitA.metall); assert.equal(z.rohstoffe.silizium - si0, orbitA.silizium);
  assert.equal(p.schiffe.wracksammler, 4);
  LOG("Nachsammlung Alpha: +", z.rohstoffe.metall - met0, "M +", z.rohstoffe.silizium - si0, "Si; Boden bleibt", JSON.stringify(alpha.truemmer.boden));
  // Beta MIT Wracksammlern
  const m1 = z.rohstoffe.metall, s1 = z.rohstoffe.silizium;
  r = FL.senden(z, p, { schiffe: { korvette: 4, zerstoerer: 3, kreuzer: 2, wracksammler: 2 }, ziel: beta, mission: "angriff" }, T0);
  assert.ok(r.ok, r.grund);
  b = z.letzterKampfbericht;
  assert.equal(b.sieger, "angreifer"); assert.ok(b.geborgen && b.geborgen.metall === b.truemmerOrbit.metall && b.geborgen.silizium === b.truemmerOrbit.silizium);
  assert.equal(b.angreifer.find((x) => x.id === "wracksammler").verloren, 0);
  assert.deepEqual({ ...beta.truemmer.orbit }, { metall: 0, silizium: 0 });
  assert.equal(beta.truemmer.boden.metall, b.schrottBoden.metall, "Boden nicht geborgen");
  const bt = b.beute || {}; // 0.19.0: Beute kommt zusätzlich ins Lager
  assert.equal(z.rohstoffe.metall - m1, b.geborgen.metall + (bt.metall || 0)); assert.equal(z.rohstoffe.silizium - s1, b.geborgen.silizium + (bt.silizium || 0));
  assert.match(SS.ui.kampfbericht.html(b), /Orbit geborgen/);
  LOG("Beta:", b.sieger, "Runden O/B", b.phasen[0].runden.length, b.phasen[1].runden.length, "Orbit-Trümmer", JSON.stringify(b.truemmerOrbit), "geborgen", JSON.stringify({ m: b.geborgen.metall, s: b.geborgen.silizium }), "Boden bleibt", JSON.stringify(beta.truemmer.boden));
  assert.equal(z.flotten.length, 0);
});

test("Totalverlust: Zivilschiffe der Angriffsflotte vernichtet; kein Zivil-Verlust im laufenden Kampf", () => {
  const { SS, z, p, FL } = setup();
  const g = z.gegner[1];
  g.verteidigung = { laserturm: 50 };
  const r = FL.senden(z, p, { schiffe: { kleine_drohne: 1, kleiner_frachter: 2, wracksammler: 1 }, ziel: g, mission: "angriff" }, T0);
  assert.ok(r.ok, r.grund);
  const b = z.letzterKampfbericht;
  assert.equal(b.sieger, "verteidiger"); assert.equal(b.zivil.angreiferVernichtet, true);
  assert.equal(b.angreifer.find((x) => x.id === "kleiner_frachter").nachher, 0);
  assert.equal(b.angreifer.find((x) => x.id === "wracksammler").nachher, 0);
  assert.equal(p.schiffe.kleiner_frachter, 4); assert.equal(p.schiffe.wracksammler, 3);
  assert.equal(b.geborgen, null);
  assert.match(SS.ui.kampfbericht.html(b), /Zivilschiffe der Angriffsflotte vernichtet/);
});

test("Verteidiger-Zivil: kämpft nicht, vernichtet erst wenn Orbit fällt; Hangar geschützt", () => {
  const { SS, z, p } = setup();
  const KA = SS.kern.kampf;
  p.schiffe = { kleiner_frachter: 3 }; p.verteidigung = {}; p.solarsatelliten = 2;
  let b = KA.simuliere(z, p, { angreifer: { kleine_drohne: 2 } });
  assert.equal(b.zivil.verteidigerVernichtet, true); assert.equal(b.sieger, "angreifer");
  assert.ok(b.orbit.find((x) => x.id === "kleiner_frachter").verloren === 3);
  p.schiffe = { kreuzer: 20, kleiner_frachter: 3 };
  b = KA.simuliere(z, p, { angreifer: { kleine_drohne: 2 } });
  assert.equal(b.zivil.verteidigerVernichtet, false);
  assert.equal(b.orbit.find((x) => x.id === "kleiner_frachter").verloren, 0);
  assert.equal(b.orbit.find((x) => x.id === "solarsatellit").verloren, 0);
});
