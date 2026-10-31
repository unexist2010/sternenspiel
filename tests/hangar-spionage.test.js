// 0.14.3 (Sandro t34u): Verteidiger-Zivil nur auf Startplätzen vernichtet, Hangar bleibt; Spionage zeigt Hangar nie, nur Bodenbewegungs-Hinweis.
const test = require("node:test");
const assert = require("node:assert/strict");
const { ladeSpiel } = require("./lade-spiel");
const T0 = Date.UTC(2026, 9, 31, 8, 0, 0);
function setup() {
  const SS = ladeSpiel();
  const z = SS.kern.zustand.neuerSpielstand({ jetzt: T0, name: "Test" });
  SS.kern.testphase.legeTestphaseAn(z, T0);
  return { SS, z, p: z.planeten[0], FL: SS.kern.flotte, TP: SS.kern.testphase };
}
// Kapazität so klein, dass Teil der Zivilschiffe im Hangar landet
function hangarGegner(SS, g) {
  g.schiffe = { kleine_drohne: 1, kleiner_frachter: 50, wracksammler: 7 };
  g.verteidigung = {}; g.solarsatelliten = 3;
  g.startplaetze = [{ buchstabe: "A", stufe: 1 }];
  const kp = SS.kern.testphase.kampfPlanet(g);
  return SS.kern.kampf.verteilung(kp.p, kp.z);
}

test("Orbit verloren: nur Startplatz-Zivil + Solarsatelliten vernichtet, Hangar bleibt", () => {
  const { SS, z, p, FL } = setup();
  const g = z.gegner[0];
  const vt = hangarGegner(SS, g);
  const hg = Object.values(vt.hangar).reduce((a, b) => a + b, 0);
  assert.ok(hg > 0, "Hangar belegt");
  const r = FL.senden(z, p, { schiffe: { kreuzer: 8 }, ziel: g, mission: "angriff" }, T0);
  assert.ok(r.ok, r.grund);
  const nachher = Object.values(g.schiffe).reduce((a, b) => a + b, 0);
  assert.equal(nachher, hg, "genau die Hangar-Schiffe überleben");
  for (const id of Object.keys(vt.hangar)) assert.equal(g.schiffe[id], vt.hangar[id]);
  assert.ok(!g.solarsatelliten, "Solarsatelliten (Orbit) vernichtet");
});

test("Spionage: Hangar nie gelistet, Hinweis Bodenbewegungen abhängig vom Hangar", () => {
  const { SS, z, p, FL } = setup();
  const g = z.gegner[0];
  const vt = hangarGegner(SS, g);
  let r = FL.senden(z, p, { schiffe: { spionagesonde: 1 }, ziel: g, mission: "spionieren" }, T0);
  assert.ok(r.ok, r.grund);
  let s = z.letzterSpionagebericht;
  assert.deepEqual(JSON.parse(JSON.stringify(s.schiffe)), JSON.parse(JSON.stringify(vt.startplatz)));
  assert.ok(!("hangar" in s));
  assert.equal(s.bodenbewegungen, true);
  assert.match(s.hinweis, /Bodenbewegungen erkennbar/);
  // Hangar leer
  const g2 = z.gegner[1];
  r = FL.senden(z, p, { schiffe: { spionagesonde: 1 }, ziel: g2, mission: "spionieren" }, T0);
  s = z.letzterSpionagebericht;
  assert.equal(s.bodenbewegungen, false);
  assert.equal(s.hinweis, "Keine Bodenbewegungen erkennbar.");
});
