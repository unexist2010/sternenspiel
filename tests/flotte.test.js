// Kapitel 6 – Flotte (0.13.0): Presets, Startbahnen/Hangar, Senden, Flug, Rückkehr, keine Verteidigungsflotte während Flug, Migration v10.
const test = require("node:test");
const assert = require("node:assert/strict");
const { ladeSpiel } = require("./lade-spiel");

const T0 = Date.UTC(2026, 9, 31, 8, 0, 0);
const J = (a) => JSON.parse(JSON.stringify(a));
const sum = (o) => Object.values(o).reduce((s, n) => s + n, 0);
function setup() {
  const SS = ladeSpiel();
  const z = SS.kern.zustand.neuerSpielstand({ jetzt: T0, name: "Test" });
  const p = z.planeten[0];
  p.gebaeude.raumflughafen = 1; p.startplaetze = [{ buchstabe: "A", stufe: 1 }];
  z.rohstoffe.rohoel = 1e9;
  return { SS, z, p, FL: SS.kern.flotte, KA: SS.kern.kampf, W: SS.DATEN.weltraum };
}
const ziel = (z, d = 3) => ({ sektor: 0, system: z.heimat.system > 200 ? z.heimat.system - d : z.heimat.system + d, planet: 4 });
function zielK(SS, z, d) { const k = ziel(z, d); k.sektor = SS.DATEN.weltraum.sektorVonSystem(k.system); return k; }

test("Daten: 4 Presets, 6 Missionen, Standard-Preset, Spielstand v10", () => {
  const { SS, z, p, FL } = setup();
  assert.deepEqual(J(FL.PRESETS.map((x) => x.name)), ["Gesunder Mix", "Starke Energiehülle", "Starke Metallhülle", "Maximale Feuerkraft"]);
  assert.deepEqual(J(FL.MISSIONEN.map((x) => x.name)), ["Kolonisieren", "Transportieren", "Stationieren", "Spionieren", "Angriff", "Unterstützen"]);
  assert.equal(FL.preset(p), "gesunder_mix"); assert.equal(z.version, 10);
  assert.deepEqual(J(z.favoriten), []);
  assert.equal(SS.DATEN.menue.find((m) => m.id === "flotte").platzhalter, false);
});

test("Startbahnen: füllt Kapazität nach Preset, Rest im Hangar, Satelliten fliegen nicht", () => {
  const { SS, z, p, FL } = setup();
  const kap = SS.kern.bau.kapazitaet(p);
  p.schiffe = { kleine_drohne: kap, kreuzer: kap, kleiner_frachter: 10 }; p.solarsatelliten = 5;
  for (const pr of FL.PRESETS) {
    FL.setzePreset(p, pr.id);
    const sb = FL.startbahnen(z, p);
    assert.equal(sum(sb.startplatz), kap, pr.id + " füllt voll");
    assert.equal(sum(sb.startplatz) + sum(sb.hangar), 2 * kap + 10);
    assert.ok(!sb.startplatz.kleiner_frachter, pr.id + ": Kampfschiffe vor Frachtern");
  }
  FL.setzePreset(p, "max_feuerkraft"); assert.equal(FL.startbahnen(z, p).startplatz.kreuzer, kap);
  FL.setzePreset(p, "gesunder_mix"); const mix = FL.startbahnen(z, p).startplatz;
  assert.ok(mix.kreuzer > 0 && mix.kleine_drohne > 0, "Mix enthält beide");
  assert.equal(FL.setzePreset(p, "quatsch"), false);
});

test("Senden: Grenze = freie Startplätze, Prüfungen, Flug, Rückkehr gibt Plätze frei", () => {
  const { SS, z, p, FL } = setup();
  const kap = SS.kern.bau.kapazitaet(p);
  p.schiffe = { kreuzer: kap + 50, spionagesonde: 3, kolonieschiff: 1 };
  const k = zielK(SS, z);
  assert.equal(FL.pruefe(z, p, { schiffe: { kreuzer: kap + 1 }, ziel: k, mission: "angriff" }).ok, false, "über Kapazität");
  assert.match(FL.pruefe(z, p, { schiffe: { kreuzer: 1 }, ziel: k, mission: "spionieren" }).grund, /Spionagesonde/);
  assert.match(FL.pruefe(z, p, { schiffe: { kreuzer: 1 }, ziel: k, mission: "kolonisieren" }).grund, /Kolonieschiff/);
  assert.match(FL.pruefe(z, p, { schiffe: { kreuzer: 1 }, ziel: k, mission: "stationieren" }).grund, /eigenen Planeten/);
  assert.match(FL.pruefe(z, p, { schiffe: { kreuzer: 1 }, ziel: FL.herkunftKoord(z, p), mission: "transportieren" }).grund, /Startplanet/);
  assert.match(FL.pruefe(z, p, { schiffe: { solarsatellit: 1 }, ziel: k, mission: "angriff" }).grund, /nicht fliegen|Nicht genug/);
  const n = Math.max(1, Math.floor(kap * 0.7));
  const oel = z.rohstoffe.rohoel;
  const r = FL.senden(z, p, { schiffe: { kreuzer: n }, ziel: k, mission: "angriff" }, T0);
  assert.ok(r.ok, r.grund); assert.ok(r.dauer > 0 && r.rohoel > 0);
  assert.equal(z.rohstoffe.rohoel, oel - r.rohoel);
  assert.equal(p.schiffe.kreuzer, kap + 50 - n);
  assert.equal(FL.frei(z, p), kap - n, "Startplätze bleiben belegt");
  const sb = FL.startbahnen(z, p);
  assert.equal(sum(sb.startplatz), kap - n, "Rest-Startbahn neu nach Preset gefüllt");
  assert.equal(sb.verteidigt, false);
  assert.equal(FL.pruefe(z, p, { schiffe: { kreuzer: kap - n + 1 }, ziel: k, mission: "angriff" }).ok, false);
  // Ankunft → Rückflug → zurück
  let m = FL.faellige(z, T0 + r.dauer);
  assert.equal(z.flotten[0].phase, "rueck"); assert.equal(m.length, 1);
  assert.ok(FL.status(z.flotten[0], T0 + r.dauer + r.dauer / 2).prozent > 49);
  m = SS.kern.produktion.tick(z, T0 + 2 * r.dauer + 1000).fertig.filter((x) => x.art === "flotte");
  assert.equal(m.length, 1); assert.equal(z.flotten.length, 0);
  assert.equal(p.schiffe.kreuzer, kap + 50); assert.equal(FL.frei(z, p), kap);
});

test("Kampf: Flotte unterwegs → keine Verteidigungsflotte, nur Orbitalplattform + Boden", () => {
  const { SS, z, p, FL, KA } = setup();
  const kap = SS.kern.bau.kapazitaet(p);
  p.schiffe = { kreuzer: kap * 2 }; p.verteidigung = { orbitalverteidigungsplattform: 1, raketenbatterie: 10 };
  let vt = KA.verteilung(p, z); assert.equal(sum(vt.startplatz), kap);
  let b = KA.simuliere(z, p, { angreifer: { kleine_drohne: 5 } });
  assert.ok(b.orbit.some((x) => x.id === "kreuzer"));
  assert.ok(FL.senden(z, p, { schiffe: { kreuzer: 1 }, ziel: zielK(SS, z), mission: "transportieren" }, T0).ok);
  vt = KA.verteilung(p, z); assert.equal(sum(vt.startplatz), 0); assert.equal(vt.keineFlotte, true);
  b = KA.simuliere(z, p, { angreifer: { kleine_drohne: 5 } });
  assert.ok(!b.orbit.some((x) => x.id === "kreuzer"), "kein Kreuzer im Orbit");
  assert.ok(b.orbit.some((x) => x.id === "orbitalverteidigungsplattform"));
});

test("Flugzeit/Verbrauch/Entfernung, Favoriten, Master kostenlos, Migration v9 → v10", () => {
  const { SS, z, p, FL } = setup();
  assert.equal(FL.entfernung({ system: 1, planet: 1 }, { system: 11, planet: 1 }), 2700 + 950);
  assert.equal(FL.entfernung({ system: 1, planet: 1 }, { system: 1, planet: 4 }), 1015);
  assert.ok(FL.flugzeitMs(3650, 12500) > FL.flugzeitMs(1015, 12500));
  const k = zielK(SS, z);
  assert.equal(FL.favoritHinzu(z, k, "Ziel"), true); assert.equal(FL.favoritHinzu(z, k), false); assert.equal(z.favoriten.length, 1);
  z.einstellungen.master = true; p.schiffe = { kleine_drohne: 2 };
  assert.equal(FL.pruefe(z, p, { schiffe: { kleine_drohne: 1 }, ziel: k, mission: "angriff" }).rohoel, 0);
  // Migration
  const alt = JSON.parse(JSON.stringify(z)); alt.version = 9; delete alt.favoriten; delete alt.planeten[0].flotte;
  alt.flotten = [{ kaputt: 1 }];
  const m = SS.kern.zustand.migriere(alt);
  assert.equal(m.version, 10); assert.deepEqual(J(m.flotten), []); assert.deepEqual(J(m.favoriten), []); assert.equal(m.planeten[0].flotte.preset, "gesunder_mix");
});
