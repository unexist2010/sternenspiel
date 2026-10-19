// Logik-Tests Grundgerüst (Node, ohne Abhängigkeiten): node --test tests/
const test = require("node:test");
const assert = require("node:assert/strict");
const { ladeSpiel, speicherAttrappe } = require("./lade-spiel");

const STD = 3600000;
const T0 = Date.UTC(2026, 9, 18, 12, 0, 0);
// vm-Objekte stammen aus einem anderen Realm → Vergleich über JSON
const gleich = (a, b) => assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)));
const nah = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b}`);
const neu = (SS, extra = {}) => SS.kern.zustand.neuerSpielstand({ jetzt: T0, ...extra });

test("Daten: 8 Rohstoffe laut Spezifikation, keine Lagergrenzen", () => {
  const SS = ladeSpiel();
  gleich([...SS.DATEN.rohstoffIds], ["metall", "silizium", "rohoel", "strom", "kunststoff_t1", "kunststoff_t2", "kunststoff_t3", "antimaterie"]);
  for (const id of SS.DATEN.rohstoffIds) assert.ok(id in SS.BALANCE.STARTBESTAND, "Startbestand " + id);
  assert.equal(SS.BALANCE.LAGER_GRUND, undefined, "keine Lagergrenzen (keine Speichergebäude)");
  assert.equal(SS.kern.produktion.lagerKapazitaet(), Infinity);
});

test("Weltraum: 1 Universum, 5 Sektoren, 300 Systeme, 12 Planeten je System = 3600 Planeten", () => {
  const SS = ladeSpiel();
  const W = SS.DATEN.weltraum;
  const u = W.universum();
  assert.equal(typeof u.name, "string");
  assert.equal(u.sektoren.length, 5);
  let systeme = 0, planeten = 0;
  const koords = new Set();
  for (const s of u.sektoren) {
    assert.equal(s.systemBis - s.systemVon + 1, 60, "60 Systeme je Sektor (ANNAHME)");
    for (let n = s.systemVon; n <= s.systemBis; n++) {
      const sys = W.system(n);
      assert.equal(sys.sektor, s.nummer);
      assert.equal(sys.planeten.length, 12);
      systeme++;
      sys.planeten.forEach((p, i) => { planeten++; assert.equal(p.position, i + 1); koords.add(p.koordinaten); });
    }
  }
  assert.equal(systeme, 300);
  assert.equal(planeten, 3600);
  assert.equal(koords.size, 3600, "Koordinaten eindeutig");
  assert.equal(W.anzahlPlaneten(), 3600);
  assert.equal(W.system(0), null); assert.equal(W.system(301), null); assert.equal(W.sektor(6), null); assert.equal(W.planet(1, 13), null);
  assert.equal(ladeSpiel().DATEN.weltraum.system(142).name, W.system(142).name, "deterministisch");
});

test("Weltraum: keine Planetengrößen/Feldlimits im Datenmodell", () => {
  const SS = ladeSpiel();
  const p = SS.DATEN.weltraum.planet(75, 6);
  for (const k of Object.keys(p)) assert.ok(!/groesse|größe|feld|felder|durchmesser/i.test(k), "verbotenes Feld: " + k);
});

test("Weltraum: Koordinaten lesen/prüfen", () => {
  const W = ladeSpiel().DATEN.weltraum;
  gleich(W.leseKoordinaten(" 2:75:6 "), { sektor: 2, system: 75, planet: 6 });
  assert.equal(W.leseKoordinaten("1:75:6"), null, "System 75 liegt nicht in Sektor 1");
  assert.equal(W.leseKoordinaten("6:1:1"), null);
  assert.equal(W.leseKoordinaten("1:1:13"), null);
  assert.equal(W.leseKoordinaten("abc"), null);
  assert.equal(W.koordinatenText({ sektor: 5, system: 300, planet: 12 }), "5:300:12");
});

test("Weltraum: zufällige Start-Koordinate ist immer gültig, deckt Universum ab, respektiert „besetzt“", () => {
  const W = ladeSpiel().DATEN.weltraum;
  const r = W.zufall(42);
  const sektoren = new Set();
  for (let i = 0; i < 2000; i++) {
    const k = W.zufaelligeKoordinate(r);
    assert.ok(W.leseKoordinaten(W.koordinatenText(k)), "gültig: " + W.koordinatenText(k));
    sektoren.add(k.sektor);
  }
  assert.equal(sektoren.size, 5);
  // Extremwerte der Zufallsquelle
  gleich(W.zufaelligeKoordinate(() => 0), { sektor: 1, system: 1, planet: 1 });
  gleich(W.zufaelligeKoordinate(() => 0.999999), { sektor: 5, system: 300, planet: 12 });
  const k = W.zufaelligeKoordinate(W.zufall(7), (x) => x.sektor !== 3);
  assert.equal(k.sektor, 3);
});

test("Menü: genau 8 Punkte in festgelegter Reihenfolge", () => {
  const SS = ladeSpiel();
  gleich(SS.DATEN.menue.map((m) => m.name), ["Übersicht", "Ressourcen", "Anlagen", "Forschung", "Werft", "Verteidigung", "Flotte", "Weltraum"]);
  const platzhalter = SS.DATEN.menue.filter((m) => m.platzhalter);
  gleich(platzhalter.map((m) => m.id), ["werft", "verteidigung", "flotte", "weltraum"]);
  assert.ok(SS.DATEN.menue.every((m) => !("kapitel" in m)), "keine Kapitelnummern an den Menüpunkten");
  assert.ok(!/Kapitel \d/.test(SS.DATEN.PLATZHALTER_TEXT), "neutraler Platzhaltertext");
});

test("Ressourcenleiste: Metall, Silizium, Rohöl, Strom, Kunststoff T1–T3 sichtbar; Antimaterie per Flag versteckt", () => {
  const SS = ladeSpiel();
  const z = neu(SS);
  gleich(z.freigeschaltet, { kunststoff_t1: true, kunststoff_t2: true, kunststoff_t3: true, antimaterie: false, kunststoffwerk_t2: false, kunststoffwerk_t3: false });
  gleich(SS.DATEN.sichtbareRohstoffe(z).map((r) => r.id), ["metall", "silizium", "rohoel", "strom", "kunststoff_t1", "kunststoff_t2", "kunststoff_t3"]);
  assert.equal(SS.DATEN.rohstoffe.length, 8);
  for (const id of SS.DATEN.rohstoffIds) assert.ok(id in z.rohstoffe, "Bestand existiert im Datenmodell: " + id);
  // alter Spielstand (v3, Kunststoff ausgeblendet) → nach Migration sichtbar, Antimaterie weiter versteckt
  const alt = JSON.parse(JSON.stringify(neu(SS))); alt.version = 3; alt.freigeschaltet = { kunststoff_t1: false, kunststoff_t2: false, kunststoff_t3: false, antimaterie: false };
  const m = SS.kern.zustand.migriere(alt);
  gleich(SS.DATEN.sichtbareRohstoffe(m).map((r) => r.id), ["metall", "silizium", "rohoel", "strom", "kunststoff_t1", "kunststoff_t2", "kunststoff_t3"]);
});

test("Startplätze: Konstanten + Datenmodell je Planet", () => {
  const SS = ladeSpiel();
  const K = SS.BALANCE.STARTPLAETZE;
  assert.equal(K.MAX_ANZAHL, 26); assert.equal(K.STUFE_MAX, 10);
  assert.equal(SS.DATEN.startplatzBuchstaben.join(""), "ABCDEFGHIJKLMNOPQRSTUVWXYZ");
  assert.equal(K.FREISCHALT_PUNKTE.length, 26); assert.equal(K.KAPAZITAET_JE_STUFE.length, 26);
  for (let i = 1; i < 26; i++) assert.ok(K.FREISCHALT_PUNKTE[i] > K.FREISCHALT_PUNKTE[i - 1], "Schwellen aufsteigend");
  const z = neu(SS);
  assert.equal(z.startplaetze, undefined, "Startplätze liegen jetzt am Planeten");
  assert.equal(z.planeten[0].startplaetze.length, 26);
  for (const sp of z.planeten[0].startplaetze) assert.equal(sp.stufe, 0);
  assert.equal(SS.BALANCE.STARTPLATZ, undefined, "alte Boni-Konstanten entfernt");
});

test("Daten: Andockpunkte für spätere Kapitel", () => {
  const SS = ladeSpiel();
  assert.ok(SS.DATEN.gebaeude.some((g) => g.id === "geologiestation"));
  for (const verboten of ["lager", "speicher", "allianzdepot", "roboterfabrik", "nanitenfabrik"]) assert.ok(!SS.DATEN.gebaeude.some((g) => g.id.includes(verboten)), "kein " + verboten);
  assert.equal(SS.DATEN.SCHIFFE_ANZAHL_SOLL, 23);
  assert.equal(SS.DATEN.WAFFENTYPEN_ANZAHL_SOLL, 5);
  assert.equal(SS.DATEN.HUELLENTYPEN_ANZAHL_SOLL, 2);
  assert.ok(Object.isFrozen(SS.BALANCE) && Object.isFrozen(SS.BALANCE.STARTPLAETZE), "Balance zentral & unveränderlich");
});

test("Neuer Spielstand: automatischer Start auf Hauptplanet (v5 mit Planet-Datensatz)", () => {
  const SS = ladeSpiel();
  const W = SS.DATEN.weltraum;
  const z = neu(SS, { name: "  Sandro ", zufall: W.zufall(1) });
  assert.equal(z.version, 6);
  assert.equal(z.name, "Sandro");
  assert.ok(!("startplatz" in z));
  assert.ok(W.leseKoordinaten(W.koordinatenText(z.heimat)), "gültige Koordinate");
  assert.equal(z.heimat.name, W.planet(z.heimat.system, z.heimat.planet).name);
  assert.equal(z.rohstoffe.metall, 500); assert.equal(z.rohstoffe.silizium, 300);
  const p = z.planeten[0];
  assert.equal(p.istHauptplanet, true); assert.equal(p.rohoelVorkommen, 1000000); assert.equal(p.geologie.naechsterFund, null); assert.equal(z.einstellungen.master, false); assert.equal(p.bauauftrag, null); assert.equal(p.solarsatelliten, 0);
  for (const d of SS.DATEN.gebaeude) assert.equal(p.gebaeude[d.id], 0, d.id);
  assert.equal(z.zeit.letzterTick, T0);
  gleich(z.flotten, []);
  assert.equal(z.punkte, 0);
  assert.equal(neu(SS, { planetName: " Terra Nova " }).heimat.name, "Terra Nova");
  assert.equal(neu(SS).name, "Kommandant");
  for (let i = 0; i < 50; i++) assert.ok(W.leseKoordinaten(W.koordinatenText(neu(SS).heimat)));
});

test("Produktion: ohne Gebäude nur Grundproduktion Hauptplanet (Metall 30, Silizium 15), 1 Stunde Ticks = Stundenrate", () => {
  const SS = ladeSpiel();
  const P = SS.kern.produktion;
  const z = neu(SS);
  const rate = P.produktionProStunde(z);
  gleich(rate, { metall: 30, silizium: 15, rohoel: 0, strom: 0, kunststoff_t1: 0, kunststoff_t2: 0, kunststoff_t3: 0, antimaterie: 0 });
  const start = { ...z.rohstoffe };
  for (let s = 1; s <= 3600; s++) P.tick(z, T0 + s * 1000);
  for (const id of SS.DATEN.rohstoffIds) nah(z.rohstoffe[id], start[id] + rate[id], 1e-6);
});

test("Produktion: unregelmäßige Ticks summieren sich exakt", () => {
  const SS = ladeSpiel();
  const P = SS.kern.produktion;
  const a = neu(SS), b = neu(SS);
  let t = T0; for (const d of [17, 999, 4000, 1, 60000, 333]) { t += d; P.tick(a, t); }
  P.tick(b, t);
  for (const id of SS.DATEN.rohstoffIds) nah(a.rohstoffe[id], b.rohstoffe[id]);
});

test("Produktion: Lager unbegrenzt, Zeit rückwärts schreibt nichts gut", () => {
  const SS = ladeSpiel();
  const P = SS.kern.produktion;
  const z = neu(SS);
  z.rohstoffe.metall = 1e7;
  P.tick(z, T0 + 10 * STD);
  nah(z.rohstoffe.metall, 1e7 + 300, 1e-3);
  const vorher = z.rohstoffe.silizium;
  P.tick(z, T0);
  assert.equal(z.rohstoffe.silizium, vorher);
  assert.equal(z.zeit.letzterTick, T0);
});

test("Offline-Fortschritt: 2 Stunden seit Speichern", () => {
  const SS = ladeSpiel();
  const { produktion: P, speicher: S } = SS.kern;
  const sp = speicherAttrappe();
  const z = neu(SS);
  S.speichere(sp, z, T0 + 10000);
  const nachSpeichern = { ...z.rohstoffe };
  const geladen = S.lade(sp).zustand;
  const off = P.offlineFortschritt(geladen, T0 + 10000 + 2 * STD);
  assert.equal(off.abwesendMs, 2 * STD);
  assert.equal(off.angerechnetMs, 2 * STD);
  assert.equal(off.gekappt, false);
  nah(geladen.rohstoffe.metall, nachSpeichern.metall + 2 * 30);
  nah(off.gewinne.silizium, 2 * 15);
  assert.equal(geladen.statistik.offlineMsGesamt, 2 * STD);
});

test("Offline-Fortschritt: auf 24 h gekappt", () => {
  const SS = ladeSpiel();
  const P = SS.kern.produktion;
  const z = neu(SS);
  const off = P.offlineFortschritt(z, T0 + 72 * STD);
  assert.equal(off.gekappt, true);
  assert.equal(off.angerechnetMs, SS.BALANCE.OFFLINE_MAX_STUNDEN * STD);
  nah(z.rohstoffe.metall, 500 + 24 * 30);
  assert.equal(z.zeit.letzterTick, T0 + 72 * STD);
});

test("Speichern/Laden: Rundreise, Zeitstempel, Löschen", () => {
  const SS = ladeSpiel();
  const S = SS.kern.speicher;
  const sp = speicherAttrappe();
  assert.equal(S.vorhanden(sp), false);
  gleich(S.lade(sp), { zustand: null, fehler: null });
  const z = neu(SS, { name: "Test" });
  z.planeten[0].gebaeude.geologiestation = 3;
  S.speichere(sp, z, T0 + 5000);
  assert.equal(S.vorhanden(sp), true);
  const r = S.lade(sp);
  assert.equal(r.fehler, null);
  assert.equal(r.zustand.zeit.zuletztGespeichert, T0 + 5000);
  gleich(r.zustand, z);
  S.loesche(sp);
  assert.equal(S.vorhanden(sp), false);
});

test("Speichern/Laden: beschädigte Spielstände", () => {
  const SS = ladeSpiel();
  const S = SS.kern.speicher;
  const sp = speicherAttrappe();
  const key = SS.BALANCE.SPEICHER_SCHLUESSEL;
  sp.setItem(key, "{kaputt");
  assert.equal(S.lade(sp).zustand, null); assert.match(S.lade(sp).fehler, /JSON/);
  sp.setItem(key, JSON.stringify({ version: 1 }));
  assert.match(S.lade(sp).fehler, /Felder/);
  sp.setItem(key, JSON.stringify({ version: 99, rohstoffe: {}, zeit: { letzterTick: T0 } }));
  assert.match(S.lade(sp).fehler, /neueren/);
});

test("Migration v2 → v5: Heimat behalten, Planet mit Gebäuden anlegen, Strom = Bilanz", () => {
  const SS = ladeSpiel();
  const S = SS.kern.speicher;
  const sp = speicherAttrappe();
  const v2 = {
    version: 2, name: "Sandro", erstelltAm: T0,
    startplatz: { buchstabe: "L", stufe: 15, schwerpunkt: "strom" },
    heimat: { sektor: 3, system: 133, planet: 5, name: "Rigo V" },
    freigeschaltet: { antimaterie: false },
    rohstoffe: { metall: 1234, strom: 50 },
    zeit: { letzterTick: T0, zuletztGespeichert: T0 },
    statistik: { produziertGesamt: {}, offlineMsGesamt: 5 },
    gebaeude: {}, lagerstaetten: null, forschung: {}, schiffe: {}, flotten: [], truemmerfelder: [], ereignisse: [],
    einstellungen: { schildAutoaktivierung: true }
  };
  sp.setItem(SS.BALANCE.SPEICHER_SCHLUESSEL, JSON.stringify(v2));
  const z = S.lade(sp).zustand;
  assert.equal(z.version, 6);
  assert.ok(!("startplatz" in z) && !("gebaeude" in z) && !("lagerstaetten" in z) && !("startplaetze" in z));
  gleich(z.heimat, { sektor: 3, system: 133, planet: 5, name: "Rigo V" });
  assert.equal(z.rohstoffe.metall, 1234); assert.equal(z.rohstoffe.strom, 0, "Strom-Bestand entfällt (Bilanz)");
  assert.equal(z.planeten.length, 1); assert.equal(z.planeten[0].istHauptplanet, true);
  assert.equal(z.planeten[0].gebaeude.metallmine, 0);
  assert.equal(z.freigeschaltet.kunststoff_t1, true); assert.equal(z.freigeschaltet.antimaterie, false);
  assert.equal(SS.kern.produktion.produktionProStunde(z).metall, 30);
});

test("Migration v1/v3 → v5 und Bereinigung von v5-Ständen", () => {
  const SS = ladeSpiel();
  const W = SS.DATEN.weltraum, Z = SS.kern.zustand;
  const v1 = { version: 1, name: "Alt", startplatz: { buchstabe: "D", stufe: 13, schwerpunkt: "strom" }, rohstoffe: { metall: 7 }, zeit: { letzterTick: T0 } };
  const z = Z.migriere(JSON.parse(JSON.stringify(v1)), W.zufall(3));
  assert.equal(z.version, 6);
  assert.ok(W.leseKoordinaten(W.koordinatenText(z.heimat)));
  assert.equal(z.rohstoffe.metall, 7);
  assert.equal(z.zeit.zuletztGespeichert, null);
  const z2 = Z.migriere({ version: 2, heimat: { sektor: 1, system: 999, planet: 1, name: "Alt" }, rohstoffe: {}, zeit: { letzterTick: T0 } });
  assert.ok(W.leseKoordinaten(W.koordinatenText(z2.heimat))); assert.equal(z2.heimat.name, "Alt");
  // v3: alte kostenlose Startplätze (A Stufe 1) werden verworfen
  const z3 = Z.migriere({ version: 3, heimat: z.heimat, rohstoffe: {}, zeit: { letzterTick: T0 }, punkte: 12,
    startplaetze: [{ buchstabe: "A", stufe: 99, freigeschaltet: true }] });
  assert.ok(z3.planeten[0].startplaetze.every((sp) => sp.stufe === 0)); assert.equal(z3.punkte, 12);
  // v5: Werte begrenzen, ungültigen Bauauftrag verwerfen, unbekannte Gebäude entfernen
  const v4 = JSON.parse(JSON.stringify(neu(SS)));
  Object.assign(v4.planeten[0].gebaeude, { metallmine: 99, raumflughafen: 5, roboterfabrik: 3, solarfarm: -2 });
  v4.planeten[0].regler.metallmine = 37; v4.planeten[0].startplaetze[1].stufe = 40;
  v4.planeten[0].bauauftrag = { art: "gebaeude", id: "gibtsnicht", start: T0, ende: T0 + 1, kosten: {} };
  const z4 = Z.migriere(v4).planeten[0];
  assert.equal(z4.gebaeude.metallmine, 99, "keine Obergrenze"); assert.equal(z4.gebaeude.raumflughafen, 1); assert.equal(z4.gebaeude.solarfarm, 0);
  assert.ok(!("roboterfabrik" in z4.gebaeude));
  assert.equal(z4.regler.metallmine, 40); assert.equal(z4.startplaetze[1].stufe, 10); assert.equal(z4.bauauftrag, null);
});

test("Format: deutsche Zahlen und Dauer", () => {
  const SS = ladeSpiel();
  assert.equal(SS.format.zahl(12345.9), "12.345");
  assert.equal(SS.format.dauer(2 * STD + 5 * 60000), "2 Std. 5 Min.");
});
