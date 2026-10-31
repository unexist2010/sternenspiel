// 0.15.0 (Sandro pt36u): Expeditionen – Astrophysik, √-Limit, Haltezeit/Fundchance, Funde, Piraten ohne Totalverlust.
const test = require("node:test");
const assert = require("node:assert/strict");
const { ladeSpiel } = require("./lade-spiel");
const T0 = Date.UTC(2026, 9, 31, 8, 0, 0);
const sum = (o) => Object.values(o || {}).reduce((s, n) => s + n, 0);
function setup(astro) {
  const SS = ladeSpiel();
  const z = SS.kern.zustand.neuerSpielstand({ jetzt: T0, name: "Test" });
  SS.kern.testphase.legeTestphaseAn(z, T0);
  z.forschung.astrophysik = astro;
  const h = z.heimat, ziel = { sektor: h.sektor, system: h.system, planet: 13 };
  return { SS, z, p: z.planeten[0], FL: SS.kern.flotte, EX: SS.kern.expedition, ziel };
}
const fest = (werte) => { let i = 0; return () => werte[i++ % werte.length]; };

test("Freischaltung + Limit floor(√Stufe) + Haltezeit", () => {
  let { z, p, FL, EX, ziel } = setup(0);
  let r = FL.pruefe(z, p, { schiffe: { korvette: 1 }, ziel, mission: "expedition", halten: 1 });
  assert.equal(r.ok, false); assert.match(r.grund, /Astrophysik/);
  ({ z, p, FL, EX, ziel } = setup(4));
  assert.equal(EX.maxParallel(z), 2); assert.equal(EX.maxHalten(z), 4);
  assert.match(FL.pruefe(z, p, { schiffe: { korvette: 1 }, ziel, mission: "expedition", halten: 5 }).grund, /Haltezeit/);
  assert.match(FL.pruefe(z, p, { schiffe: { korvette: 1 }, ziel: { ...ziel, planet: 5 }, mission: "expedition", halten: 1 }).grund, /Expeditionsraum/);
  z.einstellungen.master = false; z.rohstoffe.rohoel = 1e9;
  for (let i = 0; i < 2; i++) assert.ok(FL.senden(z, p, { schiffe: { korvette: 1 }, ziel, mission: "expedition", halten: 2 }, T0).ok);
  r = FL.pruefe(z, p, { schiffe: { korvette: 1 }, ziel, mission: "expedition", halten: 1 });
  assert.match(r.grund, /Maximal 2/);
  assert.ok(EX.fundChance(4) > EX.fundChance(1));
  // Ablauf: hin → halten → rück
  const f = z.flotten[0]; FL.faellige(z, f.ankunft); assert.equal(f.phase, "halten"); assert.equal(f.haltEnde - f.ankunft, 2 * 3600000);
  FL.faellige(z, f.haltEnde); assert.equal(f.phase, "rueck"); assert.ok(f.ergebnis); assert.ok(z.letzteExpeditionen.length >= 1);
});

test("Rohstoff-Fund inkl. Kunststoff T2, gedeckelt an Punkte und Laderaum", () => {
  const { z, p, FL, EX, ziel } = setup(9);
  z.punkte = 1000; const cap = EX.cap(z); assert.equal(cap, 100000);
  const vorher = z.rohstoffe.kunststoff_t2;
  // r: fund(0)<chance, typ rohstoffe(0), größe 1(0.999), art → kunststoff_t2 (0.99)
  z._expeditionZufall = fest([0, 0, 0.999, 0.99]);
  const r = FL.senden(z, p, { schiffe: { mittlerer_frachter: 2 }, ziel, mission: "expedition", halten: 1 }, T0);
  assert.ok(r.ok, r.grund);
  assert.ok(z.rohstoffe.kunststoff_t2 > vorher && z.rohstoffe.kunststoff_t2 - vorher <= cap * 0.02 + 1);
});

test("Schiffsfund aus Pool baubar+1, kein Kolonieschiff", () => {
  const { z, p, FL, EX, ziel } = setup(1);
  const pool = EX.schiffPool(z).map((s) => s.id);
  assert.ok(!pool.includes("kolonieschiff") && !pool.includes("solarsatellit"));
  z._expeditionZufall = fest([0, 0.99, 0.5]);
  const vor = sum(p.schiffe);
  FL.senden(z, p, { schiffe: { korvette: 3 }, ziel, mission: "expedition", halten: 1 }, T0);
  assert.equal(z.letzteExpeditionen[0].art, "schiffe"); assert.ok(sum(p.schiffe) > vor);
});

test("Piraten: Kampf über Kampfkern, nie Totalverlust", () => {
  const { z, p, FL, ziel } = setup(1);
  // kein Fund (0.99), Piraten (0), Stärke max
  z._expeditionZufall = fest([0.99, 0, 0.99]);
  p.schiffe.spionagesonde = (p.schiffe.spionagesonde || 0) + 1;
  FL.senden(z, p, { schiffe: { spionagesonde: 1 }, ziel, mission: "expedition", halten: 1 }, T0);
  assert.equal(z.letzteExpeditionen[0].art, "piraten");
  assert.ok(z.letzterKampfbericht.expedition);
  assert.ok(p.schiffe.spionagesonde >= 1, "mind. 1 Schiff kommt heim");
});

// 0.15.1 (Sandro pt38u): Playtest-Fixes
test("0.15.1: Piraten-Rettung = Niederlage, Text + Bericht stimmig; Kampfberichte-Liste", () => {
  const { SS, z, p, FL, ziel } = setup(1);
  z._expeditionZufall = fest([0.99, 0, 0.99]);
  p.schiffe.spionagesonde = (p.schiffe.spionagesonde || 0) + 1;
  for (let i = 0; i < 12; i++) FL.senden(z, p, { schiffe: { spionagesonde: 1 }, ziel, mission: "expedition", halten: 1 }, T0 + i);
  const t = z.letzteExpeditionen[0].text, b = z.letzterKampfbericht;
  if (b.rettung) {
    assert.match(t, /Niederlage – .*entkomm/); assert.doesNotMatch(t, /Unentschieden|\b0 von/);
    const html = SS.ui.kampfbericht.html(b); assert.match(html, /Niederlage/); assert.match(html, /kb-rettung/);
  }
  assert.equal(z.kampfberichte.length, 10); assert.equal(z.kampfberichte[0], b);
});

test("0.15.1: Verzögerung – Normal ×2 Rückflug, Master ehrlich ohne Flugzeit-Lüge", () => {
  let { z, p, FL, ziel } = setup(1);
  z._expeditionZufall = fest([0.99, 0.4]);
  const r = FL.senden(z, p, { schiffe: { korvette: 1 }, ziel, mission: "expedition", halten: 1 }, T0);
  assert.ok(r.ok, r.grund); assert.match(z.letzteExpeditionen[0].text, /Master-Modus: entfällt/);
  ({ z, p, FL, ziel } = setup(1)); z.einstellungen.master = false; z.rohstoffe.rohoel = 1e9;
  z._expeditionZufall = fest([0.99, 0.4]);
  FL.senden(z, p, { schiffe: { korvette: 1 }, ziel, mission: "expedition", halten: 1 }, T0);
  const f = z.flotten[0]; FL.faellige(z, f.ankunft); FL.faellige(z, f.haltEnde);
  assert.match(f.ergebnis.text, /2× so lang/); assert.equal(f.rueckkehr - f.haltEnde, 2 * (f.ankunft - f.abflug));
});

test("0.15.1: Laderaum kappt Fund → „X gefunden, Y aufgenommen – Laderaum voll“", () => {
  const { z, p, FL, ziel } = setup(9);
  z.punkte = 1e7; z._expeditionZufall = fest([0, 0, 0.999, 0]);
  FL.senden(z, p, { schiffe: { korvette: 1 }, ziel, mission: "expedition", halten: 1 }, T0);
  assert.match(z.letzteExpeditionen[0].text, /gefunden, .* aufgenommen – Laderaum voll|kein Laderaum frei/);
});
