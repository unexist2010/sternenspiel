// Kapitel 2 – Sandros Antworten (0.8.0): T2/T3 über Punkte, keine Gebäude-Obergrenze, Startplatz-Bauzeit / 11, große Zahlen.
const test = require("node:test");
const assert = require("node:assert/strict");
const { ladeSpiel } = require("./lade-spiel");

const STD = 3600000, TAG = 24 * STD;
const T0 = Date.UTC(2026, 9, 19, 8, 0, 0);
function setup(geb = {}, roh = {}) {
  const SS = ladeSpiel();
  const z = SS.kern.zustand.neuerSpielstand({ jetzt: T0, name: "Test" });
  Object.assign(z.planeten[0].gebaeude, geb);
  Object.assign(z.rohstoffe, roh);
  return { SS, z, p: z.planeten[0], P: SS.kern.produktion, Bau: SS.kern.bau };
}

test("Keine Gebäude-Obergrenze: Stufe 33+ baubar, Raumflughafen bleibt 1, Startplätze bleiben 10", () => {
  const { SS, Bau, P, z, p } = setup({ metallmine: 40, solarfarm: 35 }, { metall: 1e15, silizium: 1e15, rohoel: 1e15 });
  const r = Bau.pruefe(z, p, { art: "gebaeude", id: "metallmine" });
  assert.equal(r.ok, true, r.grund); assert.equal(r.ziel.stufe, 41);
  assert.ok(isFinite(r.ziel.kosten.metall) && r.ziel.kosten.metall > 1e8);
  Bau.starte(z, p, { art: "gebaeude", id: "metallmine" }, T0);
  P.tick(z, T0 + r.ziel.bauzeit + 1000);
  assert.equal(p.gebaeude.metallmine, 41);
  assert.equal(SS.DATEN.maxStufe(SS.DATEN.gebaeudeNachId("raumflughafen")), 1);
  p.gebaeude.raumflughafen = 1;
  assert.match(Bau.pruefe(z, p, { art: "gebaeude", id: "raumflughafen" }).grund, /Höchststufe 1/);
  p.startplaetze[0].stufe = 10;
  assert.match(Bau.pruefe(z, p, { art: "startplatz", buchstabe: "A" }).grund, /Höchststufe 10/);
  // Spielstand mit Stufe 120 bleibt beim Bereinigen erhalten
  p.gebaeude.metallmine = 120;
  const z2 = SS.kern.zustand.migriere(JSON.parse(JSON.stringify(z)));
  assert.equal(z2.planeten[0].gebaeude.metallmine, 120);
});

test("Startplatz-Bauzeit: OGame-Bauzeit / 11, Z Stufe 10 ≤ 365 Tage; andere Gebäude unverändert", () => {
  const { SS, Bau, z } = setup();
  assert.equal(SS.BALANCE.STARTPLAETZE.BAUZEIT_TEILER, 11);
  const kZ = Bau.startplatzKosten("Z", 10);
  const dauer = Bau.startplatzBauzeitMs(kZ, z);
  assert.ok(dauer <= 365 * TAG, "Z10 " + (dauer / TAG).toFixed(1) + " Tage");
  assert.ok(dauer > 300 * TAG, "nicht zu stark verkürzt");
  assert.ok(Math.abs(dauer - Bau.bauzeitMs(kZ, z) / 11) < 1000);
  // Faktor 10 hätte nicht gereicht (Begründung für 11)
  assert.ok(Bau.bauzeitMs(kZ, z) / 10 > 365 * TAG);
  // Gebäude unverändert (Metallmine Stufe 1: 1 Min. 48 Sek.)
  assert.equal(Bau.bauzeitMs(Bau.gebaeudeKosten(SS.DATEN.gebaeudeNachId("metallmine"), 1), z), 108000);
  // Ziel nutzt die verkürzte Zeit
  const p = z.planeten[0]; p.gebaeude.raumflughafen = 1;
  const zl = Bau.ziel(z, p, { art: "startplatz", buchstabe: "A" });
  assert.equal(zl.bauzeit, Math.max(5000, Math.round(Bau.bauzeitMs(Bau.startplatzKosten("A", 1), z) / 11)));
});

test("Zahlen-/Zeitformat kommt mit großen Werten klar", () => {
  const { SS } = setup();
  const F = SS.format;
  assert.equal(F.kurz(2.5e9), "2,5 Mrd."); assert.equal(F.kurz(3e12), "3 Bio."); assert.equal(F.kurz(4e15), "4 Brd.");
  assert.equal(F.kurz(5e18), "5 Trio."); assert.match(F.kurz(1.234e24), /10\^24/);
  assert.equal(F.zahl(1e15), "1.000.000.000.000.000");
  assert.equal(F.dauer(3 * TAG + 4 * STD), "3 T. 4 Std.");
  assert.equal(F.dauer(400 * TAG), "1 Jahr 35 T.");
  assert.equal(F.dauer(2 * STD + 5 * 60000), "2 Std. 5 Min.");
});

test("Kunststoffwerk T2/T3: Freischaltung über Punkte, Migration setzt Flags bei genug Punkten", () => {
  const { SS, Bau, z, p } = setup({}, { metall: 1e9, silizium: 1e9, rohoel: 1e9, kunststoff_t1: 1e6, kunststoff_t2: 1e6 });
  assert.deepEqual(JSON.parse(JSON.stringify(SS.BALANCE.KUNSTSTOFFWERK_FREISCHALT_PUNKTE)), { kunststoffwerk_t2: 500, kunststoffwerk_t3: 5000 });
  assert.equal(Bau.pruefe(z, p, { art: "gebaeude", id: "kunststoffwerk_t2" }).grund, "Ab 500 Punkten.");
  const alt = JSON.parse(JSON.stringify(z)); alt.version = 5; alt.punkte = 6000;
  const m = SS.kern.zustand.migriere(alt);
  assert.equal(m.version, 6);
  assert.equal(m.freigeschaltet.kunststoffwerk_t2, true); assert.equal(m.freigeschaltet.kunststoffwerk_t3, true);
});
