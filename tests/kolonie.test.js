// 0.18.0 (Sandro t49u): Balance-Fixes + Kolonisieren
const test = require("node:test");
const assert = require("node:assert");
const { ladeSpiel } = require("./lade-spiel");

function neu() {
  const SS = ladeSpiel();
  const z = SS.kern.zustand.neuerSpielstand({ jetzt: Date.now(), name: "T", zufall: () => 0.5 });
  return { SS, z };
}

test("Expeditionsanflug im eigenen System positionsunabhängig ≈ 60 min (Kleiner Frachter)", () => {
  const { SS, z } = neu(); const FL = SS.kern.flotte;
  const ds = [1, 6, 12].map((p) => FL.entfernung({ sektor: 1, system: 5, planet: p }, { sektor: 1, system: 5, planet: 13 }));
  assert.ok(ds.every((d) => d === ds[0]));
  const min = FL.flugzeitMs(ds[0], 12500) / 60000; assert.ok(min > 57 && min < 63, String(min));
  assert.ok(FL.flugzeitMs(ds[0], 12500 * 1.5) < FL.flugzeitMs(ds[0], 12500));
  assert.ok(FL.entfernung({ sektor: 1, system: 5, planet: 3 }, { sektor: 1, system: 6, planet: 13 }) > ds[0]);
});

test("Haltezeit erhöht Fundgröße, Startbestand Rohöl, Cap", () => {
  const { SS, z } = neu(); const EX = SS.kern.expedition;
  assert.ok(EX.groesseFaktor(10) > EX.groesseFaktor(1)); assert.equal(EX.groesseFaktor(100), 2);
  assert.equal(z.rohstoffe.rohoel, 600);
});

function kolonieSetup() {
  const { SS, z } = neu(); const FL = SS.kern.flotte;
  z.einstellungen.master = true; z.forschung = z.forschung || {}; z.forschung.astrophysik = 3;
  const hp = z.planeten[0]; hp.schiffe = { kolonieschiff: 2, kleiner_frachter: 3, korvette: 2 };
  hp.startplaetze.forEach((s) => (s.stufe = 5));
  z.rohstoffe.metall = 100000;
  return { SS, z, FL, hp };
}

test("Kolonisieren: Planet entsteht, Kolonieschiff verbraucht, Flotte + Ladung da, Limit", () => {
  const { SS, z, FL, hp } = kolonieSetup();
  assert.equal(SS.kern.kolonie.maxKolonien(z), 2);
  const h = z.heimat, ziel = { sektor: h.sektor, system: h.system, planet: h.planet === 7 ? 8 : 7 };
  const vorher = z.rohstoffe.metall;
  const r = FL.senden(z, hp, { schiffe: { kolonieschiff: 1, kleiner_frachter: 2, korvette: 1 }, ziel, mission: "kolonisieren", ladung: { metall: 5000 } }, Date.now());
  assert.ok(r.ok, r.grund);
  assert.equal(z.planeten.length, 2);
  const k = z.planeten[1];
  assert.deepEqual(JSON.parse(JSON.stringify(k.koordinaten)), ziel);
  assert.equal(k.schiffe.kolonieschiff, undefined);
  assert.equal(k.schiffe.kleiner_frachter, 2); assert.equal(k.schiffe.korvette, 1);
  assert.equal(z.rohstoffe.metall, vorher); // abgezogen + am Ziel entladen (gemeinsames Lager)
  assert.equal(z.flotten.length, 0);
  assert.equal(hp.schiffe.kolonieschiff, 1);
  // gleicher Platz nochmal → abgelehnt
  const r2 = FL.pruefe(z, hp, { schiffe: { kolonieschiff: 1 }, ziel, mission: "kolonisieren" });
  assert.ok(!r2.ok && /gehört dir/.test(r2.grund));
  // Limit: Astro 1 → 1 Kolonie
  z.forschung.astrophysik = 1;
  const r3 = FL.pruefe(z, hp, { schiffe: { kolonieschiff: 1 }, ziel: { ...ziel, planet: ziel.planet === 11 ? 10 : 11 }, mission: "kolonisieren" });
  assert.ok(!r3.ok && /Limit/.test(r3.grund), r3.grund);
  // Kolonie hat alle Gebäude (Stufe 0) und produziert Grundproduktion
  assert.deepEqual(Object.keys(k.gebaeude).sort(), Object.keys(hp.gebaeude).sort());
  assert.ok(SS.kern.produktion.uebersicht(z, k).netto.metall > 0);
  // 0.18.1: Startplatz A Stufe 1 → Kapazität > 0, Flotte kann von der Kolonie starten
  assert.equal(k.gebaeude.raumflughafen, 1); assert.equal(k.startplaetze[0].stufe, 1);
  assert.ok(SS.kern.bau.kapazitaet(k) > 0);
  const rk = FL.pruefe(z, k, { schiffe: { korvette: 1 }, ziel: { sektor: h.sektor, system: h.system, planet: h.planet }, mission: "stationieren" });
  assert.ok(rk.ok, rk.grund);
  // Speichern/Laden
  const kopie = JSON.parse(JSON.stringify(z)); SS.kern.zustand.migriere(kopie);
  assert.equal(kopie.planeten[1].kolonie, true); assert.equal(kopie.planeten[1].schiffe.korvette, 1);
});

test("Kolonisieren Position 13 nicht erlaubt", () => {
  const { z, FL, hp } = kolonieSetup();
  const r = FL.pruefe(z, hp, { schiffe: { kolonieschiff: 1 }, ziel: { sektor: z.heimat.sektor, system: z.heimat.system, planet: 13 }, mission: "kolonisieren" });
  assert.ok(!r.ok);
});
