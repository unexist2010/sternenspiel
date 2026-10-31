// 0.21.0 (Sandro pt61u) – Start auf 1:50, KI rund um den Spieler, Rangliste.
const test = require("node:test");
const assert = require("node:assert/strict");
const { ladeSpiel } = require("./lade-spiel");
const T0 = Date.UTC(2026, 9, 31, 8, 0, 0), TAG = 86400000;

test("Neuer Spieler startet auf 1:50:(1–12)", () => {
  const SS = ladeSpiel();
  for (let i = 0; i < 20; i++) {
    const z = SS.kern.zustand.neuerSpielstand({ jetzt: T0 + i, name: "T" + i });
    assert.equal(z.heimat.sektor, 1); assert.equal(z.heimat.system, 50);
    assert.ok(z.heimat.planet >= 1 && z.heimat.planet <= 12);
  }
});

test("KI füllt rund um das Heimatsystem (auf- und abwärts), nahe zuerst; fern eher schwächer", () => {
  const SS = ladeSpiel(), KI = SS.kern.ki;
  const z = SS.kern.zustand.neuerSpielstand({ jetzt: T0, name: "T" }); z.punkte = 5000;
  KI.tick(z, T0);
  for (let d = 1; d <= 60; d++) KI.tick(z, T0 + d * TAG);
  const n = KI.npcs(z), ab = n.map((x) => Math.abs(x.system - 50));
  assert.ok(n.length > 100);
  assert.ok(n.some((x) => x.system < 50) && n.some((x) => x.system > 50), "beide Richtungen");
  assert.ok(n.every((x) => x.system !== 50), "Heimatsystem bleibt frei");
  const median = ab.slice().sort((a, b) => a - b)[Math.floor(ab.length / 2)];
  assert.ok(median <= 20, "Median-Abstand " + median);
  const frueh = n.slice(0, 20).map((x) => Math.abs(x.system - 50));
  assert.ok(Math.max(...frueh) <= 15, "erste KI nahe: " + frueh);
  const mittel = (l) => l.reduce((s, x) => s + x.ki.faktor, 0) / l.length;
  const nah = n.filter((x) => x.ki.art !== "rivale" && Math.abs(x.system - 50) <= 5), fern = n.filter((x) => x.ki.art !== "rivale" && Math.abs(x.system - 50) > 20);
  if (fern.length >= 5) assert.ok(mittel(fern) < mittel(nah), "fern schwächer");
  assert.equal(KI.abstandsFaktor(() => 0.99, 3), 1);
  assert.ok(KI.abstandsFaktor(() => 0.99, 30) < 1);
});

test("Rangliste: Kategorien, Spieler + KI + Alpha/Beta, Link ins Sonnensystem", () => {
  const SS = ladeSpiel(), R = SS.kern.rangliste;
  const z = SS.kern.zustand.neuerSpielstand({ jetzt: T0, name: "Sandro" }); z.punkte = 3000;
  z.planeten[0].gebaeude[SS.DATEN.gebaeude[0].id] = 5;
  SS.kern.ki.tick(z, T0);
  SS.kern.testphase.legeTestphaseAn(z, T0);
  assert.deepEqual([...R.KATEGORIEN.map((k) => k.id)], ["gesamt", "gebaeude", "forschung", "flotte", "verteidigung"]);
  for (const k of R.KATEGORIEN) {
    const l = R.liste(z, k.id, T0);
    assert.ok(l.some((e) => e.eigen));
    assert.ok(l.some((e) => e.art === "Rivale"));
    for (let i = 1; i < l.length; i++) assert.ok(l[i - 1].punkte[k.id] >= l[i].punkte[k.id]);
    l.forEach((e, i) => { assert.equal(e.platz, i + 1); assert.equal(e.link, "#weltraum/system/" + e.koord.system);
      assert.equal(e.punkte.gesamt, e.punkte.gebaeude + e.punkte.forschung + e.punkte.flotte + e.punkte.verteidigung); });
  }
  const ich = R.liste(z, "gebaeude", T0).find((e) => e.eigen);
  assert.ok(ich.punkte.gebaeude > 0); assert.equal(ich.koord.system, 50);
  const html = SS.ui.rangliste({ esc: (s) => String(s), box: (t, b) => b, zustand: () => z, teile: () => ["flotte"] }).seite();
  assert.match(html, /href="#weltraum\/system\/50"/);
  assert.match(html, /rl-tabelle/);
});
