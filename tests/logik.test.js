// Logik-Tests Kapitel 1 (Node, ohne Abhängigkeiten): node --test tests/
const test = require("node:test");
const assert = require("node:assert/strict");
const { ladeSpiel, speicherAttrappe } = require("./lade-spiel");

const STD = 3600000;
const T0 = Date.UTC(2026, 9, 18, 12, 0, 0);
// vm-Objekte stammen aus einem anderen Realm → Vergleich über JSON
const gleich = (a, b) => assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)));
const nah = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b}`);

test("Daten: 8 Rohstoffe laut Spezifikation", () => {
  const SS = ladeSpiel();
  gleich([...SS.DATEN.rohstoffIds], ["metall", "silizium", "rohoel", "strom", "kunststoff_t1", "kunststoff_t2", "kunststoff_t3", "antimaterie"]);
  for (const id of SS.DATEN.rohstoffIds) {
    assert.ok(id in SS.BALANCE.GRUNDPRODUKTION_PRO_STUNDE, "Produktion " + id);
    assert.ok(id in SS.BALANCE.STARTBESTAND, "Startbestand " + id);
    assert.ok(SS.BALANCE.LAGER_GRUND[id] > 0, "Lager " + id);
  }
});

test("Daten: Startplätze A–Z, Stufen 1–15, alle Stufen vorhanden", () => {
  const SS = ladeSpiel();
  const sp = SS.DATEN.startplaetze;
  assert.equal(sp.length, 26);
  assert.equal(sp.map((s) => s.buchstabe).join(""), "ABCDEFGHIJKLMNOPQRSTUVWXYZ");
  for (const s of sp) assert.ok(Number.isInteger(s.stufe) && s.stufe >= 1 && s.stufe <= 15, s.buchstabe);
  assert.equal(new Set(sp.map((s) => s.stufe)).size, 15);
  assert.equal(SS.DATEN.startplatzNachBuchstabe("a").buchstabe, "A");
  assert.equal(SS.DATEN.startplatzNachBuchstabe("Ä"), null);
});

test("Daten: Andockpunkte für spätere Kapitel", () => {
  const SS = ladeSpiel();
  assert.ok(SS.DATEN.gebaeude.some((g) => g.id === "geologiestation"));
  assert.equal(SS.DATEN.SCHIFFE_ANZAHL_SOLL, 23);
  assert.equal(SS.DATEN.WAFFENTYPEN_ANZAHL_SOLL, 5);
  assert.equal(SS.DATEN.HUELLENTYPEN_ANZAHL_SOLL, 2);
  assert.ok(Object.isFrozen(SS.BALANCE) && Object.isFrozen(SS.BALANCE.STARTPLATZ), "Balance zentral & unveränderlich");
});

test("Startplatz-Boni: Formel (ANNAHME) korrekt", () => {
  const SS = ladeSpiel();
  const m = SS.kern.produktion.startplatzMultiplikator;
  // Stufe 1, Schwerpunkt Metall (A)
  const A = SS.DATEN.startplatzNachBuchstabe("A");
  assert.equal(A.stufe, 1); assert.equal(A.schwerpunkt, "metall");
  nah(m(A, "metall"), 1 + 0 + 0.03);
  nah(m(A, "silizium"), 1);
  // L hat Stufe 15
  const L = SS.DATEN.startplatzNachBuchstabe("L");
  assert.equal(L.stufe, 15);
  nah(m(L, L.schwerpunkt), 1 + 14 * 0.02 + 15 * 0.03);
  const andere = ["metall", "silizium", "rohoel", "strom"].find((r) => r !== L.schwerpunkt);
  nah(m(L, andere), 1.28);
  // Veredelte/exotische Rohstoffe erhalten keinen Startplatz-Bonus
  assert.equal(m(L, "kunststoff_t1"), 1);
  assert.equal(m(L, "antimaterie"), 1);
  // Höhere Stufe ⇒ nie weniger Bonus
  // Höhere Stufe ⇒ höherer Bonus (bei gleichem Schwerpunkt, für jeden Grundrohstoff)
  for (const a of SS.DATEN.startplaetze) for (const b of SS.DATEN.startplaetze) {
    if (a.schwerpunkt !== b.schwerpunkt || a.stufe >= b.stufe) continue;
    for (const r of ["metall", "silizium", "rohoel", "strom"]) assert.ok(m(b, r) > m(a, r), `${b.buchstabe} > ${a.buchstabe} bei ${r}`);
  }
});

test("Neuer Spielstand: Startbestand, Startplatz, leere Andockfelder", () => {
  const SS = ladeSpiel();
  const z = SS.kern.zustand.neuerSpielstand({ name: "  Sandro ", startplatz: "d", jetzt: T0 });
  assert.equal(z.name, "Sandro");
  assert.equal(z.startplatz.buchstabe, "D");
  assert.equal(z.startplatz.stufe, 13);
  assert.equal(z.rohstoffe.metall, 500);
  assert.equal(z.zeit.letzterTick, T0);
  gleich(z.gebaeude, {}); gleich(z.flotten, []);
  assert.equal(z.einstellungen.schildAutoaktivierung, true);
  assert.equal(SS.kern.zustand.neuerSpielstand({ startplatz: "A", jetzt: T0 }).name, "Kommandant");
  assert.throws(() => SS.kern.zustand.neuerSpielstand({ startplatz: "1", jetzt: T0 }));
});

test("Produktion: 1 Stunde Ticks = Stundenrate (inkl. Bonus)", () => {
  const SS = ladeSpiel();
  const P = SS.kern.produktion;
  const z = SS.kern.zustand.neuerSpielstand({ startplatz: "L", jetzt: T0 }); // Stufe 15
  const rate = P.produktionProStunde(z);
  const start = { ...z.rohstoffe };
  for (let s = 1; s <= 3600; s++) P.tick(z, T0 + s * 1000); // 3600 Sekunden-Ticks
  for (const id of SS.DATEN.rohstoffIds) nah(z.rohstoffe[id], start[id] + rate[id], 1e-6);
  nah(rate.metall, 120 * P.startplatzMultiplikator(z.startplatz, "metall"));
  assert.equal(rate.kunststoff_t1, 0); assert.equal(rate.antimaterie, 0);
});

test("Produktion: unregelmäßige Ticks summieren sich exakt", () => {
  const SS = ladeSpiel();
  const P = SS.kern.produktion;
  const a = SS.kern.zustand.neuerSpielstand({ startplatz: "C", jetzt: T0 });
  const b = SS.kern.zustand.neuerSpielstand({ startplatz: "C", jetzt: T0 });
  let t = T0; for (const d of [17, 999, 4000, 1, 60000, 333]) { t += d; P.tick(a, t); }
  P.tick(b, t);
  for (const id of SS.DATEN.rohstoffIds) nah(a.rohstoffe[id], b.rohstoffe[id], 1e-6);
});

test("Produktion: Lager kappt, Zeit rückwärts schreibt nichts gut", () => {
  const SS = ladeSpiel();
  const P = SS.kern.produktion;
  const z = SS.kern.zustand.neuerSpielstand({ startplatz: "A", jetzt: T0 });
  P.tick(z, T0 + 1000 * STD); // sehr lange (wird auf 24 h gekappt, aber Lager wäre ohnehin voll?)
  assert.ok(z.rohstoffe.metall <= SS.BALANCE.LAGER_GRUND.metall);
  z.rohstoffe.metall = 9999.5;
  P.tick(z, T0 + 1001 * STD);
  assert.equal(z.rohstoffe.metall, SS.BALANCE.LAGER_GRUND.metall);
  z.rohstoffe.metall = 20000; // Überbestand bleibt, wächst nicht
  P.tick(z, T0 + 1002 * STD);
  assert.equal(z.rohstoffe.metall, 20000);
  const vorher = z.rohstoffe.silizium;
  P.tick(z, T0); // Uhr zurück
  assert.equal(z.rohstoffe.silizium, vorher);
  assert.equal(z.zeit.letzterTick, T0);
});

test("Offline-Fortschritt: 2 Stunden seit Speichern", () => {
  const SS = ladeSpiel();
  const { produktion: P, speicher: S, zustand: Z } = SS.kern;
  const sp = speicherAttrappe();
  const z = Z.neuerSpielstand({ startplatz: "B", jetzt: T0 });
  S.speichere(sp, z, T0 + 10000); // 10 s gespielt
  const nachSpeichern = { ...z.rohstoffe };
  const geladen = S.lade(sp).zustand;
  const off = P.offlineFortschritt(geladen, T0 + 10000 + 2 * STD);
  assert.equal(off.abwesendMs, 2 * STD);
  assert.equal(off.angerechnetMs, 2 * STD);
  assert.equal(off.gekappt, false);
  const rate = P.produktionProStunde(geladen);
  nah(geladen.rohstoffe.metall, nachSpeichern.metall + 2 * rate.metall);
  nah(off.gewinne.silizium, 2 * rate.silizium);
  assert.equal(geladen.statistik.offlineMsGesamt, 2 * STD);
});

test("Offline-Fortschritt: auf 24 h gekappt", () => {
  const SS = ladeSpiel();
  const { produktion: P, zustand: Z } = SS.kern;
  const z = Z.neuerSpielstand({ startplatz: "A", jetzt: T0 });
  const off = P.offlineFortschritt(z, T0 + 72 * STD);
  assert.equal(off.gekappt, true);
  assert.equal(off.angerechnetMs, SS.BALANCE.OFFLINE_MAX_STUNDEN * STD);
  const rate = P.produktionProStunde(z);
  nah(z.rohstoffe.strom, Math.min(SS.BALANCE.LAGER_GRUND.strom, 100 + 24 * rate.strom));
  assert.equal(z.zeit.letzterTick, T0 + 72 * STD);
});

test("Speichern/Laden: Rundreise, Zeitstempel, Löschen", () => {
  const SS = ladeSpiel();
  const { speicher: S, zustand: Z } = SS.kern;
  const sp = speicherAttrappe();
  assert.equal(S.vorhanden(sp), false);
  gleich(S.lade(sp), { zustand: null, fehler: null });
  const z = Z.neuerSpielstand({ name: "Test", startplatz: "Q", jetzt: T0 });
  z.gebaeude.geologiestation = { stufe: 0 }; // späteres Kapitel: bleibt erhalten
  S.speichere(sp, z, T0 + 5000);
  assert.equal(S.vorhanden(sp), true);
  const r = S.lade(sp);
  assert.equal(r.fehler, null);
  assert.equal(r.zustand.zeit.zuletztGespeichert, T0 + 5000);
  assert.equal(r.zustand.zeit.letzterTick, T0 + 5000);
  gleich(r.zustand, z);
  S.loesche(sp);
  assert.equal(S.vorhanden(sp), false);
});

test("Speichern/Laden: beschädigte und alte Spielstände", () => {
  const SS = ladeSpiel();
  const { speicher: S } = SS.kern;
  const sp = speicherAttrappe();
  const key = SS.BALANCE.SPEICHER_SCHLUESSEL;
  sp.setItem(key, "{kaputt");
  assert.equal(S.lade(sp).zustand, null); assert.match(S.lade(sp).fehler, /JSON/);
  sp.setItem(key, JSON.stringify({ version: 1, startplatz: { buchstabe: "?" } }));
  assert.match(S.lade(sp).fehler, /Felder/);
  sp.setItem(key, JSON.stringify({ version: 99, startplatz: { buchstabe: "A" }, rohstoffe: {}, zeit: { letzterTick: T0 } }));
  assert.match(S.lade(sp).fehler, /neueren/);
  // Minimal-Stand (fehlende Felder) wird ergänzt; Stufe kommt immer aus den Daten
  sp.setItem(key, JSON.stringify({ version: 1, startplatz: { buchstabe: "L", stufe: 99 }, rohstoffe: { metall: 7 }, zeit: { letzterTick: T0 } }));
  const z = S.lade(sp).zustand;
  assert.equal(z.startplatz.stufe, 15);
  assert.equal(z.rohstoffe.metall, 7); assert.equal(z.rohstoffe.antimaterie, 0);
  gleich(z.ereignisse, []); assert.equal(z.einstellungen.schildAutoaktivierung, true);
  assert.equal(z.zeit.zuletztGespeichert, null);
});

test("Format: deutsche Zahlen und Dauer", () => {
  const SS = ladeSpiel();
  assert.equal(SS.format.zahl(12345.9), "12.345");
  assert.equal(SS.format.dauer(2 * STD + 5 * 60000), "2 Std. 5 Min.");
  assert.equal(SS.format.prozent(1.73), "+73 %");
});
