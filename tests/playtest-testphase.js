// Browser-Playtest Testphase (0.14.1): Test-Seed, Flug, Transport, Spionage, Angriff Orbit+Boden, Kampfbericht.
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
  const praefix = `testphase-${BROWSERNAME === "chromium" ? "" : BROWSERNAME + "-"}${LIVE ? "live-" : ""}`;
  const shot = async (n, ganz) => { await page.evaluate(() => { document.getElementById("meldung").className = "meldung"; }); if (ganz) await page.evaluate(() => window.scrollTo(0, 0)); await sleep(300); await page.screenshot({ path: path.join(OUT, praefix + n + ".png"), fullPage: !!ganz }); };
  const ueberlauf = () => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  const geheZu = async (hash, seite) => { await page.evaluate((h) => { location.hash = h; }, hash); await page.waitForSelector(`#inhalt[data-seite="${seite}"]`); await sleep(250); };
  const Z = (fn, arg) => page.evaluate(fn, arg);
  const aendern = async (fn, arg) => { await Z(fn, arg); await Z(() => { window.SS.app.speichern(true); window.SS.app.route(true); }); await sleep(200); };

  await page.goto(URL_);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  ok((await page.getAttribute("html", "data-version")) === VERSION && (await Z(() => window.SS.VERSION)) === VERSION, `Version ${VERSION}`);
  await page.fill("#eingabe-name", "Sandro");
  await page.click("#knopf-neues-spiel");
  await page.waitForSelector('#inhalt[data-seite="uebersicht"]');
  if (await page.isVisible("#dialog")) await page.click("#dialog-ok");
  await geheZu("#flotte", "flotte");
  ok(await page.isVisible("#knopf-testphase"), "Knopf „Testphase laden“");
  await page.click("#knopf-testphase"); await page.click("#dialog-ok"); await sleep(400);
  const st = await Z(() => { const z = window.SS.app.zustand; return { master: z.einstellungen.master, g: z.gegner.length, pl: z.planeten.length }; });
  ok(st.master && st.g === 2 && st.pl === 2, "Testphase: Master, 2 Gegner, Zweitplanet");
  ok((await page.$$("#liste-gegner li")).length === 2, "Gegnerliste sichtbar");
  ok((await page.$$('#send-ziel optgroup[label="Gegner"] option')).length === 2, "Ziel-Dropdown: Optgroup Gegner");
  await shot("seed" + (handy ? "-handy" : ""), !handy);
  const gk = await Z(() => window.SS.app.zustand.gegner.map((g) => window.SS.DATEN.weltraum.koordinatenText(g)));
  const kk = await Z(() => window.SS.DATEN.weltraum.koordinatenText(window.SS.app.zustand.planeten[1].koordinaten));
  const senden = async (schiffe, koord, mission, ladung) => {
    await geheZu("#flotte", "flotte");
    for (const [id, n] of Object.entries(schiffe)) await page.fill(`input[data-send-menge="${id}"]`, String(n));
    await page.fill("#send-koord", koord); await page.dispatchEvent("#send-koord", "input");
    await page.selectOption("#send-mission", mission); await page.dispatchEvent("#send-mission", "change");
    if (ladung) { await page.click("#send-ladung summary"); for (const [r, n] of Object.entries(ladung)) await page.fill(`input[data-send-ladung="${r}"]`, String(n)); await page.dispatchEvent(`input[data-send-ladung="metall"]`, "input"); }
    await sleep(150);
    const dis = await page.$eval("#knopf-lossenden", (b) => b.disabled);
    if (dis) console.log("  Grund:", await page.textContent("#send-grund"));
    await page.click("#knopf-lossenden"); await sleep(400);
    await page.waitForSelector('#inhalt[data-seite="flotte"]');
  };
  // Flottenflug (Unterstützen beim Gegner, Master sofort)
  await senden({ korvette: 2 }, gk[1], "unterstuetzen");
  ok((await Z(() => window.SS.app.zustand.flotten.length)) === 0 && (await Z(() => window.SS.app.zustand.planeten[0].schiffe.korvette)) === 12, "Flottenflug: sofort hin + zurück");
  // Transport zur Testkolonie
  const met = await Z(() => window.SS.app.zustand.rohstoffe.metall);
  await senden({ kleiner_frachter: 2 }, kk, "transportieren", { metall: 1000 });
  ok((await Z(() => window.SS.app.zustand.flotten.length)) === 0 && Math.abs((await Z(() => window.SS.app.zustand.rohstoffe.metall)) - met) < 1e6, "Transport: entladen, Frachter zurück");
  // Spionage
  await senden({ spionagesonde: 1 }, gk[0], "spionieren");
  ok(await page.isVisible("#box-spionage") && /Kleine Drohne/.test(await page.textContent("#spionage-bericht")), "Spionagebericht sichtbar");
  // Angriff Alpha + Beta
  for (const [i, k] of gk.entries()) {
    await senden({ korvette: 4, zerstoerer: 3, kreuzer: 2 }, k, "angriff");
    const b = await Z(() => { const b = window.SS.app.zustand.letzterKampfbericht; return b && { id: b.ziel.id, p1: b.phasen[0].runden.length, p2: b.phasen[1].runden.length, sieger: b.sieger }; });
    ok(b && b.p1 > 0 && b.p2 > 0, `Angriff ${i + 1}: Phase 1 (${b && b.p1} Runden) + Phase 2 (${b && b.p2} Runden)`);
    ok(await page.isVisible("#box-kampfbericht") && (await page.$$('#box-kampfbericht .kb-phase')).length === 2 && await page.isVisible("#box-kampfbericht #kb-truemmer"), "Kampfbericht-Box: 2 Phasen + Trümmer");
    ok((await page.$$("#box-kampfbericht .kb-runde-zeile")).length > 0, "Runden-Zeilen mit Verlusten");
    await page.$eval("#box-kampfbericht", (e) => e.scrollIntoView());
    await sleep(200);
    await page.screenshot({ path: path.join(OUT, praefix + "angriff-" + (i + 1) + (handy ? "-handy" : "") + ".png") });
  }
  ok((await Z(() => window.SS.app.zustand.flotten.length)) === 0, "Angreifer zurück");
  ok(await ueberlauf() <= 0, "Kein waagrechter Überlauf");
  ok(fehler.length === 0, "Keine Konsolen-/Seitenfehler" + (fehler.length ? ":\n  " + fehler.join("\n  ") : ""));
  await ctx.close();
}
(async () => {
  console.log("Browser:", BROWSERNAME, "\nURL:", URL_);
  const browser = BROWSERNAME === "firefox" ? await PW.firefox.launch({ headless: true })
    : await chromium.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox", "--disable-gpu"] });
  try { for (const g of GERAETE) await lauf(browser, g); }
  finally { await browser.close(); }
  console.log(`\n${pruefungen - fehlschlaege}/${pruefungen} Prüfungen grün` + (fehlschlaege ? ` – ${fehlschlaege} FEHLGESCHLAGEN` : " – ALLE GRÜN"));
  process.exit(fehlschlaege ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
