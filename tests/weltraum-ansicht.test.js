// 0.16.0 – Weltraum-Ansicht (Sektor → Sonnensystem → Planet): Belegung, Fenster, Deeplinks, Alpha/Beta.
const test = require("node:test");
const assert = require("node:assert/strict");
const { ladeSpiel } = require("./lade-spiel");
const T0 = Date.UTC(2026, 9, 31, 8, 0, 0);

function setup() {
  const SS = ladeSpiel();
  const z = SS.kern.zustand.neuerSpielstand({ jetzt: T0, name: "Test" });
  SS.kern.testphase.legeTestphaseAn(z, T0);
  return { SS, z, WR: SS.ui.weltraum, W: SS.DATEN.weltraum };
}

test("Menü Weltraum aktiv, 12 Positionen + Fenster mit 5 Sonnensystemen im Sektor", () => {
  const { SS, z, WR, W } = setup();
  assert.equal(SS.DATEN.menuePunkt("weltraum").platzhalter, false);
  const b = WR.belegung(z, z.heimat.system);
  assert.equal(b.length, 12);
  assert.deepEqual([...b.map((r) => r.position)], [1,2,3,4,5,6,7,8,9,10,11,12]);
  for (const n of [1, 30, 60, 61, 300]) {
    const f = WR.fenster(n), sk = W.sektor(W.sektorVonSystem(n));
    assert.equal(f.length, 5); assert.ok(f.includes(n));
    assert.ok(f.every((x) => x >= sk.systemVon && x <= sk.systemBis));
  }
});

test("Alpha/Beta erscheinen als Gegner, Heimat + Testkolonie als eigen, Rest leer", () => {
  const { z, WR } = setup();
  const b = WR.belegung(z, z.heimat.system);
  const gegner = b.filter((r) => r.art === "gegner").map((r) => r.koord).sort();
  assert.deepEqual([...gegner], [...z.gegner].map((x) => x.sektor + ":" + x.system + ":" + x.planet).sort());
  assert.equal(b.filter((r) => r.art === "eigen").length, 2);
  assert.equal(b.filter((r) => r.art === "leer").length, 8);
});

test("Spionage-Sonde und Angriff auf Alpha über die Deeplink-Aufträge funktionieren", () => {
  const { SS, z, W } = setup();
  const FL = SS.kern.flotte, p = z.planeten[0], a = z.gegner[0];
  const koord = W.koordinatenText(a);
  assert.equal(SS.ui.weltraum.link("angriff", koord), "#flotte/senden/angriff/" + koord);
  p.schiffe.spionagesonde = (p.schiffe.spionagesonde || 0) + 1;
  const r = FL.senden(z, p, { schiffe: { spionagesonde: 1 }, ziel: W.leseKoordinaten(koord), mission: "spionieren", ladung: {} }, T0);
  assert.equal(r.ok, true, r.grund);
});
