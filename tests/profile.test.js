// Tests Spielerprofile (Node): node --test tests/
const test = require("node:test");
const assert = require("node:assert/strict");
const { ladeSpiel, speicherAttrappe } = require("./lade-spiel");

const STD = 3600000;
const T0 = Date.UTC(2026, 9, 19, 8, 0, 0);
const gleich = (a, b) => assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)));

function aufbau() {
  const SS = ladeSpiel();
  return { SS, PR: SS.kern.profile, sp: speicherAttrappe(), W: SS.DATEN.weltraum };
}

test("Profile: Version in Konstanten gesetzt und gleich index.html", () => {
  const { SS } = aufbau();
  const html = require("fs").readFileSync(require("path").join(__dirname, "..", "index.html"), "utf8");
  assert.match(SS.VERSION, /^\d+\.\d+\.\d+$/);
  assert.ok(html.includes(`data-version="${SS.VERSION}"`), "data-version passt");
  const refs = [...html.matchAll(/(?:src|href)="((?:js|css)\/[^"]+)"/g)].map((m) => m[1]);
  assert.ok(refs.length >= 14);
  for (const r of refs) assert.ok(r.endsWith("?v=" + SS.VERSION), "Cache-Schutz fehlt: " + r);
});

test("Profile: anlegen – automatischer Start, eigener Schlüssel, Liste", () => {
  const { SS, PR, sp, W } = aufbau();
  gleich(PR.liste(sp), { profile: [], fehler: null });
  const a = PR.erstelle(sp, { name: "Sandro", jetzt: T0, zufall: W.zufall(1) });
  assert.equal(a.fehler, null);
  assert.ok(W.leseKoordinaten(a.profil.koordinaten));
  assert.equal(a.profil.planet, a.zustand.heimat.name);
  assert.ok(sp.daten[PR.spielstandSchluessel(a.profil.id)], "eigener Spielstand-Schlüssel");
  const b = PR.erstelle(sp, { name: "Gast", planetName: "Terra", jetzt: T0 + 1000 });
  assert.equal(b.profil.planet, "Terra");
  assert.notEqual(a.profil.id, b.profil.id);
  const l = PR.liste(sp).profile;
  assert.equal(l.length, 2);
  assert.equal(l[0].name, "Gast", "zuletzt gespielt zuerst");
  assert.equal(sp.daten[SS.BALANCE.SPEICHER_SCHLUESSEL], undefined, "kein Einzel-Spielstand mehr");
});

test("Profile: Name Pflicht, keine Doppelten, Obergrenze", () => {
  const { SS, PR, sp } = aufbau();
  assert.match(PR.erstelle(sp, { name: "  ", jetzt: T0 }).fehler, /Spielernamen/);
  PR.erstelle(sp, { name: "Sandro", jetzt: T0 });
  assert.match(PR.erstelle(sp, { name: " sandro ", jetzt: T0 }).fehler, /gibt es schon/);
  for (let i = 1; i < SS.BALANCE.MAX_PROFILE; i++) assert.equal(PR.erstelle(sp, { name: "S" + i, jetzt: T0 + i }).fehler, null);
  assert.match(PR.erstelle(sp, { name: "Zuviel", jetzt: T0 }).fehler, /Höchstens/);
});

test("Profile: getrennter Fortschritt, wechseln, Offline pro Profil", () => {
  const { SS, PR, sp } = aufbau();
  const P = SS.kern.produktion;
  const a = PR.erstelle(sp, { name: "A", jetzt: T0 });
  const b = PR.erstelle(sp, { name: "B", jetzt: T0 });
  // A spielt 1 Stunde und speichert
  let za = PR.ladeProfil(sp, a.profil.id).zustand;
  P.tick(za, T0 + STD);
  za.rohstoffe.silizium = 4242;
  PR.speichereProfil(sp, a.profil.id, za, T0 + STD);
  // B bleibt unverändert
  const zb = PR.ladeProfil(sp, b.profil.id).zustand;
  assert.equal(zb.rohstoffe.metall, 500);
  assert.equal(zb.rohstoffe.silizium, 300);
  // A neu laden: Werte erhalten; Offline 2 Std. nur für A
  za = PR.ladeProfil(sp, a.profil.id).zustand;
  assert.equal(za.rohstoffe.silizium, 4242);
  const off = P.offlineFortschritt(za, T0 + 3 * STD);
  assert.equal(off.angerechnetMs, 2 * STD);
  // B: Offline seit seinem eigenen Speicherzeitpunkt (T0)
  const offB = P.offlineFortschritt(PR.ladeProfil(sp, b.profil.id).zustand, T0 + 3 * STD);
  assert.equal(offB.angerechnetMs, 3 * STD);
  assert.equal(PR.liste(sp).profile[0].name, "A", "A zuletzt gespielt");
});

test("Profile: löschen entfernt nur dieses Profil samt Spielstand", () => {
  const { PR, sp } = aufbau();
  const a = PR.erstelle(sp, { name: "A", jetzt: T0 });
  const b = PR.erstelle(sp, { name: "B", jetzt: T0 });
  PR.loesche(sp, a.profil.id);
  gleich(PR.liste(sp).profile.map((p) => p.name), ["B"]);
  assert.equal(sp.daten[PR.spielstandSchluessel(a.profil.id)], undefined);
  assert.ok(PR.ladeProfil(sp, b.profil.id).zustand);
  assert.match(PR.ladeProfil(sp, a.profil.id).fehler, /nicht gefunden/);
});

test("Profile: zurücksetzen betrifft nur den aktiven Spieler (Name + Hauptplanet bleiben)", () => {
  const { SS, PR, sp } = aufbau();
  const a = PR.erstelle(sp, { name: "A", jetzt: T0 });
  const b = PR.erstelle(sp, { name: "B", jetzt: T0 });
  for (const p of [a, b]) { const z = PR.ladeProfil(sp, p.profil.id).zustand; z.rohstoffe.metall = 9000; PR.speichereProfil(sp, p.profil.id, z, T0 + 10); }
  const r = PR.zuruecksetzen(sp, a.profil.id, T0 + STD);
  assert.equal(r.zustand.rohstoffe.metall, 500);
  gleich(r.zustand.heimat, a.zustand.heimat);
  assert.equal(r.zustand.name, "A");
  assert.equal(PR.ladeProfil(sp, a.profil.id).zustand.rohstoffe.metall, 500);
  assert.ok(PR.ladeProfil(sp, b.profil.id).zustand.rohstoffe.metall >= 9000, "B unverändert");
});

test("Migration: alter Einzel-Spielstand (v1, v2, v3) wird erstes Profil", () => {
  for (const variante of ["v1", "v2", "v3"]) {
    const { SS, PR, sp, W } = aufbau();
    const key = SS.BALANCE.SPEICHER_SCHLUESSEL;
    let alt;
    if (variante === "v1") alt = { version: 1, name: "AltV1", startplatz: { buchstabe: "D", stufe: 13, schwerpunkt: "strom" }, rohstoffe: { metall: 777 }, zeit: { letzterTick: T0, zuletztGespeichert: T0 } };
    if (variante === "v2") alt = { version: 2, name: "AltV2", startplatz: { buchstabe: "L", stufe: 15 }, heimat: { sektor: 3, system: 133, planet: 5, name: "Rigo V" }, rohstoffe: { metall: 777 }, zeit: { letzterTick: T0, zuletztGespeichert: T0 } };
    if (variante === "v3") alt = JSON.parse(JSON.stringify(SS.kern.zustand.neuerSpielstand({ name: "AltV3", jetzt: T0 })));
    if (variante === "v3") alt.rohstoffe.metall = 777;
    sp.setItem(key, JSON.stringify(alt));
    const m = PR.migriereEinzelstand(sp, T0 + STD);
    assert.equal(m.fehler, null, variante);
    assert.equal(m.profil.name, "Alt" + variante.toUpperCase());
    assert.equal(sp.getItem(key), null, "alter Schlüssel entfernt");
    assert.ok(sp.getItem(key + "_uebernommen"), "Sicherung vorhanden");
    const z = PR.ladeProfil(sp, m.profil.id).zustand;
    assert.equal(z.version, 3); assert.ok(!("startplatz" in z));
    assert.equal(z.rohstoffe.metall, 777);
    if (variante === "v2") gleich(z.heimat, { sektor: 3, system: 133, planet: 5, name: "Rigo V" });
    assert.ok(W.leseKoordinaten(W.koordinatenText(z.heimat)));
    // Offline-Fortschritt läuft ab altem Speicherzeitpunkt
    assert.equal(SS.kern.produktion.offlineFortschritt(z, T0 + 2 * STD).angerechnetMs, 2 * STD);
    // zweiter Aufruf: nichts mehr zu tun
    gleich(PR.migriereEinzelstand(sp, T0 + 2 * STD), { profil: null, fehler: null });
    assert.equal(PR.liste(sp).profile.length, 1);
  }
});

test("Migration: Namenskonflikt und kaputter Altstand blockieren nicht", () => {
  const { SS, PR, sp } = aufbau();
  const key = SS.BALANCE.SPEICHER_SCHLUESSEL;
  PR.erstelle(sp, { name: "Sandro", jetzt: T0 });
  sp.setItem(key, JSON.stringify({ version: 2, name: "Sandro", heimat: { sektor: 1, system: 1, planet: 1 }, rohstoffe: {}, zeit: { letzterTick: T0 } }));
  assert.equal(PR.migriereEinzelstand(sp, T0).profil.name, "Sandro (alt)");
  sp.setItem(key, "{kaputt");
  const m = PR.migriereEinzelstand(sp, T0);
  assert.equal(m.profil, null); assert.match(m.fehler, /nicht übernommen/);
  assert.equal(sp.getItem(key), null); assert.equal(sp.getItem(key + "_defekt"), "{kaputt");
  sp.setItem(key, JSON.stringify({ version: 99, rohstoffe: {}, zeit: { letzterTick: T0 } }));
  assert.match(PR.migriereEinzelstand(sp, T0).fehler, /neueren/);
  assert.equal(PR.liste(sp).profile.length, 2, "bestehende Profile unberührt");
});

test("Profile: kaputter Index / kaputter Profil-Spielstand werfen nie", () => {
  const { SS, PR, sp } = aufbau();
  const a = PR.erstelle(sp, { name: "A", jetzt: T0 });
  sp.setItem(PR.spielstandSchluessel(a.profil.id), "{kaputt");
  const r = PR.ladeProfil(sp, a.profil.id);
  assert.equal(r.zustand, null); assert.match(r.fehler, /beschädigt/);
  sp.setItem(SS.BALANCE.PROFIL_INDEX_SCHLUESSEL, "nicht json");
  const l = PR.liste(sp);
  gleich(l.profile, []); assert.match(l.fehler, /beschädigt/);
  assert.equal(PR.erstelle(sp, { name: "Neu", jetzt: T0 }).fehler, null, "Neuanlage geht trotzdem");
  // Speicher wirft beim Lesen
  const kaputt = { getItem() { throw new Error("gesperrt"); }, setItem() { throw new Error("gesperrt"); }, removeItem() {} };
  assert.match(PR.liste(kaputt).fehler, /nicht verfügbar/);
  gleich(PR.migriereEinzelstand(kaputt, T0), { profil: null, fehler: null });
});
