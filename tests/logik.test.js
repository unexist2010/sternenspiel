// Logik-Tests Kapitel 1 (Node, ohne Abhängigkeiten): node --test tests/
const test = require("node:test");
const assert = require("node:assert/strict");
const { ladeSpiel, speicherAttrappe } = require("./lade-spiel");

const STD = 3600000;
const T0 = Date.UTC(2026, 9, 18, 12, 0, 0);
// vm-Objekte stammen aus einem anderen Realm → Vergleich über JSON
const gleich = (a, b) => assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)));
const nah = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b}`);
const neu = (SS, extra = {}) => SS.kern.zustand.neuerSpielstand({ jetzt: T0, ...extra });

test("Daten: 8 Rohstoffe laut Spezifikation", () => {
  const SS = ladeSpiel();
  gleich([...SS.DATEN.rohstoffIds], ["metall", "silizium", "rohoel", "strom", "kunststoff_t1", "kunststoff_t2", "kunststoff_t3", "antimaterie"]);
  for (const id of SS.DATEN.rohstoffIds) {
    assert.ok(id in SS.BALANCE.GRUNDPRODUKTION_PRO_STUNDE, "Produktion " + id);
    assert.ok(id in SS.BALANCE.STARTBESTAND, "Startbestand " + id);
    assert.ok(SS.BALANCE.LAGER_GRUND[id] > 0, "Lager " + id);
  }
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
  gleich(platzhalter.map((m) => m.id), ["ressourcen", "anlagen", "forschung", "werft", "verteidigung", "flotte", "weltraum"]);
  assert.ok(SS.DATEN.menue.every((m) => !("kapitel" in m)), "keine Kapitelnummern an den Menüpunkten");
  assert.ok(!/Kapitel \d/.test(SS.DATEN.PLATZHALTER_TEXT), "neutraler Platzhaltertext");
});

test("Ressourcenleiste: nur Metall, Silizium, Rohöl, Strom; Kunststoff T1–T3 + Antimaterie per Flag ausgeblendet", () => {
  const SS = ladeSpiel();
  const z = neu(SS);
  gleich(z.freigeschaltet, { kunststoff_t1: false, kunststoff_t2: false, kunststoff_t3: false, antimaterie: false });
  gleich(SS.DATEN.sichtbareRohstoffe(z).map((r) => r.id), ["metall", "silizium", "rohoel", "strom"]);
  assert.equal(SS.DATEN.rohstoffe.length, 8, "alle 8 Rohstoffe bleiben im Datenmodell");
  z.freigeschaltet.kunststoff_t2 = true; z.freigeschaltet.antimaterie = true;
  gleich(SS.DATEN.sichtbareRohstoffe(z).map((r) => r.id), ["metall", "silizium", "rohoel", "strom", "kunststoff_t2", "antimaterie"]);
  for (const id of SS.DATEN.rohstoffIds) assert.ok(id in z.rohstoffe, "Bestand existiert im Datenmodell: " + id);
  // alter v3-Spielstand ohne Kunststoff-Flags → nach Migration ausgeblendet
  const alt = JSON.parse(JSON.stringify(neu(SS))); alt.freigeschaltet = { antimaterie: false };
  const m = SS.kern.zustand.migriere(alt);
  gleich(SS.DATEN.sichtbareRohstoffe(m).map((r) => r.id), ["metall", "silizium", "rohoel", "strom"]);
});

test("Startplätze (Flotten-Startplattformen): Konstanten + Datenmodell-Platzhalter", () => {
  const SS = ladeSpiel();
  const K = SS.BALANCE.STARTPLAETZE;
  assert.equal(K.MAX_ANZAHL, 10);
  assert.equal(K.STUFE_MIN, 1); assert.equal(K.STUFE_MAX, 15);
  gleich([...SS.DATEN.startplatzBuchstaben], ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]);
  assert.equal(K.KAPAZITAET_PRO_STUFE, null, "Kapazität je Stufe noch offen");
  assert.equal(K.FREISCHALT_PUNKTE, null, "Punkteschwellen noch offen");
  const z = neu(SS);
  assert.equal(z.startplaetze.length, 10);
  gleich(z.startplaetze[0], { buchstabe: "A", stufe: 1, freigeschaltet: true });
  for (const sp of z.startplaetze.slice(1)) gleich({ s: sp.stufe, f: sp.freigeschaltet }, { s: 0, f: false });
  assert.equal(SS.DATEN.startplatzRegeln.length, 7);
  assert.equal(SS.DATEN.startplatzNachBuchstabe, undefined, "alte Startplatz-Wahl A–Z entfernt");
  assert.equal(SS.DATEN.startplaetze, undefined, "alte Startplatz-Liste entfernt");
  assert.equal(SS.BALANCE.STARTPLATZ, undefined, "alte Boni-Konstanten entfernt");
  assert.equal(SS.kern.produktion.startplatzMultiplikator, undefined, "Boni-Formel entfernt");
});

test("Daten: Andockpunkte für spätere Kapitel", () => {
  const SS = ladeSpiel();
  assert.ok(SS.DATEN.gebaeude.some((g) => g.id === "geologiestation"));
  assert.equal(SS.DATEN.SCHIFFE_ANZAHL_SOLL, 23);
  assert.equal(SS.DATEN.WAFFENTYPEN_ANZAHL_SOLL, 5);
  assert.equal(SS.DATEN.HUELLENTYPEN_ANZAHL_SOLL, 2);
  assert.ok(Object.isFrozen(SS.BALANCE) && Object.isFrozen(SS.BALANCE.STARTPLAETZE), "Balance zentral & unveränderlich");
});

test("Neuer Spielstand: automatischer Start auf Hauptplanet, ohne Auswahl", () => {
  const SS = ladeSpiel();
  const W = SS.DATEN.weltraum;
  const z = neu(SS, { name: "  Sandro ", zufall: W.zufall(1) });
  assert.equal(z.version, 3);
  assert.equal(z.name, "Sandro");
  assert.ok(!("startplatz" in z), "kein Startplatz-Feld (alte Wahl) mehr");
  assert.ok(W.leseKoordinaten(W.koordinatenText(z.heimat)), "gültige Koordinate");
  assert.equal(z.heimat.name, W.planet(z.heimat.system, z.heimat.planet).name);
  assert.equal(z.rohstoffe.metall, 500);
  assert.equal(z.zeit.letzterTick, T0);
  gleich(z.gebaeude, {}); gleich(z.flotten, []);
  assert.equal(z.punkte, 0);
  assert.equal(z.einstellungen.schildAutoaktivierung, true);
  assert.equal(neu(SS, { planetName: " Terra Nova " }).heimat.name, "Terra Nova");
  assert.equal(neu(SS).name, "Kommandant");
  // Ohne Zufallsquelle (Math.random) ebenfalls gültig
  for (let i = 0; i < 50; i++) assert.ok(W.leseKoordinaten(W.koordinatenText(neu(SS).heimat)));
});

test("Produktion: Grundrate ohne Boni, 1 Stunde Ticks = Stundenrate", () => {
  const SS = ladeSpiel();
  const P = SS.kern.produktion;
  const z = neu(SS);
  const rate = P.produktionProStunde(z);
  for (const id of SS.DATEN.rohstoffIds) assert.equal(rate[id], SS.BALANCE.GRUNDPRODUKTION_PRO_STUNDE[id], "Grundrate " + id);
  gleich(rate, P.produktionProStunde(neu(SS, { zufall: () => 0.99 })), "Produktion unabhängig vom Planeten");
  const start = { ...z.rohstoffe };
  for (let s = 1; s <= 3600; s++) P.tick(z, T0 + s * 1000);
  for (const id of SS.DATEN.rohstoffIds) nah(z.rohstoffe[id], start[id] + rate[id]);
  assert.equal(rate.kunststoff_t1, 0); assert.equal(rate.antimaterie, 0);
});

test("Produktion: unregelmäßige Ticks summieren sich exakt", () => {
  const SS = ladeSpiel();
  const P = SS.kern.produktion;
  const a = neu(SS), b = neu(SS);
  let t = T0; for (const d of [17, 999, 4000, 1, 60000, 333]) { t += d; P.tick(a, t); }
  P.tick(b, t);
  for (const id of SS.DATEN.rohstoffIds) nah(a.rohstoffe[id], b.rohstoffe[id]);
});

test("Produktion: Lager kappt, Zeit rückwärts schreibt nichts gut", () => {
  const SS = ladeSpiel();
  const P = SS.kern.produktion;
  const z = neu(SS);
  P.tick(z, T0 + 1000 * STD);
  assert.ok(z.rohstoffe.metall <= SS.BALANCE.LAGER_GRUND.metall);
  z.rohstoffe.metall = 9999.5;
  P.tick(z, T0 + 1001 * STD);
  assert.equal(z.rohstoffe.metall, SS.BALANCE.LAGER_GRUND.metall);
  z.rohstoffe.metall = 20000;
  P.tick(z, T0 + 1002 * STD);
  assert.equal(z.rohstoffe.metall, 20000, "Überbestand bleibt, wächst nicht");
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
  nah(geladen.rohstoffe.metall, nachSpeichern.metall + 2 * 120);
  nah(off.gewinne.silizium, 2 * 80);
  assert.equal(geladen.statistik.offlineMsGesamt, 2 * STD);
});

test("Offline-Fortschritt: auf 24 h gekappt", () => {
  const SS = ladeSpiel();
  const P = SS.kern.produktion;
  const z = neu(SS);
  const off = P.offlineFortschritt(z, T0 + 72 * STD);
  assert.equal(off.gekappt, true);
  assert.equal(off.angerechnetMs, SS.BALANCE.OFFLINE_MAX_STUNDEN * STD);
  nah(z.rohstoffe.strom, Math.min(SS.BALANCE.LAGER_GRUND.strom, 100 + 24 * 100));
  assert.equal(z.zeit.letzterTick, T0 + 72 * STD);
});

test("Speichern/Laden: Rundreise, Zeitstempel, Löschen", () => {
  const SS = ladeSpiel();
  const S = SS.kern.speicher;
  const sp = speicherAttrappe();
  assert.equal(S.vorhanden(sp), false);
  gleich(S.lade(sp), { zustand: null, fehler: null });
  const z = neu(SS, { name: "Test" });
  z.gebaeude.geologiestation = { stufe: 0 };
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

test("Migration v2 → v3: Heimat behalten, alte Startplatz-Felder verwerfen", () => {
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
  assert.equal(z.version, 3);
  assert.ok(!("startplatz" in z), "alte Startplatz-Wahl verworfen");
  gleich(z.heimat, { sektor: 3, system: 133, planet: 5, name: "Rigo V" });
  assert.equal(z.rohstoffe.metall, 1234); assert.equal(z.rohstoffe.antimaterie, 0);
  assert.equal(z.startplaetze.length, 10);
  gleich(z.startplaetze[0], { buchstabe: "A", stufe: 1, freigeschaltet: true });
  assert.equal(z.punkte, 0);
  // Produktion danach = Grundrate (kein Bonus mehr durch altes „L Stufe 15 Strom“)
  assert.equal(SS.kern.produktion.produktionProStunde(z).strom, 100);
});

test("Migration v1 → v3: ohne Heimat wird ein Hauptplanet vergeben", () => {
  const SS = ladeSpiel();
  const W = SS.DATEN.weltraum;
  const v1 = { version: 1, name: "Alt", startplatz: { buchstabe: "D", stufe: 13, schwerpunkt: "strom" }, rohstoffe: { metall: 7 }, zeit: { letzterTick: T0 } };
  const z = SS.kern.zustand.migriere(JSON.parse(JSON.stringify(v1)), W.zufall(3));
  assert.equal(z.version, 3);
  assert.ok(!("startplatz" in z));
  assert.ok(W.leseKoordinaten(W.koordinatenText(z.heimat)));
  assert.equal(z.rohstoffe.metall, 7);
  assert.equal(z.zeit.zuletztGespeichert, null);
  // Ungültige Heimat-Koordinate → neu vergeben, Name bleibt
  const z2 = SS.kern.zustand.migriere({ version: 2, heimat: { sektor: 1, system: 999, planet: 1, name: "Alt" }, rohstoffe: {}, zeit: { letzterTick: T0 } });
  assert.ok(W.leseKoordinaten(W.koordinatenText(z2.heimat))); assert.equal(z2.heimat.name, "Alt");
  // Startplätze bereinigen: Stufen begrenzen, gesperrte auf 0
  const z3 = SS.kern.zustand.migriere({ version: 3, heimat: z.heimat, rohstoffe: {}, zeit: { letzterTick: T0 },
    startplaetze: [{ buchstabe: "A", stufe: 99, freigeschaltet: true }, { buchstabe: "B", stufe: 4, freigeschaltet: false }, { buchstabe: "Q", stufe: 3, freigeschaltet: true }] });
  gleich(z3.startplaetze.slice(0, 2), [{ buchstabe: "A", stufe: 15, freigeschaltet: true }, { buchstabe: "B", stufe: 0, freigeschaltet: false }]);
  assert.equal(z3.startplaetze.length, 10);
});

test("Format: deutsche Zahlen und Dauer", () => {
  const SS = ladeSpiel();
  assert.equal(SS.format.zahl(12345.9), "12.345");
  assert.equal(SS.format.dauer(2 * STD + 5 * 60000), "2 Std. 5 Min.");
});
