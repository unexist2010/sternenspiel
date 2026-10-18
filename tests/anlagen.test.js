// Logik-Tests Kapitel 2 „Anlagen“ (Node): node --test tests/
const test = require("node:test");
const assert = require("node:assert/strict");
const { ladeSpiel, speicherAttrappe } = require("./lade-spiel");

const STD = 3600000;
const T0 = Date.UTC(2026, 9, 19, 8, 0, 0);
const gleich = (a, b) => assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)));
const nah = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) <= eps, `${a} ≈ ${b} (±${eps})`);
const w = (basis, n) => basis * n * Math.pow(1.1, n);

function setup(geb = {}, roh = {}) {
  const SS = ladeSpiel();
  const z = SS.kern.zustand.neuerSpielstand({ jetzt: T0, name: "Test" });
  Object.assign(z.planeten[0].gebaeude, geb);
  Object.assign(z.rohstoffe, roh);
  return { SS, z, p: z.planeten[0], P: SS.kern.produktion, Bau: SS.kern.bau };
}

test("Konstanten: Stufen bis 30 (Raumflughafen 1, Startplätze 15), Kostenfaktoren 1,5–2,0, Bauzeit-Hook = 1", () => {
  const { SS } = setup();
  assert.equal(SS.BALANCE.GEBAEUDE_MAX_STUFE, 30);
  assert.equal(SS.BALANCE.BAUZEIT.FAKTOR, 1);
  const ids = SS.DATEN.gebaeude.map((d) => d.id);
  gleich(ids, ["metallmine", "siliziummine", "bohrstation", "solarfarm", "oelverbrennung", "kunststoffwerk_t1", "kunststoffwerk_t2", "kunststoffwerk_t3",
    "geologiestation", "raumflughafen", "werft", "verteidigungswerft", "forschungseinrichtung"]);
  for (const d of SS.DATEN.gebaeude) {
    assert.ok(d.faktor >= 1.5 && d.faktor <= 2.0, d.id + " Faktor " + d.faktor);
    assert.ok(SS.DATEN.maxStufe(d) === (d.id === "raumflughafen" ? 1 : 30), d.id);
    assert.ok(d.bild.startsWith("assets/gebaeude/"), d.id + " eigenes Bild");
  }
  gleich(SS.DATEN.gebaeudeNachId("kunststoffwerk_t3").werk.input, { rohoel: 2000, silizium: 2000, metall: 750 }); // FEST (Beispiel Sandro)
});

test("Kostenformel: Basis · Faktor^(n−1), Bauzeit (Metall+Silizium)/2500 h, Mindestbauzeit", () => {
  const { SS, Bau } = setup();
  const mine = SS.DATEN.gebaeudeNachId("metallmine");
  gleich(Bau.gebaeudeKosten(mine, 1), { metall: 60, silizium: 15 });
  gleich(Bau.gebaeudeKosten(mine, 2), { metall: 90, silizium: 22 });
  gleich(Bau.gebaeudeKosten(mine, 10), { metall: Math.floor(60 * 1.5 ** 9), silizium: Math.floor(15 * 1.5 ** 9) });
  gleich(Bau.gebaeudeKosten(SS.DATEN.gebaeudeNachId("kunststoffwerk_t1"), 3), { metall: 1200, silizium: 800, rohoel: 400 });
  assert.equal(Bau.bauzeitMs({ metall: 60, silizium: 15 }), 108000); // 75 / 2500 h = 108 s
  assert.equal(Bau.bauzeitMs({ metall: 2500, silizium: 2500, rohoel: 99999 }), 2 * STD, "Rohöl zählt nicht (OGame: Deuterium zählt nicht)");
  assert.equal(Bau.bauzeitMs({ metall: 1 }), 5000, "Mindestbauzeit 5 s");
  assert.equal(Bau.punkteFuer({ metall: 1000, silizium: 500, rohoel: 500, kunststoff_t1: 500 }), 3);
});

test("Produktion je Stufe: Minen basis·n·1,1^n bei ausreichend Strom", () => {
  for (const n of [1, 5, 12]) {
    const { P, z } = setup({ metallmine: n, siliziummine: n, bohrstation: n, solarfarm: 20 });
    const r = P.uebersicht(z);
    assert.equal(r.strom.faktor, 1);
    nah(r.produktion.metall, 30 + w(30, n)); nah(r.produktion.silizium, 15 + w(20, n)); nah(r.produktion.rohoel, w(15, n));
    nah(r.strom.bedarf, w(10, n) * 2 + w(20, n)); nah(r.strom.erzeugung, w(20, 20));
  }
  const a = setup({ metallmine: 4, solarfarm: 20 }), b = setup({ metallmine: 5, solarfarm: 20 });
  assert.ok(b.P.uebersicht(b.z).produktion.metall > a.P.uebersicht(a.z).produktion.metall, "höhere Stufe = mehr");
});

test("Energiebilanz: Strommangel drosselt anteilig (Produktionsfaktor), Grundproduktion bleibt", () => {
  let { P, z } = setup({ metallmine: 5 });
  let r = P.uebersicht(z);
  assert.equal(r.strom.erzeugung, 0); assert.equal(r.strom.faktor, 0);
  nah(r.produktion.metall, 30, 1e-9);
  ({ P, z } = setup({ metallmine: 5, solarfarm: 1 }));
  r = P.uebersicht(z);
  const f = w(20, 1) / w(10, 5);
  nah(r.strom.faktor, f); nah(r.produktion.metall, 30 + w(30, 5) * f);
  nah(r.strom.bilanz, w(20, 1) - w(10, 5));
  assert.equal(z.rohstoffe.strom, 0, "Strom wird nicht gelagert");
  P.tick(z, T0 + STD); assert.equal(z.rohstoffe.strom, 0);
});

test("Solarsatelliten und Regler", () => {
  const { SS, P, z, p } = setup({ metallmine: 4 });
  p.solarsatelliten = 3;
  nah(P.uebersicht(z).strom.erzeugung, 3 * SS.BALANCE.SOLARSATELLIT_ENERGIE);
  p.regler.solarsatellit = 50;
  nah(P.uebersicht(z).strom.erzeugung, 1.5 * SS.BALANCE.SOLARSATELLIT_ENERGIE);
  p.solarsatelliten = 0; p.gebaeude.solarfarm = 20; p.regler.metallmine = 50;
  const r = P.uebersicht(z);
  nah(r.produktion.metall, 30 + w(30, 4) * 0.5); nah(r.strom.bedarf, w(10, 4) * 0.5);
});

test("Ölverbrennung: mehr Strom als Solarfarm, verbraucht laufend Rohöl, steht ohne Rohöl still (nie negativ)", () => {
  let { P, z } = setup({ oelverbrennung: 2 }, { rohoel: 1000 });
  for (const n of [1, 5, 15, 30]) assert.ok(w(40, n) > w(20, n));
  let r = P.uebersicht(z);
  nah(r.strom.erzeugung, w(40, 2)); nah(r.verbrauch.rohoel, w(10, 2));
  P.tick(z, T0 + STD);
  nah(z.rohstoffe.rohoel, 1000 - w(10, 2), 1e-6);
  ({ P, z } = setup({ oelverbrennung: 2 }, { rohoel: 0 }));
  r = P.uebersicht(z);
  assert.equal(r.strom.erzeugung, 0);
  P.tick(z, T0 + STD); assert.equal(z.rohstoffe.rohoel, 0);
  ({ P, z } = setup({ oelverbrennung: 2 }, { rohoel: 10 }));
  P.tick(z, T0 + STD);
  assert.ok(z.rohstoffe.rohoel >= 0 && z.rohstoffe.rohoel < 1e-9, "Bestand aufgebraucht, nicht negativ: " + z.rohstoffe.rohoel);
  // mit Bohrstation läuft sie anteilig aus der laufenden Förderung
  ({ P, z } = setup({ oelverbrennung: 3, bohrstation: 1, solarfarm: 2 }, { rohoel: 0 }));
  r = P.uebersicht(z);
  nah(r.strom.erzeugung, w(20, 2) + w(40, 3) * (w(15, 1) / w(10, 3))); nah(r.verbrauch.rohoel, w(15, 1));
});

test("Kunststoffwerke: Inputs je Einheit, Drosselung/Stopp bei Mangel, nie negativ", () => {
  // T1: 10 Rohöl je Einheit
  let { P, z } = setup({ kunststoffwerk_t1: 1, solarfarm: 5 }, { rohoel: 1000 });
  let r = P.uebersicht(z);
  nah(r.produktion.kunststoff_t1, w(2, 1)); nah(r.verbrauch.rohoel, w(2, 1) * 10);
  P.tick(z, T0 + STD);
  nah(z.rohstoffe.kunststoff_t1, w(2, 1), 1e-6); nah(z.rohstoffe.rohoel, 1000 - w(2, 1) * 10, 1e-6);
  // T2: Rohöl + Metall, T3: Rohöl + Silizium + Metall (2000/2000/750 je Einheit)
  ({ P, z } = setup({ kunststoffwerk_t2: 2, kunststoffwerk_t3: 1, solarfarm: 10 }, { rohoel: 1e6, metall: 1e6, silizium: 1e6 }));
  r = P.uebersicht(z);
  nah(r.produktion.kunststoff_t2, w(0.5, 2)); nah(r.produktion.kunststoff_t3, w(0.02, 1));
  nah(r.verbrauch.rohoel, w(0.5, 2) * 40 + w(0.02, 1) * 2000);
  nah(r.verbrauch.silizium, w(0.02, 1) * 2000); nah(r.verbrauch.metall, w(0.5, 2) * 20 + w(0.02, 1) * 750);
  // Mangel: kein Rohöl → Stopp
  ({ P, z } = setup({ kunststoffwerk_t1: 1, solarfarm: 5 }, { rohoel: 0 }));
  P.tick(z, T0 + STD);
  assert.equal(z.rohstoffe.kunststoff_t1, 0); assert.equal(z.rohstoffe.rohoel, 0);
  // Teilweise: 11 Rohöl reichen für die halbe Stunde
  ({ P, z } = setup({ kunststoffwerk_t1: 1, solarfarm: 5 }, { rohoel: 11 }));
  P.tick(z, T0 + STD);
  nah(z.rohstoffe.kunststoff_t1, 1.1, 0.03); assert.ok(z.rohstoffe.rohoel >= 0);
  // T3 ohne Silizium → steht, obwohl Rohöl/Metall da sind
  ({ P, z } = setup({ kunststoffwerk_t3: 3, solarfarm: 10 }, { rohoel: 1e6, metall: 1e6, silizium: 0 }));
  z.planeten[0].istHauptplanet = false; // keine Grundproduktion Silizium
  r = P.uebersicht(z);
  assert.equal(r.produktion.kunststoff_t3, 0);
  // Strommangel drosselt Werke wie Minen
  ({ P, z } = setup({ kunststoffwerk_t1: 1 }, { rohoel: 1000 }));
  assert.equal(P.uebersicht(z).produktion.kunststoff_t1, 0);
});

test("Kunststoffwerke teilen knappes Rohöl anteilig", () => {
  const { P, z } = setup({ kunststoffwerk_t1: 2, kunststoffwerk_t2: 2, bohrstation: 1, solarfarm: 10 }, { rohoel: 0, metall: 1e6 });
  const r = P.uebersicht(z);
  const bedarf = w(2, 2) * 10 + w(0.5, 2) * 40, zufluss = w(15, 1);
  nah(r.verbrauch.rohoel, zufluss, 1e-6);
  nah(r.produktion.kunststoff_t1 / w(2, 2), zufluss / bedarf, 1e-9);
  nah(r.produktion.kunststoff_t2 / w(0.5, 2), zufluss / bedarf, 1e-9);
});

test("Bohrstation/Geologiestation: Hauptplanet unbegrenzt, andere Planeten nur so viele Stufen wie Rohölfelder", () => {
  const { P, z, p } = setup({ bohrstation: 5, geologiestation: 2, solarfarm: 15 });
  assert.equal(P.nutzbareBohrStufe(p), 5);
  p.istHauptplanet = false; p.rohoelfelder = 2.7;
  assert.equal(P.nutzbareBohrStufe(p), 2);
  nah(P.uebersicht(z).produktion.rohoel, w(15, 2));
  p.istHauptplanet = true; p.rohoelfelder = 0;
  P.tick(z, T0 + STD);
  nah(p.rohoelfelder, w(0.1, 2), 1e-9);
});

test("Bauschleife: ein Auftrag je Planet, Kosten sofort, fertig zum Endzeitpunkt, Punkte, Abbrechen = volle Rückerstattung", () => {
  const { P, Bau, z, p } = setup({ solarfarm: 1 });
  const r1 = Bau.starte(z, p, { art: "gebaeude", id: "metallmine" }, T0);
  assert.equal(r1.ok, true);
  assert.equal(z.rohstoffe.metall, 440); assert.equal(z.rohstoffe.silizium, 285);
  assert.equal(p.bauauftrag.ende, T0 + 108000);
  const r2 = Bau.pruefe(z, p, { art: "gebaeude", id: "solarfarm" });
  assert.equal(r2.ok, false); assert.match(r2.grund, /bereits/);
  P.tick(z, T0 + 107000); assert.equal(p.gebaeude.metallmine, 0);
  P.tick(z, T0 + 108000); assert.equal(p.gebaeude.metallmine, 1); assert.equal(p.bauauftrag, null);
  nah(z.punkte, 0.075);
  const vorher = P.uebersicht(z).produktion.metall;
  assert.ok(vorher > 30, "Produktion steigt nach Fertigstellung");
  // Abbrechen
  const m = z.rohstoffe.metall, s = z.rohstoffe.silizium;
  Bau.starte(z, p, { art: "gebaeude", id: "metallmine" }, T0 + 108000);
  assert.ok(z.rohstoffe.metall < m);
  Bau.abbrechen(z, p);
  nah(z.rohstoffe.metall, m); nah(z.rohstoffe.silizium, s); assert.equal(p.bauauftrag, null);
  // Zu wenig Rohstoffe
  z.rohstoffe.metall = 10;
  const r3 = Bau.pruefe(z, p, { art: "gebaeude", id: "oelverbrennung" });
  assert.equal(r3.ok, false); assert.match(r3.grund, /Es fehlen: Metall 890/);
  // Höchststufe
  p.gebaeude.raumflughafen = 1;
  assert.match(Bau.pruefe(z, p, { art: "gebaeude", id: "raumflughafen" }).grund, /Höchststufe/);
});

test("Offline: Bau wird während der Abwesenheit fertig, Produktion abschnittsweise (vorher alte, danach neue Stufe)", () => {
  const { SS, P, Bau, z, p } = setup({ solarfarm: 1 });
  Bau.starte(z, p, { art: "gebaeude", id: "metallmine" }, T0);
  const sp = speicherAttrappe();
  SS.kern.speicher.speichere(sp, z, T0);
  const g = SS.kern.speicher.lade(sp).zustand;
  const off = P.offlineFortschritt(g, T0 + 2 * STD);
  assert.equal(g.planeten[0].gebaeude.metallmine, 1);
  assert.equal(off.fertig.length, 1); assert.equal(off.fertig[0].id, "metallmine");
  const vor = 30 * 0.03, nach = (30 + w(30, 1)) * (2 - 0.03);
  nah(g.rohstoffe.metall, 440 + vor + nach, 1e-6);
  // Bau endet nach 30 h, Abwesenheit 72 h: Bau fertig, Produktion nur 24 h (Kappung)
  const b = setup({ solarfarm: 3 });
  b.Bau.starte(b.z, b.p, { art: "gebaeude", id: "metallmine" }, T0);
  b.p.bauauftrag.ende = T0 + 30 * STD;
  const o2 = b.P.offlineFortschritt(b.z, T0 + 72 * STD);
  assert.equal(b.p.gebaeude.metallmine, 1); assert.equal(o2.angerechnetMs, 24 * STD);
  nah(b.z.rohstoffe.metall, 440 + 24 * (30 + w(30, 1)), 1e-6);
});

test("Unregelmäßige Ticks mit Gebäuden = ein großer Tick", () => {
  const a = setup({ metallmine: 3, siliziummine: 2, solarfarm: 2, kunststoffwerk_t1: 1, bohrstation: 2 }, { rohoel: 50 });
  const b = setup({ metallmine: 3, siliziummine: 2, solarfarm: 2, kunststoffwerk_t1: 1, bohrstation: 2 }, { rohoel: 50 });
  let t = T0; for (const d of [17, 999, 4000, 1, 60000, 333, 90000, 1234567]) { t += d; a.P.tick(a.z, t); }
  b.P.tick(b.z, t);
  for (const id of ["metall", "silizium", "rohoel", "kunststoff_t1"]) nah(a.z.rohstoffe[id], b.z.rohstoffe[id], 0.5);
});

test("Startplätze: Raumflughafen nötig, Freischaltung nach Punkten, Kosten deutlich steigend, Kapazität = Schiffe", () => {
  const { SS, P, Bau, z, p } = setup({}, { metall: 1e7, silizium: 1e7, rohoel: 1e7 });
  const K = SS.BALANCE.STARTPLAETZE;
  assert.match(Bau.pruefe(z, p, { art: "startplatz", buchstabe: "A" }).grund, /Raumflughafen/);
  p.gebaeude.raumflughafen = 1;
  assert.equal(Bau.pruefe(z, p, { art: "startplatz", buchstabe: "A" }).ok, true);
  assert.match(Bau.pruefe(z, p, { art: "startplatz", buchstabe: "B" }).grund, new RegExp("Gesperrt bis " + K.FREISCHALT_PUNKTE[1] + " Punkte"));
  z.punkte = K.FREISCHALT_PUNKTE[1];
  assert.equal(Bau.startplatzFrei(z, "B"), true); assert.equal(Bau.startplatzFrei(z, "C"), false);
  gleich(Bau.startplatzKosten("A", 1), { metall: 2000, silizium: 1000, rohoel: 500 });
  gleich(Bau.startplatzKosten("A", 2), { metall: 4000, silizium: 2000, rohoel: 1000 });
  gleich(Bau.startplatzKosten("B", 1), { metall: 2500, silizium: 1250, rohoel: 625 });
  assert.equal(Bau.startplatzKosten("A", 15).metall, 2000 * 2 ** 14);
  // über die Bauschleife bauen
  Bau.starte(z, p, { art: "startplatz", buchstabe: "A" }, T0);
  P.tick(z, p.bauauftrag.ende);
  assert.equal(p.startplaetze[0].stufe, 1);
  assert.equal(Bau.kapazitaet(p), K.KAPAZITAET_PRO_STUFE);
  p.startplaetze[0].stufe = 3; p.startplaetze[1].stufe = 2;
  assert.equal(Bau.kapazitaet(p), 5 * K.KAPAZITAET_PRO_STUFE);
  p.startplaetze[0].stufe = 15;
  assert.match(Bau.pruefe(z, p, { art: "startplatz", buchstabe: "A" }).grund, /Höchststufe 15/);
});

test("Forschungseinrichtung: Forschungszeit-Faktor 1/(1+Stufe) (nur Anzeige)", () => {
  const { Bau, p } = setup({ forschungseinrichtung: 3 });
  assert.equal(Bau.forschungszeitFaktor(p), 0.25);
});

test("Migration: Profil-Spielstand v3 wird beim Laden zu v4 (Kapitel 2), Rohstoffe bleiben", () => {
  const SS = ladeSpiel();
  const PR = SS.kern.profile, sp = speicherAttrappe();
  const a = PR.erstelle(sp, { name: "Alt", jetzt: T0 });
  const key = PR.spielstandSchluessel(a.profil.id);
  const v3 = JSON.parse(sp.getItem(key));
  Object.assign(v3, { version: 3, gebaeude: {}, lagerstaetten: null, startplaetze: [{ buchstabe: "A", stufe: 1, freigeschaltet: true }],
    freigeschaltet: { kunststoff_t1: false, kunststoff_t2: false, kunststoff_t3: false, antimaterie: false } });
  delete v3.planeten; v3.rohstoffe.metall = 4321; v3.rohstoffe.strom = 777;
  sp.setItem(key, JSON.stringify(v3));
  const z = PR.ladeProfil(sp, a.profil.id).zustand;
  assert.equal(z.version, 4); assert.equal(z.rohstoffe.metall, 4321); assert.equal(z.rohstoffe.strom, 0);
  assert.equal(z.planeten[0].istHauptplanet, true); assert.equal(z.freigeschaltet.kunststoff_t2, true);
  PR.speichereProfil(sp, a.profil.id, z, T0 + 1);
  assert.equal(JSON.parse(sp.getItem(key)).version, 4);
});
