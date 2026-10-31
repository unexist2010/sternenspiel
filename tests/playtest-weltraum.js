// Browser-Playtest Weltraum (0.16.0): Systemansicht 1–12, Alpha/Beta Spionage (Auto-Sonde) + Angriff, Kolonisieren, Expedition.
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
  const praefix = "weltraum-";
  const shot = async (n) => { await page.evaluate(() => { document.getElementById("meldung").className = "meldung"; window.scrollTo(0, 0); }); await sleep(300); await page.screenshot({ path: path.join(OUT, praefix + n + ".png"), fullPage: !handy }); };
  const geheZu = async (hash, seite) => { await page.evaluate((h) => { location.hash = h; }, hash); await page.waitForSelector(`#inhalt[data-seite="${seite}"]`); await sleep(250); };
  const Z = (fn, arg) => page.evaluate(fn, arg);
  await page.goto(URL_); await page.evaluate(() => localStorage.clear()); await page.reload();
  await page.fill("#eingabe-name", "Sandro"); await page.click("#knopf-neues-spiel");
  await page.waitForSelector('#inhalt[data-seite="uebersicht"]');
  if (await page.isVisible("#dialog")) await page.click("#dialog-ok");
  await geheZu("#flotte", "flotte"); await page.click("#knopf-testphase"); await page.click("#dialog-ok"); await sleep(400);
  const gk = await Z(() => window.SS.app.zustand.gegner.map((g) => window.SS.DATEN.weltraum.koordinatenText(g)));
  await geheZu("#weltraum", "weltraum");
  ok(!(await page.$(".platzhalter")), "Weltraum ohne Platzhalter");
  ok((await page.$$("#wr-tabelle tbody tr")).length === 13, "12 Positionen + Expeditionsraum");
  ok((await page.$$("#wr-fenster li")).length === 5, "5 Sonnensysteme im Sektor-Fenster");
  ok((await page.$$("tr.wr-gegner")).length === 2, "Alpha + Beta sichtbar");
  ok((await page.$$("tr.wr-leer .wr-spionieren, tr.wr-leer .wr-angriff")).length === 0 && (await page.$$("tr.wr-leer .wr-kolonisieren")).length === 8, "Leer: nur Kolonisieren");
  await shot("system" + (handy ? "-handy" : ""));
  for (const k of gk) {
    const vorher = await Z(() => window.SS.app.zustand.planeten[0].schiffe.spionagesonde || 0);
    const berichtVorher = await Z(() => (window.SS.app.zustand.letzterSpionagebericht || {}).zeit || 0);
    await geheZu("#weltraum", "weltraum");
    await page.click(`tr[data-koord="${k}"] .wr-spionieren`); await page.waitForSelector('#inhalt[data-seite="flotte"]'); await sleep(400);
    ok((await page.inputValue("#send-mission")) === "spionieren" && (await page.inputValue("#send-koord")) === k, `Spionage ${k}: Flotte mit Mission + Koordinaten`);
    const s = await Z(() => ({ n: window.SS.app.zustand.planeten[0].schiffe.spionagesonde || 0, b: window.SS.app.zustand.letzterSpionagebericht }));
    ok(s.b && window_k(s.b) === k, `Spionage ${k}: Sonde automatisch geflogen, Bericht da (Sonden ${vorher}→${s.n})`);
    await geheZu("#weltraum", "weltraum");
    await page.click(`tr[data-koord="${k}"] .wr-angriff`); await page.waitForSelector('#inhalt[data-seite="flotte"]'); await sleep(300);
    ok((await page.inputValue("#send-mission")) === "angriff" && (await page.inputValue("#send-koord")) === k, `Angriff ${k}: vorausgefüllt`);
    await page.fill('input[data-send-menge="kreuzer"]', "5").catch(() => {}); await Z(() => window.SS.app.route && 0);
    await page.dispatchEvent('input[data-send-menge]', "input").catch(() => {});
    const los = await page.isEnabled("#knopf-lossenden");
    if (los) { await page.click("#knopf-lossenden"); await sleep(400); }
    ok(los && (await Z(() => !!window.SS.app.zustand.letzterKampfbericht)), `Angriff ${k}: gesendet, Kampfbericht`);
  }
  await geheZu("#weltraum", "weltraum");
  const leer = await page.getAttribute("tr.wr-leer", "data-koord");
  await page.click("tr.wr-leer .wr-kolonisieren"); await page.waitForSelector('#inhalt[data-seite="flotte"]'); await sleep(300);
  ok((await page.inputValue("#send-mission")) === "kolonisieren" && (await page.inputValue("#send-koord")) === leer, "Kolonisieren vorausgefüllt");
  await geheZu("#weltraum", "weltraum");
  await page.click("tr.wr-expedition .wr-expedition"); await page.waitForSelector('#inhalt[data-seite="flotte"]'); await sleep(300);
  ok((await page.inputValue("#send-mission")) === "expedition" && /:13$/.test(await page.inputValue("#send-koord")), "Expedition :13 vorausgefüllt");
  await page.evaluate(() => { window.SS.app.zustand.planeten[0].schiffe.spionagesonde = 0; });
  await geheZu("#weltraum", "weltraum");
  await page.click(`tr[data-koord="${gk[0]}"] .wr-spionieren`); await page.waitForSelector('#inhalt[data-seite="flotte"]'); await sleep(300);
  ok((await page.inputValue("#send-mission")) === "spionieren" && /Spionagesonde/.test(await page.textContent("#meldung")), "Ohne Sonde: Flotte + Hinweis");
  await geheZu("#weltraum/system/" + (await Z(() => window.SS.app.zustand.heimat.system + 1)), "weltraum");
  ok(await page.isVisible("#wr-tabelle"), "Navigation Nachbarsystem");
  ok((await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 1, "kein waagrechter Überlauf");
  ok(fehler.length === 0, "keine Konsolenfehler " + fehler.join(" | "));
  await ctx.close();
}
function window_k(b) { return b.koordinaten.sektor + ":" + b.koordinaten.system + ":" + b.koordinaten.planet; }
(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  for (const g of GERAETE) await lauf(browser, g);
  await browser.close();
  console.log(`\n${pruefungen - fehlschlaege}/${pruefungen} OK`); process.exit(fehlschlaege ? 1 : 0);
})();
