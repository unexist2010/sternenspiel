// Browser-Playtest Kapitel 6 (0.13.0): Flotte – Flottenfenster, Presets, Sendefenster, Flug, rechte Seitenleiste, keine Verteidigungsflotte.
// Aufruf:  node tests/playtest-kapitel6.js                  → file:// (ohne Server)
//          LIVE_URL=https://unexist2010.github.io/sternenspiel/ node tests/playtest-kapitel6.js
//          PLAYTEST_BROWSER=firefox node tests/playtest-kapitel6.js
// Desktop 1366×768 und Handy 412×915. Screenshots: playtest/kapitel6-*.png
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
  const praefix = `kapitel6-${BROWSERNAME === "chromium" ? "" : BROWSERNAME + "-"}${LIVE ? "live-" : ""}`;
  const shot = async (n, ganz) => { await page.evaluate(() => { document.getElementById("meldung").className = "meldung"; }); if (ganz) await page.evaluate(() => window.scrollTo(0, 0)); await sleep(300); await page.screenshot({ path: path.join(OUT, praefix + n + ".png"), fullPage: !!ganz }); };
  const ueberlauf = () => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  const geheZu = async (hash, seite) => { await page.evaluate((h) => { location.hash = h; }, hash); await page.waitForSelector(`#inhalt[data-seite="${seite}"]`); await sleep(250); };
  const Z = (fn, arg) => page.evaluate(fn, arg);
  const aendern = async (fn, arg) => { await Z(fn, arg); await Z(() => { window.SS.app.speichern(true); window.SS.app.route(true); }); await sleep(200); };

  await page.goto(URL_);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  ok((await page.getAttribute("html", "data-version")) === VERSION && (await Z(() => window.SS.VERSION)) === VERSION, `Version ${VERSION}`);
  ok(/Kapitel 6 · Flotte/.test(await page.textContent(".fusszeile")), "Fußzeile: Kapitel 6 · Flotte");
  await page.fill("#eingabe-name", "Sandro");
  await page.click("#knopf-neues-spiel");
  await page.waitForSelector('#inhalt[data-seite="uebersicht"]');
  if (await page.isVisible("#dialog")) await page.click("#dialog-ok");
  ok(await page.isVisible("#flotten-leiste") && /Keine Flotte unterwegs/.test(await page.textContent("#flotten-leiste")), "Seitenleiste sichtbar: keine Flotte");

  // Leerer Planet
  await geheZu("#flotte", "flotte");
  ok(await page.isVisible("#box-startbahnen") && await page.isVisible("#box-hangar"), "Flottenfenster: Startbahnen + Hangar");
  ok(/Startplätze/.test(await page.textContent("#fl-hinweis").catch(() => "")), "Ohne Startplätze: Hinweis Raumflughafen");

  // Ausstattung
  await aendern(() => { const z = window.SS.app.zustand, p = z.planeten[0];
    p.gebaeude.raumflughafen = 2; p.startplaetze = [{ buchstabe: "A", stufe: 3 }];
    p.schiffe = { kleine_drohne: 400, kreuzer: 60, schlachtschiff: 20, kleiner_frachter: 30, spionagesonde: 10 }; p.solarsatelliten = 12;
    p.verteidigung = { orbitalverteidigungsplattform: 2, raketenbatterie: 20 }; z.rohstoffe.rohoel = 1e7; });
  const kap = await Z(() => window.SS.kern.bau.kapazitaet(window.SS.app.zustand.planeten[0]));
  const zahl = async (sel) => Number((await page.textContent(sel)).replace(/\D/g, ""));
  ok(kap > 0 && (await zahl("#fl-startbahn")) === Math.min(kap, 520), `Startbahnen voll: ${await zahl("#fl-startbahn")} von ${kap}`);
  ok(/starten bei einem Angriff/.test(await page.textContent("#fl-verteidigung")), "Hinweis: Verteidigungsflotte aktiv");
  await shot("flottenfenster" + (handy ? "-handy" : ""), true);
  for (const pr of ["starke_energie", "starke_metall", "max_feuerkraft", "gesunder_mix"]) {
    await page.selectOption("#flotte-preset", pr); await sleep(250);
    ok((await Z(() => window.SS.app.zustand.planeten[0].flotte.preset)) === pr && (await zahl("#fl-startbahn")) === Math.min(kap, 520), "Preset " + pr + " gespeichert, Startbahn voll");
  }
  await page.selectOption("#flotte-preset", "max_feuerkraft"); await sleep(250);
  ok(/Schlachtschiff/.test(await page.textContent("#liste-startbahn")), "Max. Feuerkraft: Schlachtschiffe auf Startbahn");

  // Sendefenster
  await page.click("#knopf-senden"); await page.waitForSelector("#send-box"); await sleep(200);
  ok(await page.isDisabled("#knopf-lossenden"), "Lossenden gesperrt ohne Auswahl");
  ok(!(await page.$('input[data-send-menge="solarsatellit"]')), "Solarsatelliten nicht wählbar");
  await page.fill('input[data-send-menge="kleine_drohne"]', String(kap + 1)); await sleep(150);
  ok(/Startplätze frei/.test(await page.textContent("#send-grund")), "Über Kapazität: Grund angezeigt");
  const n = Math.floor(kap * 0.7);
  await page.fill('input[data-send-menge="kleine_drohne"]', String(n - 5));
  await page.fill('input[data-send-menge="spionagesonde"]', "5");
  const zielTxt = await Z(() => { const h = window.SS.app.zustand.heimat, W = window.SS.DATEN.weltraum; const s = h.system > 200 ? h.system - 4 : h.system + 4; return W.koordinatenText({ sektor: W.sektorVonSystem(s), system: s, planet: 7 }); });
  await page.fill("#send-koord", zielTxt); await sleep(150);
  await page.click('[data-aktion="send-favorit"]'); await sleep(300);
  ok((await Z(() => window.SS.app.zustand.favoriten.length)) === 1 && /★/.test(await page.textContent("#send-ziel")), "Favorit gespeichert und im Dropdown");
  ok((await page.inputValue('input[data-send-menge="kleine_drohne"]')) === String(n - 5), "Auswahl bleibt nach Favorit erhalten");
  await page.selectOption("#send-mission", "spionieren"); await sleep(200);
  ok(!(await page.isDisabled("#knopf-lossenden")) && /\d/.test(await page.textContent("#send-dauer")), "Vorschau: Flugzeit + Lossenden aktiv");
  await shot("sendefenster" + (handy ? "-handy" : ""), true);
  await page.click("#knopf-lossenden");
  await page.waitForSelector('#inhalt[data-seite="flotte"][data-unterseite=""]'); await sleep(300);
  ok((await zahl("#fl-unterwegs")) === n && (await zahl("#fl-frei")) === kap - n, `Nach Start: ${n} belegt, ${kap - n} frei`);
  ok((await zahl("#fl-startbahn")) === kap - n, "Rest-Startbahn nach Preset neu gefüllt");
  ok(/starten bei einem Angriff/.test(await page.textContent("#fl-verteidigung")), "Teilbelegung: Rest-Startbahn verteidigt (t30u)");
  ok(/Spionieren/.test(await page.textContent("#flotten-leiste")) && (await page.$$("#flotten-leiste .flug")).length === 1, "Seitenleiste zeigt Flug");
  const r1 = await page.textContent("#flotten-leiste [data-live^=flug-rest]"); await sleep(2200);
  ok(r1 !== await page.textContent("#flotten-leiste [data-live^=flug-rest]"), "Restzeit läuft live");
  const kampf = await Z(() => { const S = window.SS, z = S.app.zustand, p = z.planeten[0]; const b = S.kern.kampf.simuliere(z, p, { angreifer: { kleine_drohne: 5 } }); return b.orbit.map((x) => x.id); });
  ok(kampf.includes("orbitalverteidigungsplattform") && kampf.length > 1, "Kampf: Teilbelegung – Rest-Startbahn kämpft mit Plattform");
  ok(await page.$("#tab-startplatz[open]") && await page.$("#tab-hangar[open]") && await page.$("#send-box"), "Tabs Startplatz/Hangar + Senden im Flottenfenster");
  await shot("unterwegs" + (handy ? "-handy" : ""), !handy);
  for (const s of ["#uebersicht", "#werft"]) { await geheZu(s, s.slice(1)); ok((await page.$$("#flotten-leiste .flug")).length === 1, "Leiste auch auf " + s); }
  if (!handy) await shot("leiste-werft");
  // Zeitsprung: Rückkehr
  await Z(() => { const z = window.SS.app.zustand; z.flotten.forEach((f) => { f.abflug -= 1e9; f.ankunft -= 1e9; }); });
  await sleep(1500);
  await Z(() => { const z = window.SS.app.zustand; z.flotten.forEach((f) => { f.rueckkehr -= 2e9; }); });
  await sleep(1500);
  ok((await Z(() => window.SS.app.zustand.flotten.length)) === 0 && /Keine Flotte unterwegs/.test(await page.textContent("#flotten-leiste")), "Flotte zurück, Leiste leer");
  ok((await Z(() => window.SS.app.zustand.planeten[0].schiffe.kleine_drohne)) === 400, "Schiffe wieder am Planeten");
  ok(await ueberlauf() <= 0, "Kein waagrechter Überlauf");
  ok(fehler.length === 0, "Keine Konsolen-/Seitenfehler, keine externen Anfragen" + (fehler.length ? ":\n  " + fehler.map((x) => JSON.stringify(x)).join("\n  ") : ""));
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
