// 0.23.0 Nachrichten (Sandro pt67u): Kategorien, Hooks Kampf/Spionage/Flotte/Expedition, gelesen/löschen, Migration, Koordinaten-Links.
const test = require("node:test");
const assert = require("node:assert/strict");
const { ladeSpiel } = require("./lade-spiel");
const T0 = Date.UTC(2026, 9, 31, 8, 0, 0);
function setup() {
  const SS = ladeSpiel();
  const z = SS.kern.zustand.migriere(SS.kern.zustand.neuerSpielstand({ jetzt: T0, name: "Test" }));
  SS.kern.testphase.legeTestphaseAn(z, T0);
  return { SS, z, p: z.planeten[0], FL: SS.kern.flotte, N: SS.kern.nachrichten };
}

test("Neues Spiel: Willkommens-Spielernachricht ungelesen", () => {
  const { z, N } = setup();
  assert.ok(z.nachrichten.some((n) => n.kat === "spieler" && !n.gelesen && n.von === "Flottenkommando"));
});

test("Spionage + Angriff erzeugen Spionage-/Kampfbericht-Nachrichten mit Koordinaten, ohne Doppel als Flottenmeldung", () => {
  const { z, p, FL, N } = setup();
  FL.senden(z, p, { schiffe: { spionagesonde: 1 }, ziel: z.gegner[0], mission: "spionieren" }, T0);
  const s = z.nachrichten.find((n) => n.kat === "spionage");
  assert.ok(s && s.daten === z.letzterSpionagebericht && !s.gelesen);
  assert.equal(s.koord.system, z.gegner[0].system);
  FL.senden(z, p, { schiffe: { korvette: 4, zerstoerer: 3, kreuzer: 2 }, ziel: z.gegner[0], mission: "angriff" }, T0);
  const k = z.nachrichten.find((n) => n.kat === "kampf");
  assert.ok(k && k.daten === z.letzterKampfbericht && /Sieg/.test(k.text));
  assert.ok(!z.nachrichten.some((n) => n.kat === "flotte" && /Spionagebericht|Kampf/.test(n.text)), "kein Doppel");
  assert.ok(z.nachrichten.some((n) => n.kat === "flotte" && /zurück/.test(n.text)), "Rückkehr als Flottenmeldung");
  assert.ok(N.ungelesen(z, "kampf") >= 1);
});

test("Gelesen, Löschen einzeln/gelesene/Kategorie, Limits", () => {
  const { z, N } = setup();
  for (let i = 0; i < 5; i++) N.neu(z, { kat: "flotte", titel: "F" + i, zeit: T0 + i });
  const id = z.nachrichten[0].id;
  N.lesen(z, id); assert.equal(N.finde(z, id).gelesen, true);
  assert.equal(N.loescheKat(z, "flotte", true), 1);
  assert.equal(N.loesche(z, [z.nachrichten[0].id]), 1);
  N.alleGelesen(z, "flotte"); assert.equal(N.ungelesen(z, "flotte"), 0);
  assert.equal(N.loescheKat(z, "flotte", false), 3);
  for (let i = 0; i < 400; i++) N.neu(z, { kat: "flotte", titel: "x" });
  assert.ok(z.nachrichten.filter((n) => n.kat === "flotte").length <= N.MAX_KAT.flotte);
  assert.equal(N.neu(z, { kat: "quatsch" }), null);
});

test("Migration alter Save: Kampfberichte/Spionage/Expeditionen → gelesene Nachrichten + JSON-Roundtrip", () => {
  const { SS, z, p, FL } = setup();
  FL.senden(z, p, { schiffe: { korvette: 4, zerstoerer: 3, kreuzer: 2 }, ziel: z.gegner[1], mission: "angriff" }, T0);
  const alt = JSON.parse(JSON.stringify(z)); delete alt.nachrichten; delete alt.nachrichtenZaehler;
  alt.letzteExpeditionen = [{ zeit: T0, ziel: { sektor: 1, system: 1, planet: 13 }, art: "nichts", text: "leer" }];
  const m = SS.kern.zustand.migriere(alt);
  assert.ok(m.nachrichten.some((n) => n.kat === "kampf" && n.gelesen));
  assert.ok(m.nachrichten.some((n) => n.kat === "expedition"));
  const r = SS.kern.zustand.migriere(JSON.parse(JSON.stringify(m)));
  assert.equal(r.nachrichten.length, m.nachrichten.length, "idempotent");
});

test("UI: Koordinaten-Links → Weltraum, Detail Kampf/Spionage, Seite mit Tabs", () => {
  const { SS, z, p, FL } = setup();
  const U = SS.ui.nachrichten;
  assert.match(U.koordLink({ sektor: 1, system: 50, planet: 3 }), /href="#weltraum\/system\/50\/planet\/3"/);
  assert.match(U.verlinke("Flotte bei 1:50:3 angekommen"), /#weltraum\/system\/50\/planet\/3/);
  assert.equal(U.verlinke("9:999:99"), "9:999:99");
  FL.senden(z, p, { schiffe: { spionagesonde: 1 }, ziel: z.gegner[0], mission: "spionieren" }, T0);
  FL.senden(z, p, { schiffe: { korvette: 4, zerstoerer: 3, kreuzer: 2 }, ziel: z.gegner[0], mission: "angriff" }, T0);
  const k = z.nachrichten.find((n) => n.kat === "kampf"), s = z.nachrichten.find((n) => n.kat === "spionage");
  assert.match(U.detail(k), /Phase 1/); assert.match(U.detail(k), /koord-link/);
  assert.match(U.detail(s), /Verteidigung/);
  const box = (t, i, r, e) => "<section" + (e || "") + ">" + t + (r || "") + i + "</section>";
  const html = U({ esc: (x) => x, box, zustand: () => z, teile: () => ["kampf", k.id] }).seite();
  assert.match(html, /nachrichten-tabs/); assert.match(html, /Spionageberichte/); assert.match(html, /box-nachricht/);
  assert.ok(SS.DATEN.menuePunkt("nachrichten"));
});
