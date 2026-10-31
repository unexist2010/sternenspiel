// Kapitel 5 – Verteidigung (0.12.0): Daten, Verteidigungswerft-Bau, Offline, Master, Migration v9, Kampfkern (Orbit → Boden, Zwei-Hüllen, Trümmer/Schrott).
const test = require("node:test");
const assert = require("node:assert/strict");
const { ladeSpiel, speicherAttrappe } = require("./lade-spiel");

const STD = 3600000;
const T0 = Date.UTC(2026, 9, 31, 8, 0, 0);
const gleich = (a, b) => assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)));
const VIEL = { metall: 1e12, silizium: 1e12, rohoel: 1e12, kunststoff_t1: 1e9, kunststoff_t2: 1e9, kunststoff_t3: 1e9 };
function setup(geb = {}, roh = {}, fo = {}) {
  const SS = ladeSpiel();
  const z = SS.kern.zustand.neuerSpielstand({ jetzt: T0, name: "Test" });
  Object.assign(z.planeten[0].gebaeude, geb); Object.assign(z.rohstoffe, roh); Object.assign(z.forschung, fo);
  return { SS, z, p: z.planeten[0], P: SS.kern.produktion, Bau: SS.kern.bau, VT: SS.kern.verteidigung, KA: SS.kern.kampf, D: SS.DATEN };
}
const ALLE_FO = { energie: 20, laser: 20, ionen: 20, plasma: 20, graviton: 20, waffen: 20, schild: 20, panzerung: 20, roboter: 20, computer: 20, spionage: 20, hyperspace: 20, verbrennung: 20, impuls: 20, hyperraumantrieb: 20 };

test("Daten: 10 Anlagen (9 Verteidigung + Orbitalplattform), Gruppen, Bilder, gültige Bezüge", () => {
  const { D } = setup();
  assert.equal(D.verteidigung.length, D.VERTEIDIGUNG_ANZAHL_SOLL); assert.equal(D.verteidigung.length, 10);
  gleich(D.verteidigung.map((d) => d.id).sort(), ["festungsschild", "ionengeschuetz", "laserturm", "magnetkanone", "maschinennest", "orbitalverteidigungsplattform", "plasmaturm", "pulslaser", "raketenbatterie", "schildkuppel"]);
  const fs = require("fs"), path = require("path");
  for (const d of D.verteidigung) {
    assert.ok(fs.existsSync(path.join(__dirname, "..", d.bild)), d.id + " Bild");
    assert.ok(D.huellentypNachId(d.huelle), d.id);
    for (const w of Object.keys(d.waffen)) assert.ok(D.waffentypNachId(w), d.id + " " + w);
    for (const v of d.vor.forschung) assert.ok(D.forschungNachId(v.id), d.id + " " + v.id);
    assert.ok(d.vor.verteidigungswerft >= 1 && d.beschreibung && d.info, d.id);
    assert.ok(["orbit", "boden"].includes(d.phase), d.id);
  }
  assert.equal(D.verteidigungNachId("orbitalverteidigungsplattform").phase, "orbit");
  assert.equal(D.verteidigungNachId("schildkuppel").max, 1); assert.equal(D.verteidigungNachId("festungsschild").max, 1);
  assert.equal(D.verteidigungBild(D.verteidigungNachId("orbitalverteidigungsplattform"), 21), "assets/schiffe/orbitalverteidigungsplattform-6.png");
});

test("Waffenprofile: Raketen/Gatling/Railgun metallstark, Laser/Ionen energiestark; frühe Schiffe ohne Energiehülle", () => {
  const { D } = setup();
  const w = (id) => D.waffentypNachId(id).profil;
  for (const id of ["raketen", "gatling", "railgun"]) assert.ok(w(id).metall >= 0.7, id);
  for (const id of ["laser", "ionen"]) assert.ok(w(id).energie >= 1 && w(id).metall <= 0.3, id);
  for (const id of ["aufklaerer", "kleine_drohne", "mittlere_drohne", "schwere_drohne"]) {
    const s = D.schiffNachId(id); assert.ok(!Object.keys(s.waffen).some((x) => x === "laser" || x === "ionen"), id + " keine reinen Energiewaffen");
  }
  assert.equal(D.schiffNachId("aufklaerer").schild, 0); assert.equal(D.schiffNachId("kleine_drohne").schild, 0);
  assert.ok(D.schiffNachId("titan").schild > D.schiffNachId("kreuzer").schild);
});

test("Bau: ohne Verteidigungswerft gesperrt; Kosten, Einzel-Lieferung, Abbrechen, Ausbau-Sperre, max 1 Schild", () => {
  const { z, p, VT, P, Bau, D } = setup({}, VIEL, ALLE_FO);
  assert.equal(VT.pruefe(z, p, "raketenbatterie", 1).ok, false);
  assert.match(VT.pruefe(z, p, "raketenbatterie", 1).grund, /Verteidigungswerft/);
  p.gebaeude.verteidigungswerft = 10; p.gebaeude.roboterfabrik = 0;
  const m0 = z.rohstoffe.metall, d = D.verteidigungNachId("raketenbatterie");
  const r = VT.starte(z, p, "raketenbatterie", 3, T0);
  assert.ok(r.ok); assert.equal(z.rohstoffe.metall, m0 - 3 * d.kosten.metall);
  const st = VT.stueckMs(z, p, d);
  P.simuliereBis(z, T0 + st + 1);
  assert.equal(VT.anzahl(p, "raketenbatterie"), 1);
  assert.equal(Bau.pruefe(z, p, { art: "gebaeude", id: "verteidigungswerft" }).ok, false, "Ausbau gesperrt während Bau");
  const vorAb = z.rohstoffe.metall, ab = VT.abbrechen(z, p, 0, T0 + st + 1);
  assert.equal(ab.erstattet, 2); assert.equal(z.rohstoffe.metall - vorAb, 2 * d.kosten.metall);
  assert.equal(VT.pruefe(z, p, "schildkuppel", 2).ok, false, "höchstens 1");
  assert.ok(VT.starte(z, p, "schildkuppel", 1, T0).ok);
  assert.equal(VT.pruefe(z, p, "schildkuppel", 1).ok, false, "schon im Bau");
});

test("Offline + Master: simuliereBis liefert; Master sofort/kostenlos, Werft nötig", () => {
  const { z, p, VT, P, Bau } = setup({ verteidigungswerft: 1 }, VIEL, ALLE_FO);
  VT.starte(z, p, "maschinennest", 5, T0);
  P.simuliereBis(z, T0 + 1000 * STD);
  assert.equal(VT.anzahl(p, "maschinennest"), 5); assert.equal(p.verteidigungsauftraege.length, 0);
  assert.ok(z.statistik.verteidigungGebaut >= 5 || z.statistik.verteidigungGebaut === undefined);
  const s2 = setup({}, {}, {});
  s2.z.einstellungen.master = true;
  assert.equal(s2.VT.pruefe(s2.z, s2.p, "plasmaturm", 1).ok, false, "Master braucht Verteidigungswerft");
  s2.p.gebaeude.verteidigungswerft = 1;
  const r = s2.VT.starte(s2.z, s2.p, "plasmaturm", 4, T0);
  assert.ok(r.ok && r.sofort); assert.equal(s2.VT.anzahl(s2.p, "plasmaturm"), 4);
});

test("Migration v8 → v9: Orbitalplattform-Schiffe → Verteidigung, offene Werft-Aufträge erstattet", () => {
  const SS = ladeSpiel(), sp = speicherAttrappe(), PR = SS.kern.profile;
  const a = PR.erstelle(sp, { name: "Alt8", jetzt: T0 });
  const key = PR.spielstandSchluessel(a.profil.id);
  const v8 = JSON.parse(sp.getItem(key));
  v8.version = 8; v8.rohstoffe.metall = 0;
  delete v8.planeten[0].verteidigung; delete v8.planeten[0].verteidigungsauftraege; delete v8.planeten[0].truemmer;
  v8.planeten[0].schiffe = { orbitalverteidigungsplattform: 3, kreuzer: 2 };
  v8.planeten[0].werftauftraege = [{ art: "schiff", id: "orbitalverteidigungsplattform", name: "O", menge: 4, fertig: 1, stueckMs: 1000, stueckKosten: { metall: 10 }, start: T0, ende: T0 + 4000 }];
  sp.setItem(key, JSON.stringify(v8));
  const z = PR.ladeProfil(sp, a.profil.id).zustand;
  assert.equal(z.version, 9);
  gleich(z.planeten[0].schiffe, { kreuzer: 2 });
  gleich(z.planeten[0].verteidigung, { orbitalverteidigungsplattform: 3 });
  gleich(z.planeten[0].werftauftraege, []); assert.equal(z.rohstoffe.metall, 30);
  gleich(z.planeten[0].truemmer, { orbit: { metall: 0, silizium: 0 }, boden: { metall: 0, silizium: 0 } });
});

test("Kampf: Verteilung Startplatz/Hangar; simuliere ändert nichts; Orbit vor Boden", () => {
  const { z, p, KA, D } = setup({ raumflughafen: 1 });
  p.startplaetze = [{ buchstabe: "A", stufe: 1 }];
  p.schiffe = { kreuzer: 1000, kleiner_frachter: 50 };
  const vt = KA.verteilung(p);
  assert.ok(vt.kapazitaet > 0 && vt.kapazitaet < 1050);
  const sp = Object.values(vt.startplatz).reduce((s, n) => s + n, 0), hg = Object.values(vt.hangar).reduce((s, n) => s + n, 0);
  assert.equal(sp + hg, 1050); assert.ok(sp <= vt.kapazitaet);
  assert.ok((vt.startplatz.kreuzer || 0) > 0 && hg > 0, "Kampfschiffe zuerst auf Startplätze, Rest im Hangar (geschützt)");
  assert.equal(vt.startplatz.kleiner_frachter || 0, Math.max(0, vt.kapazitaet - 1000));
  p.verteidigung = { raketenbatterie: 20, orbitalverteidigungsplattform: 1 };
  const vorher = JSON.stringify(z);
  const b = KA.simuliere(z, p, { angreifer: { kleine_drohne: 30 } });
  assert.equal(JSON.stringify(z), vorher, "Simulation verändert den Spielstand nicht");
  gleich(b.phasen.map((x) => x.id), ["orbit", "boden"]);
  assert.ok(b.orbit.some((x) => x.id === "orbitalverteidigungsplattform"), "Plattform kämpft im Orbit");
  assert.ok(b.boden.some((x) => x.id === "raketenbatterie"), "Raketenbatterie am Boden");
  assert.equal(b.live.schnellfeuer, false);
});

test("Zwei-Hüllen: reine Laser-Flotte gegen Metall-Drohnen fast wirkungslos; Bonus nach Energie-Zusammenbruch", () => {
  const { KA, D, SS } = setup();
  const K = SS.BALANCE.KAMPF;
  const ohne = { energie: 0, energieJe: 0 }, mit = { energie: 0, energieJe: 10 }, voll = { energie: 100, energieJe: 10 };
  const laser = [{ anteil: 1, e: 1, m: 0.25 }], rail = [{ anteil: 1, e: 0.6, m: 1 }];
  assert.equal(KA.schaden(100, laser, ohne).e, 0); assert.equal(KA.schaden(100, laser, ohne).m, 25 * K.MALUS_NACH_ENERGIE, "ohne Energiehülle = wie gebrochen (t27u)");
  assert.equal(KA.schaden(100, rail, ohne).m, 100 * K.BONUS_NACH_ENERGIE, "Railgun-Bonus auch ohne Energiehülle (t27u)");
  assert.equal(KA.schaden(100, rail, mit).m, 100 * K.BONUS_NACH_ENERGIE, "Railgun-Bonus nach Zusammenbruch");
  assert.equal(KA.schaden(100, laser, mit).m, 25 * K.MALUS_NACH_ENERGIE, "Laser nach Zusammenbruch geschwächt");
  assert.equal(KA.schaden(100, rail, voll).m, 100, "kein Bonus solange Energiehülle steht");
  // Gleicher Kostenwert: Laser-Verteidigung vs Railgun-Verteidigung gegen Drohnen
  const sim = (def) => { const s = setup({ verteidigungswerft: 1 }); s.p.verteidigung = def; return s.KA.simuliere(s.z, s.p, { angreifer: { kleine_drohne: 200 } }); };
  const lt = D.verteidigungNachId("laserturm"), mk = D.verteidigungNachId("magnetkanone");
  const budget = 2e6, k = (d) => (d.kosten.metall || 0) + (d.kosten.silizium || 0);
  const bL = sim({ laserturm: Math.round(budget / k(lt)) }), bM = sim({ magnetkanone: Math.round(budget / k(mk)) });
  const eigen = (b) => b.boden.reduce((s, x) => s + x.verloren * k(SS.DATEN.verteidigungNachId(x.id)), 0);
  assert.ok(eigen(bM) < eigen(bL), "Magnetkanone verliert weniger Kostenwert als Laser gegen Metall-Drohnen");
  assert.ok(bM.phasen[1].runden.length <= bL.phasen[1].runden.length, "und ist schneller fertig");
});

test("Planetenschild absorbiert Bodenschaden; Reparatur + Schrott ≤ 50 %, Bergung 50–75 % / Orbit 80 %; anwenden", () => {
  const { z, p, KA, SS } = setup({ verteidigungswerft: 1 });
  const K = SS.BALANCE.KAMPF;
  p.verteidigung = { maschinennest: 50, schildkuppel: 1 };
  const b = KA.simuliere(z, p, { angreifer: { schwere_drohne: 40 } });
  assert.ok(b.schild && b.schild.start > 0);
  assert.ok(b.phasen[1].runden.some((r) => r.schildAbsorb > 0), "Schild fängt ab");
  assert.equal(b.quoten.reparatur, K.REPARATUR_GRUND); assert.ok(b.quoten.schrott <= 0.5);
  z.forschung.roboter = 50; z.forschung.panzerung = 50;
  const b2 = KA.simuliere(z, p, { angreifer: { schwere_drohne: 40 }, bergung: true });
  assert.equal(b2.quoten.schrott, 0.75); assert.equal(b2.quoten.orbit, 0.8); assert.equal(b2.quoten.reparatur, K.REPARATUR_MAX);
  assert.equal(KA.simuliere(z, p, { angreifer: { schwere_drohne: 40 } }).quoten.schrott, 0.5);
  const stark = KA.simuliere(z, p, { angreifer: { schlachtschiff: 200 } });
  for (const x of stark.boden) assert.equal(x.repariert + x.zerstoert, x.verloren);
  KA.anwenden(z, p, stark);
  assert.ok(p.truemmer.orbit.metall >= 0 && p.truemmer.boden.metall > 0, "Schrott am Boden");
  assert.ok((p.verteidigung.maschinennest || 0) < 50);
});

test("t27u: Planetenschild ohne Cooldown; Orbitalplattform 100 % wieder da außer bei Titan", () => {
  const { z, p, KA } = setup({ verteidigungswerft: 1 });
  p.verteidigung = { maschinennest: 10, schildkuppel: 1, orbitalverteidigungsplattform: 5 };
  const b = KA.simuliere(z, p, { angreifer: { schlachtschiff: 300 } });
  assert.ok(b.schild.gefallen && b.schild.wiederAktiv);
  const sk = b.boden.find((x) => x.id === "schildkuppel"); assert.equal(sk.verloren, 0, "Schild nie zerstört");
  const pf = b.orbit.find((x) => x.id === "orbitalverteidigungsplattform");
  assert.ok(pf.verloren > 0); assert.equal(pf.zerstoert, 0); assert.equal(b.plattformZerstoerer, false);
  KA.anwenden(z, p, b);
  assert.equal(p.verteidigung.orbitalverteidigungsplattform, 5); assert.equal(p.verteidigung.schildkuppel, 1);
  const t = KA.simuliere(z, p, { angreifer: { titan: 5 } });
  const pt = t.orbit.find((x) => x.id === "orbitalverteidigungsplattform");
  assert.equal(t.plattformZerstoerer, true); assert.ok(pt.verloren > 0 && pt.zerstoert > 0, "Titan zerstört Plattformen dauerhaft");
});
