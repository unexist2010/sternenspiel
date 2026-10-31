"use strict";
const test = require("node:test");
const assert = require("node:assert");
const lade = require("./lade-spiel.js"); const SS = typeof lade === "function" ? lade() : (lade.ladeSpiel ? lade.ladeSpiel() : lade);
const Bau = SS.kern.bau, FO = SS.kern.forschung, P = SS.kern.produktion, Z = SS.kern.zustand;

function neu() {
  const z = Z.neuerSpielstand({ name: "T", jetzt: 0, zufall: () => 0.5 });
  z.zeit.letzterTick = 0;
  return z;
}

test("Gebäude-Warteschlange: einreihen ohne Rohstoffe, max 10, Start erst mit Rohstoffen", () => {
  const z = neu(), p = z.planeten[0];
  Object.keys(z.rohstoffe).forEach((k) => { z.rohstoffe[k] = 0; });
  let r = Bau.beauftragen(z, p, { art: "gebaeude", id: "metallmine" }, 0);
  assert.ok(r.ok && r.eingereiht, "eingereiht trotz fehlender Rohstoffe");
  assert.equal(p.bauauftrag, null);
  for (let i = 0; i < 9; i++) assert.ok(Bau.beauftragen(z, p, { art: "gebaeude", id: "metallmine" }, 0).ok);
  assert.equal(p.bauschlange.length, 10);
  r = Bau.beauftragen(z, p, { art: "gebaeude", id: "siliziummine" }, 0);
  assert.ok(!r.ok && /voll/.test(r.grund));
  assert.equal(Bau.schlangeAnsicht(z, p)[9].stufe, (p.gebaeude.metallmine || 0) + 10);
  // Rohstoffe kommen → erster startet beim Tick
  z.rohstoffe.metall = 1e6; z.rohstoffe.silizium = 1e6; z.rohstoffe.rohoel = 1e6;
  P.tick(z, 1000);
  assert.ok(p.bauauftrag && p.bauauftrag.id === "metallmine");
  assert.equal(p.bauschlange.length, 9);
  // nach Fertigstellung rückt der nächste nach
  const ende = p.bauauftrag.ende, st = p.bauauftrag.stufe;
  P.tick(z, ende + 10);
  assert.ok(p.bauauftrag && p.bauauftrag.stufe === st + 1);
  assert.equal(p.bauschlange.length, 8);
  Bau.ausSchlangeEntfernen(z, p, 0);
  assert.equal(p.bauschlange.length, 7);
});

test("Forschungs-Warteschlange: max 5, Start erst mit Rohstoffen", () => {
  const z = neu(), p = z.planeten[0];
  p.gebaeude.forschungseinrichtung = 1;
  Object.keys(z.rohstoffe).forEach((k) => { z.rohstoffe[k] = 0; });
  const id = SS.DATEN.forschung.filter((f) => !f.vor.length)[0].id;
  for (let i = 0; i < 5; i++) assert.ok(FO.beauftragen(z, id, 0).ok);
  assert.ok(!FO.beauftragen(z, id, 0).ok, "6. Platz verboten");
  assert.equal(z.forschungsauftrag, null);
  P.tick(z, 500);
  assert.equal(z.forschungsauftrag, null, "wartet weiter ohne Rohstoffe");
  z.rohstoffe.metall = z.rohstoffe.silizium = z.rohstoffe.rohoel = 1e9;
  P.tick(z, 1000);
  assert.ok(z.forschungsauftrag && z.forschungsauftrag.id === id);
  assert.equal(z.forschungsschlange.length, 4);
});

test("Migration: alte Stände bekommen leere Warteschlangen; Startplatzkosten ×2, Bauzeit gleich", () => {
  const z = neu();
  delete z.forschungsschlange; delete z.planeten[0].bauschlange;
  const z2 = Z.migriere(JSON.parse(JSON.stringify(z)));
  assert.deepEqual(z2.forschungsschlange, []);
  assert.deepEqual(z2.planeten[0].bauschlange, []);
  assert.deepEqual(Bau.startplatzKosten("A", 1), { metall: 800, silizium: 400, rohoel: 200 });
  assert.equal(Bau.startplatzBauzeitMs(Bau.startplatzKosten("A", 5), z), Math.max(5000, Math.round(Bau.bauzeitMs({ metall: Bau.startplatzKosten("A", 5).metall / 2, silizium: Bau.startplatzKosten("A", 5).silizium / 2 }, z) / 11)));
});
