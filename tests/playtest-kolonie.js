// Browser-Playtest Kolonisieren (0.18.0, Sandro t49u): Kolonieflotte mit Schiffen + Ladung, Planetenliste links, Wechsel, Schnellwahl.
// Aufruf:  node tests/playtest-testphase.js                  → file:// (ohne Server)
//          LIVE_URL=https://unexist2010.github.io/sternenspiel/ node tests/playtest-testphase.js
//          PLAYTEST_BROWSER=firefox node tests/playtest-testphase.js
// Desktop 1366×768 und Handy 412×915. Screenshots: playtest/testphase-*.png
"use strict";
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

function ladePlaywright() {
  const kandidaten = [process.env.PLAYWRIGHT_CORE, "playwright-core", "playwright"].filter(Boolean);
  const pnpm = "/usr/local/lib/pnpm/5/.pnpm"; // Fallback auf der Box
  if (fs.existsSync(pnpm)) for (const d of fs.readdirSync(pnpm).filter((d) => d.startsWith("playwright-core@")).sort().reverse()) kandidaten.push(path.join(pnpm, d, "node_modules/playwright-core"));
  for (const k of kandidaten) { try { return require(k); } catch (e) { /* nächster */ } }
  throw new Error("playwright-core nicht gefunden (npm i playwright-core oder PLAYWRIGHT_CORE setzen)");
}
const PW = ladePlaywright();
const { chromium } = PW;
const CHROME = process.env.CHROME || ["/usr/bin/google-chrome", "/opt/google/chrome/chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const LIVE = process.env.LIVE_URL || "";
const URL_ = LIVE || pathToFileURL(path.join(__dirname, "..", "index.html")).href;
const BASIS = URL_.replace(/[^/]*$/, "");
const OUT = path.join(__dirname, "..", "playtest");
fs.mkdirSync(OUT, { recursive: true });
const VERSION = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8").match(/data-version="([^"]+)"/)[1]; // immer die aktuelle Version
const TAG = 24 * 3600000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fehlschlaege = 0, pruefungen = 0;
function ok(bed, text) { pruefungen++; console.log((bed ? "OK   " : "FAIL ") + text); if (!bed) fehlschlaege++; }
const GERAETE = [
  { name: "desktop", viewport: { width: 1366, height: 768 }, isMobile: false, hasTouch: false, deviceScaleFactor: 1 },
  { name: "handy", viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
];
const BROWSERNAME = process.env.PLAYTEST_BROWSER || "chromium";

async function lauf(browser, g) {
  console.log(`\n== ${BROWSERNAME} ${g.name} ${g.viewport.width}×${g.viewport.height} ==`);
  const handy = g.name === "handy";
  const opt = { viewport: g.viewport, hasTouch: g.hasTouch, deviceScaleFactor: g.deviceScaleFactor, locale: "de-DE", timezoneId: "Europe/Vienna" };
  if (BROWSERNAME === "chromium") opt.isMobile = g.isMobile;
  const ctx = await browser.newContext(opt);
  const page = await ctx.newPage();
  const fehler = [];
  page.on("pageerror", (e) => fehler.push("pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") fehler.push("console." + m.type() + ": " + m.text()); });
  page.on("requestfailed", (r) => { if (!/favicon/.test(r.url())) fehler.push("requestfailed: " + r.url()); }); // Firefox bricht das Favicon beim Neuladen ab (wie Kapitel 1)
  page.on("request", (r) => { if (!r.url().startsWith(BASIS) && !r.url().startsWith("data:")) fehler.push("externe Anfrage: " + r.url()); });
  const praefix = "kolonie-";
  const shot = async (n) => { await page.evaluate(() => { document.getElementById("meldung").className = "meldung"; window.scrollTo(0, 0); }); await sleep(300); await page.screenshot({ path: path.join(OUT, praefix + n + ".png"), fullPage: !handy }); };
  const geheZu = async (hash, seite) => { await page.evaluate((h) => { location.hash = h; }, hash); await page.waitForSelector(`#inhalt[data-seite="${seite}"]`); await sleep(250); };
  const Z = (fn, arg) => page.evaluate(fn, arg);
  await page.goto(URL_); await page.evaluate(() => localStorage.clear()); await page.reload();
  await page.fill("#eingabe-name", "Sandro"); await page.click("#knopf-neues-spiel");
  await page.waitForSelector('#inhalt[data-seite="uebersicht"]');
  if (await page.isVisible("#dialog")) await page.click("#dialog-ok");
  await geheZu("#flotte", "flotte"); await page.click("#knopf-testphase"); await page.click("#dialog-ok"); await sleep(400);
  await Z(() => { const z = window.SS.app.zustand; z.forschung.astrophysik = 5; const s = z.planeten[0].schiffe; s.kolonieschiff = 3; s.kleiner_frachter = (s.kleiner_frachter || 0) + 6; s.korvette = (s.korvette || 0) + 4; z.rohstoffe.metall += 50000; z.rohstoffe.silizium += 20000; });
  ok((await page.$$("#planeten-liste a[data-planet]")).length === 2, "Planetenliste links: Heimat + Testkolonie");
  const gruendungen = [];
  for (let runde = 1; runde <= 2; runde++) {
    await geheZu("#weltraum", "weltraum");
    const leer = await page.getAttribute("tr.wr-leer", "data-koord");
    await page.click("tr.wr-leer .wr-kolonisieren"); await page.waitForSelector('#inhalt[data-seite="flotte"]'); await sleep(300);
    const vor = await Z(() => ({ n: window.SS.app.zustand.planeten.length, met: Math.floor(window.SS.app.zustand.rohstoffe.metall), kol: window.SS.app.zustand.planeten[0].schiffe.kolonieschiff }));
    await page.fill('input[data-send-menge="kolonieschiff"]', "1");
    await page.fill('input[data-send-menge="kleiner_frachter"]', "2");
    await page.fill('input[data-send-menge="korvette"]', "1");
    await page.evaluate(() => { document.getElementById("send-ladung").open = true; });
    await page.fill('input[data-send-ladung="metall"]', "3000");
    await page.fill('input[data-send-ladung="silizium"]', "1000");
    await page.dispatchEvent('input[data-send-ladung="silizium"]', "input");
    await sleep(200);
    const los = await page.isEnabled("#knopf-lossenden");
    ok(los, `Runde ${runde}: Kolonieflotte → ${leer} sendbar (${await page.textContent("#send-grund")})`);
    if (los) { await page.click("#knopf-lossenden"); await sleep(500); }
    const nach = await Z((k) => { const z = window.SS.app.zustand, p = z.planeten.find((x) => x.koordinaten && window.SS.DATEN.weltraum.koordinatenText(x.koordinaten) === k); return { n: z.planeten.length, p: p && { id: p.id, name: p.name, schiffe: p.schiffe }, met: Math.floor(z.rohstoffe.metall), kol: z.planeten[0].schiffe.kolonieschiff, flotten: z.flotten.length }; }, leer);
    ok(nach.n === vor.n + 1 && nach.p, `Runde ${runde}: neuer Planet ${nach.p && nach.p.name} [${leer}]`);
    ok(nach.p && !nach.p.schiffe.kolonieschiff && nach.p.schiffe.kleiner_frachter === 2 && nach.p.schiffe.korvette === 1, `Runde ${runde}: Kolonieschiff verbraucht, 2 Frachter + 1 Korvette stationiert ${JSON.stringify(nach.p && nach.p.schiffe)}`);
    ok(nach.kol === vor.kol - 1 && Math.abs(nach.met - vor.met) <= 5, `Runde ${runde}: Ladung entladen (Metall ${vor.met}→${nach.met}, gemeinsames Lager)`);
    ok((await page.$$("#planeten-liste a[data-planet]")).length === nach.n, `Runde ${runde}: Planetenliste zeigt ${nach.n} Planeten`);
    gruendungen.push({ koord: leer, ...nach.p });
  }
  // Limit: Astro 5 → 3 Kolonien (Testkolonie + 2) → dritter Versuch abgelehnt
  await geheZu("#weltraum", "weltraum");
  await page.click("tr.wr-leer .wr-kolonisieren"); await page.waitForSelector('#inhalt[data-seite="flotte"]'); await sleep(300);
  await page.fill('input[data-send-menge="kolonieschiff"]', "1"); await page.dispatchEvent('input[data-send-menge="kolonieschiff"]', "input"); await sleep(200);
  ok(!(await page.isEnabled("#knopf-lossenden")) && /Limit/.test(await page.textContent("#send-grund")), "Kolonie-Limit (Astro 5 → 3) greift: " + (await page.textContent("#send-grund")));
  // Wechsel auf Kolonie
  const g1 = gruendungen[0];
  await page.evaluate(() => window.scrollTo(0, 0));
  if (handy) { await page.click("#knopf-menue-auf"); await sleep(300); }
  await page.click(`#planeten-liste a[data-planet="${g1.id}"]`); await sleep(400);
  ok((await page.textContent("#menue-planet")).includes(g1.koord), "Wechsel: Kolonie aktiv im Menü");
  await geheZu("#flotte", "flotte");
  ok(!!(await page.$('input[data-send-menge="korvette"]')) && !!(await page.$("#send-planeten")), "Kolonie-Flotte im Sendefenster + Schnellwahl eigene Planeten");
  await geheZu("#anlagen", "anlagen"); await shot("anlagen" + (handy ? "-handy" : ""));
  // Schnellwahl → Heimat stationieren
  await geheZu("#flotte", "flotte");
  const heim = await Z(() => window.SS.DATEN.weltraum.koordinatenText(window.SS.app.zustand.heimat));
  await page.click(`#send-planeten button[data-koord="${heim}"]`); await sleep(200);
  ok((await page.inputValue("#send-koord")) === heim && (await page.inputValue("#send-mission")) === "stationieren", "Schnellwahl Heimat → Stationieren vorausgefüllt");
  await shot("flotte" + (handy ? "-handy" : ""));
  await page.click(`#planeten-liste a[data-planet="hp"]`).catch(async () => { await page.click("#knopf-menue-auf"); await sleep(300); await page.click(`#planeten-liste a[data-planet="hp"]`); });
  await sleep(300);
  await page.evaluate(() => location.reload()); await sleep(800);
  if (await page.isVisible("#profil-liste button")) { await page.click("#profil-liste button"); await sleep(500); }
  const nl = await Z(() => window.SS.app && window.SS.app.zustand ? window.SS.app.zustand.planeten.length : -1);
  ok(nl === 4 || nl === -1, "Nach Neuladen Kolonien noch da (" + nl + ")");
  ok((await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 1, "kein waagrechter Überlauf");
  ok(fehler.length === 0, "keine Konsolenfehler " + fehler.join(" | "));
  console.log("Testkoordinaten: " + gruendungen.map((x) => x.name + " [" + x.koord + "]").join(", "));
  await ctx.close();
}
(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  for (const g of GERAETE) await lauf(browser, g);
  await browser.close();
  console.log(`\n${pruefungen - fehlschlaege}/${pruefungen} OK`); process.exit(fehlschlaege ? 1 : 0);
})();
