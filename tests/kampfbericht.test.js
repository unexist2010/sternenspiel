// Kapitel Kampfsystem / Kampfbericht (0.14.0): Rundenprotokoll je Typ (Start + Verluste), Hüllen, Schaden, Waffeneinsatz; Bericht-HTML.
const test = require("node:test");
const assert = require("node:assert/strict");
const { ladeSpiel } = require("./lade-spiel");
const T0 = Date.UTC(2026, 9, 31, 8, 0, 0);
function setup() {
  const SS = ladeSpiel();
  const z = SS.kern.zustand.neuerSpielstand({ jetzt: T0, name: "Test" });
  z.planeten[0].gebaeude.verteidigungswerft = 1;
  return { SS, z, p: z.planeten[0], KA: SS.kern.kampf };
}

test("Rundenprotokoll: je Runde und Typ Start + Verluste; nächste Runde startet mit Rest", () => {
  const { z, p, KA } = setup();
  p.verteidigung = { raketenbatterie: 30, maschinennest: 20, orbitalverteidigungsplattform: 1 };
  const b = KA.simuliere(z, p, { angreifer: { schwere_drohne: 40 } });
  for (const ph of b.phasen) {
    ph.runden.forEach((r, i) => {
      for (const seite of ["angreifer", "verteidiger"]) {
        for (const x of r.gruppen[seite]) {
          assert.equal(x.start - x.verloren, x.rest, "Rest = Start − Verlust");
          assert.ok(x.verloren >= 0 && x.energie >= 0 && x.metall <= x.metallMax + 0.1);
          const n = ph.runden[i + 1] && ph.runden[i + 1].gruppen[seite].find((y) => y.id === x.id && y.art === x.art);
          if (n) assert.equal(n.start, x.rest, "nächste Runde beginnt mit Rest");
        }
      }
      assert.equal(r.angreifer, r.gruppen.angreifer.reduce((s, x) => s + x.rest, 0), "Summen rückwärtskompatibel");
      assert.ok(r.schaden.angreifer.e >= 0 && r.schaden.verteidiger.m >= 0);
    });
  }
  const r1 = b.phasen[0].runden[0];
  assert.ok(r1.gruppen.verteidiger.some((x) => x.id === "orbitalverteidigungsplattform"), "Orbital in Phase 1");
  assert.ok(r1.waffen.angreifer.length > 0 && r1.waffen.angreifer.every((w) => w.schuesse > 0), "Waffeneinsatz aggregiert");
  // Verluste über alle Runden = Gesamtverluste
  const verl = b.angreifer[0].verloren, rund = b.phasen.flatMap((ph) => ph.runden).reduce((s, r) => s + r.gruppen.angreifer.reduce((t, x) => t + x.verloren, 0), 0);
  assert.equal(rund, verl);
});

test("Phase 2 findet nur statt, wenn Angreifer Phase 1 übersteht", () => {
  const { z, p, KA } = setup();
  p.verteidigung = { orbitalverteidigungsplattform: 20, raketenbatterie: 10 };
  const b = KA.simuliere(z, p, { angreifer: { kleine_drohne: 1 } });
  assert.equal(b.angreifer[0].nachher, 0);
  assert.equal(b.phasen[1].stattgefunden, false); assert.equal(b.phasen[1].runden.length, 0);
  assert.equal(b.sieger, "verteidiger");
});

test("Bericht-HTML: Sieger, Verlustsumme, Phase 1/2, farbige Verluste, Details, Trümmer", () => {
  const { z, p, KA, SS } = setup();
  p.verteidigung = { raketenbatterie: 30, orbitalverteidigungsplattform: 1 };
  const html = SS.ui.kampfbericht.html(KA.simuliere(z, p, { angreifer: { schwere_drohne: 40 } }));
  assert.match(html, /data-sieger=/); assert.match(html, /Verluste Angreifer/); assert.match(html, /Verluste Verteidiger/);
  assert.match(html, /Phase 1 – Orbit/); assert.match(html, /Phase 2 – Boden/);
  assert.match(html, /kb-verlust kb-gegner/); assert.match(html, /kb-verlust kb-eigen/);
  assert.match(html, /<details class="kb-details">/); assert.match(html, /Hüllen nach Runde 1/); assert.match(html, /Waffeneinsatz/);
  assert.match(html, /Trümmerfelder/); assert.match(html, /Wracksammler/); assert.match(html, /Bodensammler/);
  assert.ok(html.indexOf("data-sieger") < html.indexOf("Phase 1") && html.indexOf("Phase 2") < html.indexOf("Trümmerfelder"), "Reihenfolge");
});
