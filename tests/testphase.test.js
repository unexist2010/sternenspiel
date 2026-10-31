// 0.14.1 Testphase (Sandro t32u): Seed, Flug, Transport, Spionage, Angriff Orbit+Boden mit Kampfbericht.
const test = require("node:test");
const assert = require("node:assert/strict");
const { ladeSpiel } = require("./lade-spiel");
const T0 = Date.UTC(2026, 9, 31, 8, 0, 0);
const sum = (o) => Object.values(o || {}).reduce((s, n) => s + n, 0);
function setup() {
  const SS = ladeSpiel();
  const z = SS.kern.zustand.neuerSpielstand({ jetzt: T0, name: "Test" });
  SS.kern.testphase.legeTestphaseAn(z, T0);
  return { SS, z, p: z.planeten[0], FL: SS.kern.flotte, TP: SS.kern.testphase };
}

test("Seed: Master, 3 Planeten-Ziele, Gegner je ≤5 Einheiten, Favoriten, Migration v11", () => {
  const { SS, z, p, TP } = setup();
  assert.equal(z.einstellungen.master, true);
  assert.equal(z.gegner.length, 2);
  for (const g of z.gegner) assert.ok(sum(g.schiffe) + sum(g.verteidigung) <= 5 && sum(g.schiffe) + sum(g.verteidigung) > 0, g.name);
  assert.ok(sum(p.schiffe) >= 30 && sum(p.verteidigung) > 0);
  assert.equal(z.planeten.length, 2); assert.ok(z.planeten[1].koordinaten);
  assert.equal(z.favoriten.length, 3);
  assert.ok(TP.gegnerAn(z, z.gegner[0]));
  const m = SS.kern.zustand.migriere(JSON.parse(JSON.stringify(z)));
  assert.equal(m.version, 11); assert.equal(m.gegner.length, 2); assert.deepEqual(m.planeten[1].koordinaten, z.planeten[1].koordinaten);
  assert.equal(m.planeten[1].name, "Testkolonie");
  const alt = JSON.parse(JSON.stringify(SS.kern.zustand.neuerSpielstand({ jetzt: T0 }))); alt.version = 10; delete alt.gegner;
  assert.deepEqual(JSON.parse(JSON.stringify(SS.kern.zustand.migriere(alt).gegner)), []);
  SS.kern.testphase.legeTestphaseAn(z, T0); assert.equal(z.planeten.length, 2, "idempotent: kein dritter Planet");
});

test("Flottenflug + Transport zur Testkolonie (Master sofort)", () => {
  const { z, p, FL } = setup();
  const kol = z.planeten[1].koordinaten, vor = p.schiffe.korvette;
  let r = FL.senden(z, p, { schiffe: { korvette: 2 }, ziel: z.gegner[0], mission: "unterstuetzen" }, T0);
  assert.ok(r.ok, r.grund); assert.equal(z.flotten.length, 0); assert.equal(p.schiffe.korvette, vor);
  const met = z.rohstoffe.metall;
  r = FL.senden(z, p, { schiffe: { kleiner_frachter: 2 }, ziel: kol, mission: "transportieren", ladung: { metall: 1000 } }, T0);
  assert.ok(r.ok, r.grund); assert.equal(z.rohstoffe.metall, met); assert.equal(z.flotten.length, 0);
  assert.ok(r.meldungen.some((m) => /zurück/.test(m.text)));
  r = FL.senden(z, p, { schiffe: { kleiner_frachter: 1 }, ziel: kol, mission: "stationieren" }, T0);
  assert.ok(r.ok, r.grund); assert.equal(z.planeten[1].schiffe.kleiner_frachter, 2);
});

test("Spionage gegen Testgegner: Bericht mit Schiffen + Verteidigung", () => {
  const { z, p, FL } = setup();
  const r = FL.senden(z, p, { schiffe: { spionagesonde: 1 }, ziel: z.gegner[0], mission: "spionieren" }, T0);
  assert.ok(r.ok, r.grund);
  const s = z.letzterSpionagebericht;
  assert.ok(s && s.gegner === "alpha"); assert.deepEqual(JSON.parse(JSON.stringify(s.schiffe)), { kleine_drohne: 3, aufklaerer: 1 });
  assert.equal(s.verteidigung.raketenbatterie, 1);
  assert.equal(p.schiffe.spionagesonde, 5, "Sonde zurück");
  assert.ok(r.meldungen.some((m) => /Spionagebericht/.test(m.text)));
});

test("Angriff Alpha + Beta: Phase 1 Orbit + Phase 2 Boden, Runden, Trümmer, Verluste", () => {
  const { SS, z, p, FL } = setup();
  for (const g of [z.gegner[0], z.gegner[1]]) {
    const vorG = sum(g.schiffe) + sum(g.verteidigung);
    const r = FL.senden(z, p, { schiffe: { korvette: 4, zerstoerer: 3, kreuzer: 2 }, ziel: g, mission: "angriff" }, T0);
    assert.ok(r.ok, r.grund);
    const b = z.letzterKampfbericht;
    assert.ok(b && b.ziel.id === g.id);
    assert.equal(b.phasen.length, 2); assert.ok(b.phasen[0].runden.length > 0, "Orbit-Runden"); assert.ok(b.phasen[1].stattgefunden && b.phasen[1].runden.length > 0, "Boden-Runden");
    assert.ok(b.phasen[0].runden[0].gruppen.verteidiger.length > 0);
    assert.ok(b.truemmerOrbit.metall + b.schrottBoden.metall > 0, "Trümmer");
    assert.equal(b.sieger, "angreifer");
    assert.ok(sum(g.schiffe) + sum(g.verteidigung) < vorG, "Gegner-Verluste");
    assert.ok(g.truemmer.orbit.metall + g.truemmer.boden.metall > 0);
    const html = SS.ui.kampfbericht.html(b);
    assert.match(html, /Phase 1/); assert.match(html, /Phase 2/); assert.match(html, /Trümmerfelder/); assert.match(html, /Runde 1/);
  }
  assert.equal(z.flotten.length, 0, "Überlebende zurück");
  assert.equal(sum(p.schiffe) <= 49, true);
});
