// 0.21.1 (Sandro pt62u) – Start-Siedler/Piraten, Rivalen über Sektor 1 verteilt, keine neuen Rivalen.
const test = require("node:test");
const assert = require("node:assert/strict");
const { ladeSpiel } = require("./lade-spiel");
const T0 = Date.UTC(2026, 9, 31, 8, 0, 0), TAG = 86400000;

for (let s = 0; s < 8; s++) test("Start Saat " + s + ": Siedler+Piraten sofort, 5 Rivalen in Sektor 1, 1–2 nah", () => {
  const SS = ladeSpiel(), KI = SS.kern.ki, jetzt = T0 + s * 7919;
  const z = SS.kern.zustand.neuerSpielstand({ jetzt, name: "T" }); z.punkte = 3000;
  KI.tick(z, jetzt);
  const heim = KI.heimSystem(z);
  assert.ok(KI.npcs(z, "siedler").length >= KI.K.START_SIEDLER);
  assert.ok(KI.npcs(z, "pirat").length >= KI.K.START_PIRATEN);
  const r = KI.npcs(z, "rivale");
  assert.equal(r.length, 5);
  assert.ok(r.every((n) => n.sektor === 1 && n.system >= 1 && n.system <= 60));
  const nah = r.filter((n) => Math.abs(n.system - heim) <= KI.K.RIVALEN_NAH_ABSTAND).length;
  assert.ok(nah >= 1 && nah <= 2, "nah=" + nah);
  for (let d = 1; d <= 20; d++) KI.tick(z, jetzt + d * TAG);
  assert.equal(KI.npcs(z, "rivale").length, 5, "keine neuen Rivalen");
});

test("Migration: alter Stand ohne v → Rivalen umverteilt, Start-Siedler ergänzt", () => {
  const SS = ladeSpiel(), KI = SS.kern.ki;
  const z = SS.kern.zustand.neuerSpielstand({ jetzt: T0, name: "T" }); z.punkte = 3000;
  KI.tick(z, T0);
  z.ki.npc = z.ki.npc.filter((n) => n.ki.art === "rivale"); z.ki.npc.forEach((n, i) => { n.system = 51 + i * 2; n.sektor = 1; });
  delete z.ki.v;
  const ids = z.ki.npc.map((n) => n.id).sort();
  KI.tick(z, T0);
  const r = KI.npcs(z, "rivale");
  assert.deepEqual(r.map((n) => n.id).sort(), ids);
  assert.ok(r.filter((n) => Math.abs(n.system - 50) <= KI.K.RIVALEN_NAH_ABSTAND).length <= 2);
  assert.ok(KI.npcs(z, "siedler").length >= KI.K.START_SIEDLER);
});
