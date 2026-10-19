// Logik-Tests Nachbesserung Kapitel 2 (0.7.0): Master-Modus, Geologie/Rohölvorkommen, Kunststoff-Rezepte + Sperre,
// Startplätze A–Z, Migration v4 → v5.  Aufruf: node --test tests/
const test = require("node:test");
const assert = require("node:assert/strict");
const { ladeSpiel, speicherAttrappe } = require("./lade-spiel");

const STD = 3600000, TAG = 24 * STD;
const T0 = Date.UTC(2026, 9, 19, 8, 0, 0);
const gleich = (a, b) => assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)));

function setup(geb = {}, roh = {}) {
  const SS = ladeSpiel();
  const z = SS.kern.zustand.neuerSpielstand({ jetzt: T0, name: "Test" });
  Object.assign(z.planeten[0].gebaeude, geb);
  Object.assign(z.rohstoffe, roh);
  z.planeten[0].geologie.zufall = 12345; // reproduzierbar
  return { SS, z, p: z.planeten[0], P: SS.kern.produktion, Bau: SS.kern.bau, G: SS.kern.geologie };
}

// ---------- Master ----------
test("Master: sofort fertig, keine Kosten, Knöpfe nie wegen Rohstoffen gesperrt, Punkte trotzdem", () => {
  const { Bau, z, p } = setup({}, { metall: 0, silizium: 0, rohoel: 0 });
  assert.equal(Bau.pruefe(z, p, { art: "gebaeude", id: "metallmine" }).ok, false, "ohne Master: fehlen Rohstoffe");
  Bau.masterSetzen(z, true, T0);
  assert.equal(z.einstellungen.master, true);
  const pr = Bau.pruefe(z, p, { art: "gebaeude", id: "oelverbrennung" });
  assert.equal(pr.ok, true); assert.equal(pr.ziel.bauzeit, 0);
  const r = Bau.starte(z, p, { art: "gebaeude", id: "oelverbrennung" }, T0);
  assert.equal(r.ok, true); assert.equal(r.sofort, true);
  assert.equal(p.gebaeude.oelverbrennung, 1); assert.equal(p.bauauftrag, null);
  gleich(z.rohstoffe.metall, 0); assert.equal(z.rohstoffe.silizium, 0, "nichts abgezogen");
  assert.ok(Math.abs(z.punkte - (900 + 360 + 180) / 1000) < 1e-9, "Punkte für Master-Bau (ANNAHME)");
  for (let i = 0; i < 9; i++) Bau.starte(z, p, { art: "gebaeude", id: "metallmine" }, T0);
  assert.equal(p.gebaeude.metallmine, 9, "mehrere Stufen direkt hintereinander");
});

test("Master: laufender Auftrag wird beim Einschalten sofort fertig; Sperren (Startplätze, T2/T3) ignoriert", () => {
  const { P, Bau, z, p } = setup({ solarfarm: 1 });
  Bau.starte(z, p, { art: "gebaeude", id: "metallmine" }, T0);
  assert.ok(p.bauauftrag);
  const fertig = Bau.masterSetzen(z, true, T0 + 1000);
  assert.equal(fertig.length, 1); assert.equal(p.gebaeude.metallmine, 1); assert.equal(p.bauauftrag, null);
  // Tick im Master stellt auch (z. B. aus altem Stand) laufende Aufträge sofort fertig
  Bau.masterSetzen(z, false, T0 + 1000);
  Bau.starte(z, p, { art: "gebaeude", id: "metallmine" }, T0 + 1000);
  z.einstellungen.master = true;
  P.tick(z, T0 + 2000);
  assert.equal(p.gebaeude.metallmine, 2);
  // Sperren
  assert.equal(Bau.pruefe(z, p, { art: "gebaeude", id: "kunststoffwerk_t3" }).ok, true, "T3 trotz Sperre");
  assert.match(Bau.pruefe(z, p, { art: "startplatz", buchstabe: "C" }).grund, /Raumflughafen/, "Raumflughafen bleibt nötig");
  p.gebaeude.raumflughafen = 1;
  assert.equal(Bau.pruefe(z, p, { art: "startplatz", buchstabe: "C" }).ok, true, "C ohne B10/Punkte");
  Bau.starte(z, p, { art: "startplatz", buchstabe: "Z" }, T0 + 3000);
  assert.equal(p.startplaetze[25].stufe, 1);
  // Master aus → Sperren wieder aktiv
  Bau.masterSetzen(z, false, T0 + 4000);
  z.punkte = 0; z.freigeschaltet.kunststoffwerk_t3 = false; // Master-Bauten haben Punkte gebracht → für die Prüfung zurücksetzen
  assert.match(Bau.pruefe(z, p, { art: "gebaeude", id: "kunststoffwerk_t3" }).grund, /Ab 5\.000 Punkten/);
});

// ---------- Geologie ----------
test("Geologie: Fundbereich je Stufe (FEST 1–2, ab 3 ×1,25 steigend)", () => {
  const { G } = setup();
  gleich(G.fundBereich(1), [50000, 100000]);
  gleich(G.fundBereich(2), [80000, 125000]);
  gleich(G.fundBereich(3), [100000, 156000]);
  for (let n = 3; n <= 30; n++) {
    const a = G.fundBereich(n - 1), b = G.fundBereich(n);
    assert.ok(b[0] > a[0] && b[1] > a[1] && b[1] > b[0], "Stufe " + n + " steigt");
  }
});

test("Geologie: alle 24 h ein Fund ab Bau, Menge im Bereich der Stufe, wird zum Vorkommen addiert", () => {
  const { P, Bau, z, p } = setup({ solarfarm: 3 }, { metall: 1e6, silizium: 1e6, rohoel: 1e6 });
  Bau.starte(z, p, { art: "gebaeude", id: "geologiestation" }, T0);
  const gebaut = p.bauauftrag.ende;
  P.tick(z, gebaut);
  assert.equal(p.gebaeude.geologiestation, 1); assert.equal(p.geologie.naechsterFund, gebaut + TAG);
  const v0 = p.rohoelVorkommen;
  let r = P.tick(z, gebaut + TAG - 1000);
  assert.equal(p.geologie.funde.length, 0, "vor Ablauf von 24 h kein Fund");
  r = P.tick(z, gebaut + TAG);
  assert.equal(r.funde.length, 1); assert.equal(p.geologie.funde.length, 1);
  const f = p.geologie.funde[0];
  assert.equal(f.zeit, gebaut + TAG); assert.equal(f.stufe, 1);
  assert.ok(f.menge >= 50000 && f.menge <= 100000, "Stufe 1: " + f.menge);
  assert.equal(p.rohoelVorkommen, v0 + f.menge);
  assert.equal(p.geologie.naechsterFund, gebaut + 2 * TAG);
  // Stufe 2 → größere Funde
  p.gebaeude.geologiestation = 2;
  P.tick(z, gebaut + 2 * TAG);
  const f2 = p.geologie.funde[1];
  assert.ok(f2.stufe === 2 && f2.menge >= 80000 && f2.menge <= 125000, "Stufe 2: " + f2.menge);
});

test("Geologie offline: mehrere Funde nachgeholt (auch jenseits der 24-h-Produktionskappung), ohne Station keine", () => {
  const { SS, P, z, p } = setup({ geologiestation: 1 });
  SS.kern.geologie.gebaut(p, T0);
  const sp = speicherAttrappe();
  SS.kern.speicher.speichere(sp, z, T0);
  const g = SS.kern.speicher.lade(sp).zustand, gp = g.planeten[0];
  const v0 = gp.rohoelVorkommen;
  const off = P.offlineFortschritt(g, T0 + 5 * TAG + 3 * STD);
  assert.equal(off.funde.length, 5, "5 volle Tage = 5 Funde");
  assert.equal(gp.geologie.funde.length, 5);
  gleich(gp.geologie.funde.map((f) => f.zeit), [1, 2, 3, 4, 5].map((d) => T0 + d * TAG));
  assert.equal(gp.rohoelVorkommen, v0 + gp.geologie.funde.reduce((s, f) => s + f.menge, 0));
  assert.equal(gp.geologie.naechsterFund, T0 + 6 * TAG);
  for (const f of gp.geologie.funde) assert.ok(f.menge >= 50000 && f.menge <= 100000);
  // ohne Geologiestation keine Funde
  const b = setup();
  b.P.offlineFortschritt(b.z, T0 + 10 * TAG);
  assert.equal(b.p.geologie.funde.length, 0); assert.equal(b.p.rohoelVorkommen, 1000000);
  // gleich viele Funde bei vielen kleinen Ticks
  const c = setup({ geologiestation: 1 }); c.G.gebaut(c.p, T0);
  let t = T0; while (t < T0 + 3 * TAG) { t += 7 * STD; c.P.tick(c.z, t); }
  assert.equal(c.p.geologie.funde.length, 3);
});

test("Geologie: Test-Fund (Master) sofort, 24-h-Takt bleibt; ohne Station nicht möglich", () => {
  const { G, z, p } = setup();
  assert.equal(G.fundAusloesen(p, T0).ok, false);
  p.gebaeude.geologiestation = 3; G.gebaut(p, T0);
  const r = G.fundAusloesen(p, T0 + 1000);
  assert.equal(r.ok, true); assert.equal(r.fund.test, true);
  assert.ok(r.fund.menge >= 100000 && r.fund.menge <= 156000);
  assert.equal(p.geologie.naechsterFund, T0 + TAG);
  assert.equal(z.planeten[0].rohoelVorkommen, 1000000 + r.fund.menge);
});

// ---------- Kunststoff ----------
test("Kunststoff: Rezepte T1/T2/T3 (FEST), Werk T2/T3 über Punkte freigeschaltet (500 / 5.000)", () => {
  const { SS, Bau, P, z, p } = setup({}, { metall: 1e7, silizium: 1e7, rohoel: 1e7, kunststoff_t1: 1e5, kunststoff_t2: 1e5 });
  gleich(SS.DATEN.gebaeudeNachId("kunststoffwerk_t1").werk.input, { rohoel: 10 });
  gleich(SS.DATEN.gebaeudeNachId("kunststoffwerk_t2").werk.input, { rohoel: 40, metall: 20 });
  gleich(SS.DATEN.gebaeudeNachId("kunststoffwerk_t3").werk.input, { rohoel: 1000, silizium: 500, metall: 500 });
  assert.equal(z.freigeschaltet.kunststoffwerk_t2, false); assert.equal(z.freigeschaltet.kunststoffwerk_t3, false);
  assert.equal(Bau.pruefe(z, p, { art: "gebaeude", id: "kunststoffwerk_t1" }).ok, true);
  for (const id of ["kunststoffwerk_t2", "kunststoffwerk_t3"]) {
    const r = Bau.pruefe(z, p, { art: "gebaeude", id });
    assert.equal(r.ok, false); assert.equal(r.grund, id === "kunststoffwerk_t2" ? "Ab 500 Punkten." : "Ab 5.000 Punkten.");
  }
  z.punkte = 499.9;
  assert.equal(Bau.pruefe(z, p, { art: "gebaeude", id: "kunststoffwerk_t2" }).ok, false);
  z.punkte = 500;
  assert.equal(Bau.pruefe(z, p, { art: "gebaeude", id: "kunststoffwerk_t2" }).ok, true, "500 Punkte schalten T2 frei");
  assert.equal(Bau.pruefe(z, p, { art: "gebaeude", id: "kunststoffwerk_t3" }).ok, false, "T3 erst ab 5.000");
  // Fertigstellung setzt das Flag dauerhaft
  Bau.starte(z, p, { art: "gebaeude", id: "kunststoffwerk_t1" }, T0);
  P.tick(z, T0 + 3600000);
  assert.equal(z.freigeschaltet.kunststoffwerk_t2, true); assert.equal(z.freigeschaltet.kunststoffwerk_t3, false);
  z.punkte = 5000; Bau.freischaltungenPruefen(z);
  assert.equal(z.freigeschaltet.kunststoffwerk_t3, true);
  z.punkte = 0;
  assert.equal(Bau.pruefe(z, p, { art: "gebaeude", id: "kunststoffwerk_t3" }).ok, true, "einmal frei bleibt frei");
  // Ressourcenleiste zeigt T2/T3 weiterhin
  assert.ok(SS.DATEN.sichtbareRohstoffe(z).some((r) => r.id === "kunststoff_t3"));
});

// ---------- Startplätze A–Z ----------
test("Startplätze A–Z: B erst nach A Stufe 10 UND Punkteschwelle; Gründe; Höchststufe 10", () => {
  const { SS, P, Bau, z, p } = setup({ raumflughafen: 1 }, { metall: 1e9, silizium: 1e9, rohoel: 1e9 });
  const K = SS.BALANCE.STARTPLAETZE;
  assert.equal(Bau.pruefe(z, p, { art: "startplatz", buchstabe: "A" }).ok, true);
  let st = Bau.startplatzStatus(z, p, "B");
  assert.equal(st.frei, false); assert.equal(st.grund, "A Stufe 10 nötig · " + K.FREISCHALT_PUNKTE[1] + " Punkte nötig");
  for (let i = 0; i < 10; i++) { Bau.starte(z, p, { art: "startplatz", buchstabe: "A" }, T0); P.tick(z, p.bauauftrag.ende); z.zeit.letzterTick = T0; }
  assert.equal(p.startplaetze[0].stufe, 10);
  assert.match(Bau.pruefe(z, p, { art: "startplatz", buchstabe: "A" }).grund, /Höchststufe 10/);
  z.punkte = K.FREISCHALT_PUNKTE[1] - 1;
  st = Bau.startplatzStatus(z, p, "B");
  assert.equal(st.frei, false); assert.equal(st.vorgaengerOk, true); assert.equal(st.grund, K.FREISCHALT_PUNKTE[1] + " Punkte nötig");
  z.punkte = K.FREISCHALT_PUNKTE[1];
  assert.equal(Bau.pruefe(z, p, { art: "startplatz", buchstabe: "B" }).ok, true);
  // C: Punkte reichen, aber B noch nicht Stufe 10
  z.punkte = 1e9;
  assert.equal(Bau.startplatzStatus(z, p, "C").grund, "B Stufe 10 nötig");
});

test("Startplätze: Kapazität A10 ≈ 100, alles bis Z10 ≈ 10 Mrd., wachsend; Kosten gering und steigend", () => {
  const { SS, Bau, p } = setup();
  const K = SS.BALANCE.STARTPLAETZE;
  assert.equal(Bau.kapazitaetBuchstabe("A", 10), 100);
  p.startplaetze.forEach((sp) => { sp.stufe = 10; });
  const gesamt = Bau.kapazitaet(p);
  assert.ok(Math.abs(gesamt - 1e10) / 1e10 < 0.01, "Gesamt ≈ 10 Mrd.: " + gesamt);
  for (let i = 1; i < 26; i++) assert.ok(K.KAPAZITAET_JE_STUFE[i] > K.KAPAZITAET_JE_STUFE[i - 1]);
  p.startplaetze.forEach((sp) => { sp.stufe = 0; }); p.startplaetze[0].stufe = 3; p.startplaetze[1].stufe = 2;
  assert.equal(Bau.kapazitaet(p), 3 * 10 + 2 * 20);
  gleich(Bau.startplatzKosten("A", 1), { metall: 400, silizium: 200, rohoel: 100 });
  gleich(Bau.startplatzKosten("A", 2), { metall: 540, silizium: 270, rohoel: 135 });
  gleich(Bau.startplatzKosten("B", 1), { metall: 600, silizium: 300, rohoel: 150 });
  assert.ok(Bau.startplatzKosten("Z", 10).metall > Bau.startplatzKosten("Y", 10).metall);
});

// ---------- Migration ----------
test("Migration v4 → v5 (Profil): Rohölvorkommen statt Felder, Startplätze A–Z (max. 10), Geologie-Takt, Sperr-Flags, Master aus", () => {
  const SS = ladeSpiel();
  const PR = SS.kern.profile, sp = speicherAttrappe();
  const a = PR.erstelle(sp, { name: "Vier", jetzt: T0 });
  const key = PR.spielstandSchluessel(a.profil.id);
  const v4 = JSON.parse(sp.getItem(key));
  v4.version = 4;
  v4.freigeschaltet = { kunststoff_t1: true, kunststoff_t2: true, kunststoff_t3: true, antimaterie: false };
  delete v4.einstellungen.master;
  const pl = v4.planeten[0];
  delete pl.rohoelVorkommen; delete pl.geologie; delete pl.hangar;
  pl.rohoelfelder = 3.5; pl.gebaeude.geologiestation = 2; pl.gebaeude.kunststoffwerk_t2 = 1;
  pl.startplaetze = "ABCDEFGHIJ".split("").map((b, i) => ({ buchstabe: b, stufe: i === 0 ? 15 : i === 1 ? 4 : 0 }));
  v4.zeit.letzterTick = T0;
  sp.setItem(key, JSON.stringify(v4));
  const z = PR.ladeProfil(sp, a.profil.id).zustand, p = z.planeten[0];
  assert.equal(z.version, 6);
  assert.ok(!("rohoelfelder" in p)); assert.equal(p.rohoelVorkommen, 1000000);
  assert.equal(p.startplaetze.length, 26); assert.equal(p.startplaetze[0].stufe, 10); assert.equal(p.startplaetze[1].stufe, 4);
  assert.equal(p.geologie.naechsterFund, T0 + TAG); assert.ok(Array.isArray(p.geologie.funde));
  assert.equal(z.freigeschaltet.kunststoffwerk_t2, false); assert.equal(z.freigeschaltet.kunststoffwerk_t3, false);
  assert.equal(p.gebaeude.kunststoffwerk_t2, 1, "bestehendes Werk bleibt");
  assert.equal(z.einstellungen.master, false);
  gleich(p.hangar, { schiffe: {} });
  // v5-Stand bleibt beim erneuten Laden gleich (Funde, Vorkommen, Master)
  p.rohoelVorkommen = 123; z.einstellungen.master = true;
  p.geologie.funde.push({ zeit: T0, stufe: 1, menge: 60000 });
  PR.speichereProfil(sp, a.profil.id, z, T0);
  const z2 = PR.ladeProfil(sp, a.profil.id).zustand;
  assert.equal(z2.planeten[0].rohoelVorkommen, 123); assert.equal(z2.einstellungen.master, true);
  assert.equal(z2.planeten[0].geologie.funde.length, 1);
});
