// 0.23.1 (Sandro t68u) – 1 Punkt = 1000 verbrauchte Rohstoffe, ungewichtet; v12-Migration rechnet Punkte aus Bestand neu.
const test = require("node:test");
const assert = require("node:assert/strict");
const { ladeSpiel } = require("./lade-spiel");
const T0 = Date.UTC(2026, 10, 1, 8, 0, 0);

test("punkteFuer: alle Kosten-Rohstoffe 1:1, Strom zählt nicht", () => {
  const SS = ladeSpiel(), B = SS.kern.bau;
  assert.equal(B.punkteFuer({ metall: 400, silizium: 300, rohoel: 100, kunststoff_t1: 100, kunststoff_t2: 50, kunststoff_t3: 25, antimaterie: 25 }), 1);
  assert.equal(B.punkteFuer({ strom: 5000 }), 0);
});

test("Migration v11 → v12: Punkte aus Bestand (Gebäude, Forschung, Schiffe, Verteidigung) = Rangliste gesamt", () => {
  const SS = ladeSpiel(), Z = SS.kern.zustand, D = SS.DATEN;
  const z = Z.neuerSpielstand({ jetzt: T0, name: "P" }), p = z.planeten[0];
  p.gebaeude.metallmine = 10; p.gebaeude.siliziummine = 8;
  z.forschung[D.forschung[0].id] = 3;
  p.schiffe[D.schiffe.find((s) => s.id !== "solarsatellit").id] = 5;
  p.verteidigung[D.verteidigung[0].id] = 7;
  const alt = JSON.parse(JSON.stringify(z)); alt.version = 11; alt.punkte = 999999;
  const m = Z.migriere(alt);
  const r = SS.kern.rangliste.punkteSpieler(m, true);
  assert.ok(r.gebaeude > 0 && r.forschung > 0 && r.flotte > 0 && r.verteidigung > 0);
  assert.ok(Math.abs(m.punkte - r.gesamt) < 1e-9);
  const d = Math.floor(m.punkte) - SS.kern.rangliste.punkteSpieler(m).gesamt; assert.ok(d >= 0 && d <= 3, "nur Rundung je Kategorie: " + d);
  // v12-Stände behalten ihren Zähler
  const m2 = Z.migriere(JSON.parse(JSON.stringify(Object.assign(m, { punkte: 123 }))));
  assert.equal(m2.punkte, 123);
});
