// 0.24.0 (Sandro pt72u) – Universums-Tempo: Produktion ×2, Bau- und Forschungszeiten ÷2.
const test = require("node:test");
const assert = require("node:assert/strict");
const { ladeSpiel } = require("./lade-spiel");
const T0 = Date.UTC(2026, 10, 1, 8, 0, 0);
function zwei() {
  const a = ladeSpiel(), b = ladeSpiel({ echt: true });
  const mk = (SS) => { const z = SS.kern.zustand.neuerSpielstand({ jetzt: T0, name: "T" }); Object.assign(z.planeten[0].gebaeude, { metallmine: 10, siliziummine: 10, solarfarm: 20 }); return z; };
  return { a, b, za: mk(a), zb: mk(b) };
}
test("Live-Werte: WIRTSCHAFT 2/2/2", () => {
  const W = ladeSpiel({ echt: true }).BALANCE.WIRTSCHAFT;
  assert.deepEqual([W.PRODUKTION_FAKTOR, W.BAU_TEMPO, W.FORSCHUNG_TEMPO], [2, 2, 2]);
});
test("Produktion verdoppelt (Minen + Grundproduktion)", () => {
  const { a, b, za, zb } = zwei();
  const pa = a.kern.produktion.produktionProStunde(za), pb = b.kern.produktion.produktionProStunde(zb);
  assert.ok(Math.abs(pb.metall - 2 * pa.metall) < 1e-6);
  assert.ok(Math.abs(pb.silizium - 2 * pa.silizium) < 1e-6);
});
test("Bauzeit und Forschungszeit halbiert", () => {
  const { a, b, za, zb } = zwei();
  const k = { metall: 50000, silizium: 25000 };
  assert.equal(b.kern.bau.bauzeitMs(k, zb), a.kern.bau.bauzeitMs(k, za) / 2);
  za.planeten[0].gebaeude.forschungseinrichtung = 1; zb.planeten[0].gebaeude.forschungseinrichtung = 1;
  assert.equal(b.kern.forschung.dauerMs(zb, k), a.kern.forschung.dauerMs(za, k) / 2);
});
