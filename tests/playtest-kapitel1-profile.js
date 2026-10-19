// Browser-Playtest „Start-Fix + Spielerprofile“ (playwright-core).
// Aufruf:  node tests/playtest-kapitel1-profile.js                 → file:// (Hauptablauf) + lokaler HTTP-Server (Cache-Mix)
//          LIVE_URL=https://unexist2010.github.io/sternenspiel/ node tests/playtest-kapitel1-profile.js   → alles gegen die Live-Seite
//          PLAYTEST_BROWSER=chromium,firefox,webkit (Standard: alle, die starten)
// Prüft: 2 Spieler anlegen, wechseln, getrennter Fortschritt, Reload behält Stand, Löschen mit Bestätigung,
// alter Einzel-Spielstand (v2 mit startplatz) wird übernommen, kaputter Spielstand blockiert nicht,
// Cache-Mix (alte HTML aus dem Zwischenspeicher + neue Skripte / neue HTML + altes Skript) → nie toter Knopf.
"use strict";
const fs = require("fs");
const path = require("path");
const http = require("http");
const { pathToFileURL } = require("url");

function ladePlaywright() {
  const kandidaten = [process.env.PLAYWRIGHT_CORE, "playwright-core", "playwright"].filter(Boolean);
  const pnpm = "/usr/local/lib/pnpm/5/.pnpm";
  if (fs.existsSync(pnpm)) for (const d of fs.readdirSync(pnpm).filter((d) => d.startsWith("playwright-core@")).sort().reverse()) kandidaten.push(path.join(pnpm, d, "node_modules/playwright-core"));
  for (const k of kandidaten) { try { return require(k); } catch (e) { /* nächster */ } }
  throw new Error("playwright-core nicht gefunden");
}
const PW = ladePlaywright();
const CHROME = process.env.CHROME || ["/usr/bin/google-chrome", "/opt/google/chrome/chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const WURZEL = path.join(__dirname, "..");
const LIVE = process.env.LIVE_URL || "";
const OUT = path.join(WURZEL, "playtest");
const ALT = path.join(__dirname, "altstand");
fs.mkdirSync(OUT, { recursive: true });

let fehlschlaege = 0, pruefungen = 0;
function ok(bed, text) { pruefungen++; console.log((bed ? "OK   " : "FAIL ") + text); if (!bed) fehlschlaege++; }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const GERAETE = [
  { name: "desktop", viewport: { width: 1366, height: 768 }, isMobile: false, hasTouch: false, deviceScaleFactor: 1 },
  { name: "handy", viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
];

// Kleiner statischer Server für die Cache-Mix-Szenarien (Routing geht nur bei http/https)
function starteServer() {
  const typen = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png" };
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split("?")[0]);
    if (p.endsWith("/")) p += "index.html";
    const datei = path.join(WURZEL, path.normalize(p));
    if (!datei.startsWith(WURZEL) || !fs.existsSync(datei) || fs.statSync(datei).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { "content-type": typen[path.extname(datei)] || "application/octet-stream" });
    fs.createReadStream(datei).pipe(res);
  });
  return new Promise((r) => srv.listen(0, "127.0.0.1", () => r(srv)));
}

function neueSeite(ctx, basis) {
  return ctx.newPage().then((page) => {
    const fehler = [];
    page.on("pageerror", (e) => fehler.push("pageerror: " + e.message));
    page.on("console", (m) => { if (m.type() === "error") fehler.push("console.error: " + m.text()); });
    page.on("requestfailed", (r) => { if (!/favicon/.test(r.url())) fehler.push("requestfailed: " + r.url()); });
    page.on("request", (r) => { const u = r.url(); if (!u.startsWith("data:") && !u.startsWith(basis.split("index.html")[0].replace(/[^/]*$/, ""))) fehler.push("fremde Anfrage: " + u); });
    return { page, fehler };
  });
}

async function menueKnopf(page, handy, sel) {
  if (handy) { await page.click("#knopf-menue-auf"); await sleep(280); }
  await page.click(sel);
}

async function erschaffe(page, name, planet) {
  await page.fill("#eingabe-name", name);
  await page.fill("#eingabe-planet", planet || "");
  await page.click("#knopf-neues-spiel");
  await page.waitForSelector('#bildschirm-spiel:not([hidden]) #inhalt[data-seite="uebersicht"]', { timeout: 8000 });
}
const profilZeilen = (page) => page.$$eval("#profil-liste .profil", (z) => z.map((e) => e.querySelector("b").textContent));
const spielen = async (page, name) => {
  const id = await page.$eval("#profil-liste", (l, n) => [...l.querySelectorAll(".profil")].find((e) => e.querySelector("b").textContent === n).getAttribute("data-profil"), name);
  await page.click(`#profil-liste [data-aktion="spielen"][data-id="${id}"]`);
  await page.waitForSelector('#bildschirm-spiel:not([hidden])', { timeout: 8000 });
  if (await page.isVisible("#dialog")) await page.click("#dialog-ok");
};

async function hauptablauf(browser, bname, g, basis) {
  console.log(`\n== ${bname} · ${g.name} ${g.viewport.width}×${g.viewport.height} · ${basis} ==`);
  const handy = g.name === "handy";
  const ctx = await browser.newContext({ viewport: g.viewport, isMobile: bname === "firefox" ? undefined : g.isMobile, hasTouch: g.hasTouch, deviceScaleFactor: g.deviceScaleFactor, locale: "de-DE", timezoneId: "Europe/Vienna" });
  const { page, fehler } = await neueSeite(ctx, basis);
  await page.goto(basis);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  ok(await page.isVisible("#profil-liste") && (await page.textContent("#profil-liste")).includes("Noch keine Spieler"), "Frischer Browser: leere Spielerauswahl");
  ok((await page.getAttribute("html", "data-version")) === (await page.evaluate(() => window.SS.VERSION)), "HTML-Version = Skript-Version " + (await page.evaluate(() => window.SS.VERSION)));

  // Knopf ohne Namen: kein Neuladen, Hinweis
  const urlVorher = page.url();
  await page.click("#knopf-neues-spiel");
  await sleep(300);
  ok(page.url() === urlVorher && await page.isVisible("#start-fehler") && (await page.textContent("#start-fehler")).includes("Spielernamen"), "Klick ohne Namen: Hinweis statt Neuladen");

  // Spieler 1
  await erschaffe(page, "Sandro");
  const s1 = await page.evaluate(() => ({ id: window.SS.app.aktivId, h: window.SS.app.zustand.heimat }));
  ok(!!s1.id, `Spieler 1 „Sandro“ angelegt auf [${s1.h.sektor}:${s1.h.system}:${s1.h.planet}]`);
  ok((await page.textContent("#menue-planet")).includes("Sandro"), "Spielername in der Planetenkarte");
  await page.evaluate(() => { window.SS.app.zustand.rohstoffe.silizium = 5555; });
  await menueKnopf(page, handy, "#knopf-spieler-wechseln");
  ok(await page.isVisible("#bildschirm-start"), "„Spieler wechseln“ → Spielerauswahl");

  // Spieler 2
  await erschaffe(page, "Gast", "Terra");
  const s2 = await page.evaluate(() => ({ id: window.SS.app.aktivId, z: window.SS.app.zustand }));
  ok(s2.id !== s1.id && s2.z.heimat.name === "Terra", "Spieler 2 „Gast“ mit Planet „Terra“");
  ok(s2.z.rohstoffe.silizium < 1000, "Spieler 2 startet mit eigenem Startbestand (getrennt)");
  ok(JSON.stringify(s2.z.heimat) !== JSON.stringify(s1.h), "Andere Koordinate als Spieler 1");
  await page.evaluate(() => { window.SS.app.zustand.rohstoffe.rohoel = 7777; });
  await menueKnopf(page, handy, "#knopf-spieler-wechseln");
  const namen = await profilZeilen(page);
  ok(namen.length === 2 && namen[0] === "Gast", "Liste: 2 Spieler, zuletzt gespielter zuerst");
  const zeile = await page.textContent("#profil-liste .profil");
  ok(/Terra/.test(zeile) && /\[\d+:\d+:\d+\]/.test(zeile) && /Zuletzt gespielt/.test(zeile), "Zeile zeigt Name, Planet, Koordinaten, zuletzt gespielt");
  ok((await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 0, "Spielerauswahl ohne waagrechten Überlauf");
  if (bname === "chromium") { await sleep(250); await page.screenshot({ path: path.join(OUT, `kapitel1-profile-${g.name}-${LIVE ? "live-" : ""}spielerauswahl.png`), fullPage: true }); }

  // Getrennter Fortschritt
  await spielen(page, "Sandro");
  let z = await page.evaluate(() => window.SS.app.zustand.rohstoffe);
  ok(z.silizium >= 5555 && z.rohoel < 7000, "Sandro: eigener Stand (Silizium 5555+, kein Öl von Gast)");
  await menueKnopf(page, handy, "#knopf-spieler-wechseln");
  await page.reload();
  ok((await profilZeilen(page)).length === 2, "Reload: beide Spieler bleiben erhalten");
  await spielen(page, "Gast");
  z = await page.evaluate(() => window.SS.app.zustand.rohstoffe);
  ok(z.rohoel >= 7777 && z.silizium < 5000, "Gast nach Reload: eigener Stand (Öl 7777+)");
  // Reload mitten im Spiel → Auswahl, Stand bleibt (pagehide speichert)
  await page.evaluate(() => { window.SS.app.zustand.rohstoffe.metall = 3333; });
  await page.reload();
  await spielen(page, "Gast");
  ok((await page.evaluate(() => window.SS.app.zustand.rohstoffe.metall)) >= 3333, "Reload im Spiel speichert den aktiven Spieler");

  // Zurücksetzen nur aktiver Spieler
  await page.evaluate(() => { location.hash = "#uebersicht"; });
  await page.waitForSelector('#inhalt[data-seite="uebersicht"] [data-aktion="zuruecksetzen"]');
  await page.click('[data-aktion="zuruecksetzen"]');
  await page.click("#dialog-ok");
  await sleep(200);
  ok((await page.evaluate(() => window.SS.app.zustand.rohstoffe.rohoel)) < 1000, "Zurücksetzen: Gast wieder auf Startbestand");
  await menueKnopf(page, handy, "#knopf-spieler-wechseln");
  await spielen(page, "Sandro");
  ok((await page.evaluate(() => window.SS.app.zustand.rohstoffe.silizium)) >= 5555, "Zurücksetzen hat Sandro nicht berührt");
  await menueKnopf(page, handy, "#knopf-spieler-wechseln");

  // Löschen mit Bestätigung
  const gastId = await page.$eval("#profil-liste", (l) => [...l.querySelectorAll(".profil")].find((e) => e.querySelector("b").textContent === "Gast").getAttribute("data-profil"));
  await page.click(`#profil-liste [data-aktion="loeschen"][data-id="${gastId}"]`);
  ok(await page.isVisible("#dialog") && (await page.textContent("#dialog-text")).includes("Gast"), "Löschen fragt nach");
  await page.click("#dialog-abbrechen");
  ok((await profilZeilen(page)).length === 2, "Abbrechen: nichts gelöscht");
  await page.click(`#profil-liste [data-aktion="loeschen"][data-id="${gastId}"]`);
  await page.click("#dialog-ok");
  await sleep(200);
  ok(JSON.stringify(await profilZeilen(page)) === '["Sandro"]', "Bestätigt: nur Gast gelöscht");
  ok(await page.evaluate((id) => localStorage.getItem(window.SS.BALANCE.PROFIL_SPIELSTAND_PRAEFIX + id) === null, gastId), "Spielstand von Gast entfernt");

  // Alter Einzel-Spielstand (v2 mit startplatz-Feld) → wird Profil
  await page.evaluate(() => {
    const T = Date.now() - 2 * 3600000;
    localStorage.setItem(window.SS.BALANCE.SPEICHER_SCHLUESSEL, JSON.stringify({ version: 2, name: "Altspieler", startplatz: { buchstabe: "L", stufe: 15 },
      heimat: { sektor: 3, system: 133, planet: 5, name: "Rigo V" }, rohstoffe: { metall: 1234, silizium: 300, rohoel: 200, strom: 100, kristall1: 50 }, zeit: { letzterTick: T, zuletztGespeichert: T } }));
  });
  await page.reload();
  ok((await page.textContent("#start-fehler")).includes("Altspieler"), "Hinweis: alter Spielstand übernommen");
  ok((await profilZeilen(page)).includes("Altspieler") && (await page.textContent("#profil-liste")).includes("[3:133:5]"), "Altspieler in Liste mit [3:133:5]");
  await page.click(`#profil-liste .profil:has(b:text-is("Altspieler")) [data-aktion="spielen"]`);
  await page.waitForSelector('#bildschirm-spiel:not([hidden])');
  ok(await page.isVisible("#dialog") && (await page.textContent("#dialog")).includes("Willkommen zurück"), "Altspieler: Offline-Fortschritt seit altem Speicherstand");
  await page.click("#dialog-ok");
  z = await page.evaluate(() => window.SS.app.zustand);
  ok(z.version === await page.evaluate(() => window.SS.BALANCE.SPIELSTAND_VERSION) && !("startplatz" in z) && !("startplaetze" in z) && z.planeten[0].istHauptplanet === true && z.rohstoffe.metall > 1234, "Altspieler migriert (aktuelle Spielstand-Version, Planet mit istHauptplanet, ohne alte Startplatz-Felder, Metall gewachsen)");
  await menueKnopf(page, handy, "#knopf-spieler-wechseln");

  // Kaputter Einzel-Spielstand + kaputter Profil-Spielstand blockieren nicht
  await page.evaluate(() => {
    localStorage.setItem(window.SS.BALANCE.SPEICHER_SCHLUESSEL, "{kaputt");
    const idx = JSON.parse(localStorage.getItem(window.SS.BALANCE.PROFIL_INDEX_SCHLUESSEL));
    const s = idx.profile.find((p) => p.name === "Sandro");
    localStorage.setItem(window.SS.BALANCE.PROFIL_SPIELSTAND_PRAEFIX + s.id, "nicht json");
  });
  await page.reload();
  ok((await page.textContent("#start-fehler")).includes("nicht übernommen"), "Kaputter Altstand: Hinweis, Start nicht blockiert");
  await page.click(`#profil-liste .profil:has(b:text-is("Sandro")) [data-aktion="spielen"]`);
  await sleep(300);
  ok(await page.isVisible("#bildschirm-start") && (await page.textContent("#start-fehler")).includes("beschädigt"), "Kaputter Profil-Stand: Fehlermeldung in der Oberfläche");
  await erschaffe(page, "Neuling");
  ok(await page.isVisible("#bildschirm-spiel"), "Neuer Spieler trotzdem möglich");
  // Alle 8 Seiten erreichbar
  let seitenOk = true;
  for (const id of ["uebersicht", "ressourcen", "anlagen", "forschung", "werft", "verteidigung", "flotte", "weltraum"]) {
    await page.evaluate((i) => { location.hash = "#" + i; }, id);
    try { await page.waitForSelector(`#inhalt[data-seite="${id}"]`, { timeout: 3000 }); } catch (e) { seitenOk = false; }
  }
  ok(seitenOk, "Alle 8 Menüseiten laufen weiter");
  const echteFehler = fehler.filter((f) => !/console\.error: (Spielstand|Alter|Spielerliste)/.test(f));
  ok(echteFehler.length === 0, "Keine Seitenfehler/fremden Anfragen" + (echteFehler.length ? ":\n  " + echteFehler.join("\n  ") : ""));
  if (bname === "chromium") { await page.evaluate(() => { localStorage.clear(); }); }
  await ctx.close();
}

// Cache-Mix: nur über http(s), weil dort geroutet werden kann
async function cacheMix(browser, bname, basis) {
  console.log(`\n== ${bname} · Cache-Mix · ${basis} ==`);
  const altHtml = fs.readFileSync(path.join(ALT, "index-0.3.0.html"), "utf8");
  const altApp = fs.readFileSync(path.join(ALT, "app-0.3.0.js"), "utf8");
  const istSeite = (u) => { const x = new URL(u); return x.href.split("#")[0].replace(/\?.*$/, "") === basis.replace(/\?.*$/, "") || x.pathname.endsWith("/index.html"); };

  // A) Alte index.html (0.3.0) aus dem Zwischenspeicher, neue Skripte vom Server → einmal automatisch neu laden
  {
    const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, locale: "de-DE" });
    const { page, fehler } = await neueSeite(ctx, basis);
    let einmal = true;
    await page.route((u) => istSeite(u.href), (route) => {
      if (einmal && route.request().resourceType() === "document") { einmal = false; return route.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: altHtml }); }
      return route.continue();
    });
    // Neue Skripte auch für die alten (unversionierten) Adressen ausliefern = Stand nach dem Deploy
    await page.goto(basis);
    await page.waitForFunction(() => !!document.getElementById("profil-liste"), null, { timeout: 10000 });
    ok(/[?&]neu=\d+/.test(page.url()), "A) Alte HTML + neue Skripte: automatisch neu geladen (" + page.url().replace(/^.*\//, "") + ")");
    await erschaffe(page, "CacheTest");
    ok(await page.isVisible("#bildschirm-spiel"), "A) danach funktioniert „Spieler erschaffen“");
    ok(fehler.filter((f) => !/pageerror/.test(f)).length === 0, "A) keine fremden Anfragen/Fehler" + (fehler.length ? " (" + fehler.join(" | ") + ")" : ""));
    await ctx.close();
  }
  // B) Neue HTML, aber ein veraltetes app.js (Worst Case, z. B. Proxy ignoriert ?v=) → sichtbare Meldung + „Neu laden“, kein stummer Knopf
  {
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 }, locale: "de-DE" });
    const { page } = await neueSeite(ctx, basis);
    let einmal = true;
    await page.route(/\/js\/ui\/app\.js/, (route) => {
      if (einmal) { einmal = false; return route.fulfill({ status: 200, contentType: "text/javascript; charset=utf-8", body: altApp }); }
      return route.continue();
    });
    await page.goto(basis);
    await sleep(800);
    const sichtbar = await page.isVisible("#start-fehler");
    const text = sichtbar ? await page.textContent("#start-fehler") : "";
    ok(sichtbar && /neu laden/i.test(text), "B) Neue HTML + altes app.js: Fehlermeldung mit „Neu laden“ statt totem Knopf");
    await page.click("#start-fehler button");
    await page.waitForFunction(() => window.SS && window.SS.app, null, { timeout: 10000 });
    await erschaffe(page, "NachReload");
    ok(await page.isVisible("#bildschirm-spiel"), "B) „Neu laden“ holt frische Dateien, danach geht alles");
    await ctx.close();
  }
}

async function starteBrowser(name) {
  try {
    if (name === "chromium") return await PW.chromium.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox", "--disable-gpu"] });
    return await PW[name].launch({ headless: true });
  } catch (e) { console.log(`(${name} nicht verfügbar: ${e.message.split("\n")[0].slice(0, 120)})`); return null; }
}

(async () => {
  const namen = (process.env.PLAYTEST_BROWSER || "chromium,firefox,webkit").split(",");
  let srv = null, httpBasis = LIVE;
  if (!LIVE) { srv = await starteServer(); httpBasis = `http://127.0.0.1:${srv.address().port}/`; }
  const hauptBasis = LIVE || pathToFileURL(path.join(WURZEL, "index.html")).href;
  const gelaufen = [];
  try {
    for (const n of namen) {
      const b = await starteBrowser(n);
      if (!b) continue;
      gelaufen.push(n);
      try {
        for (const g of GERAETE) await hauptablauf(b, n, g, hauptBasis);
        await cacheMix(b, n, httpBasis);
      } finally { await b.close(); }
    }
  } finally { if (srv) srv.close(); }
  console.log(`\nBrowser: ${gelaufen.join(", ")}\n${pruefungen - fehlschlaege}/${pruefungen} Prüfungen grün` + (fehlschlaege ? ` – ${fehlschlaege} FEHLGESCHLAGEN` : " – ALLE GRÜN"));
  process.exit(fehlschlaege || !gelaufen.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
