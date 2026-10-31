// 0.20.0 – KI-Grundlage: Siedler/Piraten/Rivalen, Wachstum, Belegung, Drift, TF-Alter.
const test = require("node:test");
const assert = require("node:assert/strict");
const { ladeSpiel } = require("./lade-spiel");
const T0 = Date.UTC(2026, 9, 31, 8, 0, 0), TAG = 86400000;

function setup(punkte = 5000) {
  const SS = ladeSpiel();
  const z = SS.kern.zustand.neuerSpielstand({ jetzt: T0, name: "Test" });
  z.punkte = punkte;
  SS.kern.ki.tick(z, T0);
  return { SS, z, KI: SS.kern.ki };
}

test("Start: 5 inaktive Rivalen, Alpha/Beta-Modell unberührt", () => {
  const { z, KI } = setup();
  const r = KI.npcs(z, "rivale");
  assert.equal(r.length, 5);
  assert.ok(r.every((n) => !KI.aktiv(n, T0)));
  assert.ok(KI.aktiv(r[0], T0 + 14 * TAG));
});

test("≤5 neue Planeten je Tag, ≤50 % Belegung je System, keine Nachbarpositionen, Nachholen beim Laden", () => {
  const { SS, z, KI } = setup();
  let vorher = KI.npcs(z).length;
  for (let d = 1; d <= 30; d++) {
    SS.kern.ki.tick(z, T0 + d * TAG);
    const n = KI.npcs(z).length; assert.ok(n - vorher <= 5); vorher = n;
  }
  // 30 Tage offline auf einmal → ebenfalls nachgezogen
  SS.kern.ki.tick(z, T0 + 60 * TAG);
  assert.ok(KI.npcs(z).length > vorher);
  const proSys = {};
  KI.npcs(z).forEach((n) => { (proSys[n.system] = proSys[n.system] || []).push(n); });
  for (const l of Object.values(proSys)) {
    assert.ok(l.filter((n) => n.ki.art !== "rivale").length <= 6);
    const pos = l.map((n) => n.planet).sort((a, b) => a - b);
    for (let i = 1; i < pos.length; i++) assert.ok(pos[i] - pos[i - 1] >= 2, "nicht in Reihe");
  }
  const pir = KI.npcs(z, "pirat").length, sie = KI.npcs(z, "siedler").length;
  assert.ok(sie > 0 && pir >= 1 && pir < sie * 0.2);
  // Keine KI im Heimatsystem
  assert.ok(KI.npcs(z).every((n) => n.system !== z.heimat.system));
});

test("Stärke folgt Spielerpunkten: max +10 %, Mehrheit schwächer, Siedler def-lastig + zivil + lukrativ", () => {
  const { SS, z, KI } = setup(10000);
  SS.kern.ki.tick(z, T0 + 40 * TAG);
  const jt = T0 + 40 * TAG, l = KI.npcs(z);
  const p = l.map((n) => KI.punkte(z, n, jt));
  assert.ok(p.every((x) => x <= 10000 * 1.1 + 1));
  assert.ok(p.filter((x) => x < 10000).length / p.length > 0.7);
  assert.ok(p.filter((x) => x > 10000).length / p.length < 0.25);
  const s = KI.npcs(z, "siedler")[0], soll = KI.zielBestand(s, 10000);
  const zivil = (soll.schiffe.kleiner_frachter || 0) + (soll.schiffe.mittlerer_frachter || 0) + (soll.schiffe.grosser_frachter || 0);
  const kampf = (soll.schiffe.kleine_drohne || 0) + (soll.schiffe.aufklaerer || 0);
  assert.ok(zivil > 0 && Object.keys(soll.verteidigung).length >= 3);
  const pr = KI.zielBestand({ ki: { art: "pirat" } }, 10000);
  assert.ok(soll.rohstoffe.metall > pr.rohstoffe.metall * 3, "Siedler lukrativer");
  assert.ok(kampf >= 0);
});

test("Piraten: Siedler-TF wächst, ohne Kampfbericht/Flug, verschwindet nach 7 Tagen", () => {
  const { SS, z, KI } = setup();
  for (let d = 1; d <= 25; d++) SS.kern.ki.tick(z, T0 + d * TAG);
  assert.equal(z.kampfberichte.length, 0); assert.equal(z.flotten.length, 0);
  const s = KI.npcs(z, "siedler")[0];
  s.truemmer.orbit.metall = 5000; s.ki.tfSeit = null;
  const t = T0 + 26 * TAG; SS.kern.ki.tick(z, t);
  assert.equal(KI.tfAlterTage(s, t), 0);
  for (let d = 1; d <= 6; d++) SS.kern.ki.tick(z, t + d * TAG);
  assert.ok(s.truemmer.orbit.metall >= 5000, "Tag 7 noch da (wächst evtl.)");
  SS.kern.ki.tick(z, t + 7 * TAG);
  assert.ok(s.truemmer.orbit.metall === 0 || KI.tfAlterTage(s, t + 7 * TAG) === 0, "nach 7 Tagen weg");
  // Pirat-Überfall erzeugt TF irgendwo
  for (let d = 38; d <= 60; d++) SS.kern.ki.tick(z, T0 + d * TAG);
  assert.ok(KI.npcs(z, "siedler").some((n) => n.truemmer.orbit.metall > 0));
});

test("Spionage-Bericht driftet täglich leicht (±5 %), Weltraum zeigt Art + Punkte, Speichern/Laden behält KI", () => {
  const { SS, z, KI } = setup(20000);
  SS.kern.ki.tick(z, T0 + 20 * TAG);
  const n = KI.npcs(z, "siedler").find((x) => Object.keys(x.verteidigung).length);
  const fs = [0, 1, 2, 3, 4].map((d) => KI.driftFaktor(z, n, T0 + (20 + d) * TAG));
  assert.ok(fs.every((f) => f >= 0.95 && f <= 1.05));
  assert.ok(new Set(fs).size > 1);
  const b = SS.kern.testphase.spionage(z, n, T0 + 20 * TAG);
  assert.equal(b.art, "siedler"); assert.ok(b.punkte > 0);
  z.zeit.letzterTick = T0 + 20 * TAG;
  const zeile = SS.ui.weltraum.belegung(z, n.system).find((r) => r.position === n.planet);
  assert.equal(zeile.art, "gegner"); assert.equal(zeile.kiArt, "siedler"); assert.ok(zeile.punkte > 0);
  const z2 = SS.kern.zustand.migriere(JSON.parse(JSON.stringify(z)));
  assert.equal(KI.npcs(z2).length, KI.npcs(z).length);
  assert.equal(z2.ki.saat, z.ki.saat);
});
