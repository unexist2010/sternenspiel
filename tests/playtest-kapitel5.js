// Browser-Playtest Kapitel 5 (0.12.0): Verteidigung – ohne Verteidigungswerft, 10 Anlagen, Bau, Warteschlange, Übersicht, Info, Kampf-Simulator, Offline, Master.
// Aufruf:  node tests/playtest-kapitel5.js                  → file:// (ohne Server)
//          LIVE_URL=https://unexist2010.github.io/sternenspiel/ node tests/playtest-kapitel5.js
//          PLAYTEST_BROWSER=firefox node tests/playtest-kapitel5.js
// Desktop 1366×768 und Handy 412×915. Screenshots: playtest/kapitel5-*.png
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
  const praefix = `kapitel5-${BROWSERNAME === "chromium" ? "" : BROWSERNAME + "-"}${LIVE ? "live-" : ""}`;
  const shot = async (n, ganz) => { await page.evaluate(() => { document.getElementById("meldung").className = "meldung"; }); if (ganz) await page.evaluate(() => window.scrollTo(0, 0)); await sleep(300); await page.screenshot({ path: path.join(OUT, praefix + n + ".png"), fullPage: !!ganz }); };
  const ueberlauf = () => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  const geheZu = async (hash, seite) => { await page.evaluate((h) => { location.hash = h; }, hash); await page.waitForSelector(`#inhalt[data-seite="${seite}"]`); await sleep(250); };
  const Z = (fn, arg) => page.evaluate(fn, arg);
  const stufe = (id) => Z((i) => window.SS.app.zustand.planeten[0].gebaeude[i], id);
  const klickBauen = async (id) => { await page.click(`article.anlage[data-gebaeude="${id}"] button[data-aktion="bauen"]`); await sleep(150); };
  // Info-Fenster vollständig im sichtbaren Bereich?
  const infoImBild = () => page.evaluate(() => {
    const f = document.getElementById("infofenster"); if (f.hidden) return { sichtbar: false };
    const r = f.getBoundingClientRect(), vw = document.documentElement.clientWidth, vh = window.innerHeight;
    return { sichtbar: true, imBild: r.left >= 0 && r.top >= 0 && r.right <= vw + 0.5 && r.bottom <= vh + 0.5, zeilen: f.querySelectorAll("tbody tr").length, text: f.textContent, r: [r.left, r.top, r.right, r.bottom].map(Math.round), vw, vh };
  });
  const oeffneInfo = async (sel) => {
    if (!handy) { await page.mouse.move(683, 2); await sleep(400); }
    const k = page.locator(sel).first();
    await k.evaluate((e) => e.scrollIntoView({ block: "center" })); await sleep(250); // Scroll-Ereignis abwarten (schließt ein Hover-Fenster)
    if (handy) await k.tap(); else { const b = await k.boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 3 }); }
    await page.waitForSelector("#infofenster:not([hidden])", { timeout: 3000 }).catch(() => {});
    await sleep(150);
    if (!handy && await page.isHidden("#infofenster")) { // ein spätes Scroll-Ereignis (nach Ganzseiten-Screenshot) schließt Hover-Fenster → erneut zeigen
      await page.mouse.move(5, 5); await sleep(300); await k.hover(); await sleep(200);
    }
    return infoImBild();
  };
  const schliesseInfo = async () => {
    if (handy) { await page.tap("#infofenster .info-zu"); }
    else { await page.mouse.move(5, g.viewport.height - 5); }
    await sleep(350);
  };
  const kachelIds = () => page.$$eval("article.def-kachel", (k) => k.map((x) => x.getAttribute("data-def")));
  const aendern = async (fn, arg) => { await Z(fn, arg); await Z(() => { window.SS.app.speichern(); window.SS.app.route(true); }); await sleep(200); };
  const grund = (id) => page.textContent(`article[data-def="${id}"] .grund`).then((t) => t.trim()).catch(() => "");
  const anzahl = (id) => Z((i) => window.SS.app.zustand.planeten[0].verteidigung[i] || 0, id);
  const q = () => Z(() => window.SS.app.zustand.planeten[0].verteidigungsauftraege.length);

  await page.goto(URL_);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  ok((await page.getAttribute("html", "data-version")) === VERSION && (await Z(() => window.SS.VERSION)) === VERSION, `Version ${VERSION}`);
  ok(/Kapitel 5 · Verteidigung/.test(await page.textContent(".fusszeile")), "Fußzeile: Kapitel 5 · Verteidigung");
  await page.fill("#eingabe-name", "Sandro");
  await page.click("#knopf-neues-spiel");
  await page.waitForSelector('#inhalt[data-seite="uebersicht"]');
  ok(await Z(() => { const z = window.SS.app.zustand, p = z.planeten[0]; return z.version === 9 && JSON.stringify(p.verteidigung) === "{}" && Array.isArray(p.verteidigungsauftraege) && p.truemmer && p.truemmer.orbit; }), "Spielstand v9: leerer Verteidigungsbestand, Trümmerfeld");
  ok(/Verteidigungswerft bauen/.test(await page.textContent("#def-box")), "Übersicht: Verteidigungs-Kasten mit Link");

  await geheZu("#verteidigung", "verteidigung");
  ok(await page.isVisible("#def-hinweis") && (await kachelIds()).length === 0, "Ohne Verteidigungswerft: Hinweis, keine Kacheln");
  ok(await page.isVisible("#waffen-tabelle") && (await page.$$eval("#waffen-tabelle tbody tr", (r) => r.length)) === 7, "Waffentabelle: 7 Waffentypen");
  await page.click("#knopf-vw-bauen");
  await page.waitForSelector('#inhalt[data-seite="anlagen"]');
  ok(true, "Link führt zu Anlagen");

  await aendern(() => { const z = window.SS.app.zustand; z.planeten[0].gebaeude.verteidigungswerft = 2; Object.assign(z.rohstoffe, { metall: 5e7, silizium: 5e7, rohoel: 5e7, kunststoff_t1: 1e6, kunststoff_t2: 1e6, kunststoff_t3: 1e6 }); });
  await geheZu("#verteidigung", "verteidigung");
  const ids = await kachelIds();
  ok(ids.length === 10 && ids.includes("orbitalverteidigungsplattform") && ids.includes("maschinennest"), `10 Anlagen sichtbar inkl. Orbitalplattform (${ids.length})`);
  ok((await page.$$eval("section[data-def-gruppe]", (s) => s.map((x) => x.getAttribute("data-def-gruppe")))).join() === "geschuetz,schild,orbit", "Gruppen Geschütze, Schilde, Orbit");
  ok((await page.$$eval("article.def-kachel img.anlage-bild", (im) => im.filter((i) => i.complete && i.naturalWidth > 0).length)) === 10, "Bilder der 10 Anlagen geladen");
  ok(/Energiehülle \/ Metallhülle/.test(await page.textContent('article[data-def="laserturm"]')), "Kachel zeigt beide Hüllen");
  const gesperrt = await page.$$eval("article.def-kachel.gesperrt", (k) => k.length);
  ok(gesperrt > 0, `Anlagen mit fehlender Forschung gesperrt (${gesperrt})`);

  await aendern(() => { const z = window.SS.app.zustand; Object.assign(z.forschung, { energie: 20, laser: 20, ionen: 20, plasma: 20, waffen: 20, schild: 20, panzerung: 20, computer: 20, spionage: 20, hyperspace: 20, verbrennung: 20, impuls: 20 }); });
  await page.fill('input[data-def-menge="raketenbatterie"]', "5");
  await page.click('article[data-def="raketenbatterie"] button[data-aktion="def-bauen"]'); await sleep(250);
  ok((await q()) === 1, "Auftrag 5× Raketenbatterie gestartet");
  await page.click('article[data-def="schildkuppel"] button[data-aktion="def-bauen"]'); await sleep(250);
  ok((await q()) === 2 && /wartet/.test(await page.textContent('#def-box [data-live="vert-rest:1"]')), "Zweiter Auftrag wartet");
  ok(!(await page.isEnabled('article[data-def="schildkuppel"] button[data-aktion="def-bauen"]')) && /höchstens|bereits|max/i.test(await grund("schildkuppel")), "Schildkuppel höchstens 1 (" + await grund("schildkuppel") + ")");
  await geheZu("#anlagen", "anlagen");
  ok(/Verteidigungswerft/.test(await page.textContent('article[data-gebaeude="verteidigungswerft"] .grund')), "Anlagen: Ausbau während Bau gesperrt");
  await geheZu("#uebersicht", "uebersicht");
  ok(/5× Raketenbatterie/.test(await page.textContent("#def-box")), "Übersicht zeigt Verteidigungs-Aufträge");
  await shot(handy ? "handy-uebersicht" : "desktop-uebersicht");

  await Z(() => { const q = window.SS.app.zustand.planeten[0].verteidigungsauftraege, a = q[0], d = a.ende - a.start; a.start = Date.now() - d - 2000; a.ende = Date.now() - 2000; const b = q[1], db = b.ende - b.start; b.start = a.ende; b.ende = a.ende + db; });
  await sleep(1500);
  ok((await anzahl("raketenbatterie")) === 5, "5 Raketenbatterien fertig");
  await geheZu("#verteidigung", "verteidigung");
  ok(/^5$/.test((await page.textContent('[data-def-anzahl="raketenbatterie"]')).trim()), "Kachel: Anzahl 5");
  ok(await ueberlauf() <= 0, "Verteidigung: kein waagrechter Überlauf");
  await shot(handy ? "handy-verteidigung" : "desktop-verteidigung", !handy);

  let inf = await oeffneInfo('article[data-def="magnetkanone"] .info-knopf');
  ok(inf.sichtbar && inf.imBild && /Energiehülle/.test(inf.text) && /Metallhülle/.test(inf.text) && /Magnetkanone/.test(inf.text), `Info Magnetkanone sichtbar ${JSON.stringify(inf.r)}`);
  if (!handy) await shot("desktop-infofenster");
  await schliesseInfo();

  const m0 = await Z(() => window.SS.app.zustand.rohstoffe.metall);
  await page.click('#def-box [data-aktion="def-abbrechen"][data-index="0"]'); await sleep(150);
  await page.click("#dialog-ok"); await sleep(250);
  ok((await q()) === 0 && (await Z(() => window.SS.app.zustand.rohstoffe.metall)) >= m0, "Abbrechen erstattet");

  // Kampf-Simulator
  const vorher = await Z(() => JSON.stringify(window.SS.app.zustand.planeten[0].verteidigung));
  await page.selectOption("#sim-schiff", "schwere_drohne");
  await page.fill("#sim-anzahl", "50");
  await page.click('[data-aktion="sim-start"]'); await sleep(300);
  const ber = await page.textContent("#sim-ausgabe");
  ok(/Phase 1 – Orbit/.test(ber) && /Phase 2 – Boden/.test(ber) && /Trümmerfeld Orbit/.test(ber), "Simulator: Bericht mit Orbit, Boden, Trümmer");
  ok((await Z(() => JSON.stringify(window.SS.app.zustand.planeten[0].verteidigung))) === vorher, "Simulator ändert den Spielstand nicht");
  await page.locator("#sim-box").evaluate((e) => e.scrollIntoView());
  await shot(handy ? "handy-simulator" : "desktop-simulator");

  // Offline
  await page.fill('input[data-def-menge="maschinennest"]', "3");
  await page.click('article[data-def="maschinennest"] button[data-aktion="def-bauen"]'); await sleep(250);
  const pid = await Z(() => window.SS.app.aktivId);
  await page.click(handy ? "#knopf-menue-auf" : "#knopf-spieler-wechseln").catch(() => {});
  if (handy) { await sleep(300); await page.click("#knopf-spieler-wechseln"); }
  await page.waitForSelector("#bildschirm-start.aktiv");
  await Z((id) => {
    const k = window.SS.kern.profile.spielstandSchluessel(id), z = JSON.parse(localStorage.getItem(k)), a = z.planeten[0].verteidigungsauftraege[0];
    const d = a.ende - a.start; a.ende = Date.now() - 60000; a.start = a.ende - d; z.zeit.letzterTick = Date.now() - 2 * 3600000; localStorage.setItem(k, JSON.stringify(z));
  }, pid);
  await page.reload();
  await page.click(`#profil-liste .profil:has(b:text-is("Sandro")) [data-aktion="spielen"]`);
  await page.waitForSelector('#bildschirm-spiel.aktiv');
  ok(await page.isVisible("#dialog") && /3× Maschinen-Nest/.test(await page.textContent("#dialog")), "Offline: Anlagen beim Neuladen fertig (Willkommen-Dialog)");
  if (await page.isVisible("#dialog")) await page.click("#dialog-ok");
  ok((await anzahl("maschinennest")) === 3, "3 Maschinen-Nester nach Offline-Zeit");

  // Master
  await page.click("#knopf-master"); await sleep(200);
  await geheZu("#verteidigung", "verteidigung");
  await page.fill('input[data-def-menge="orbitalverteidigungsplattform"]', "7");
  await page.click('article[data-def="orbitalverteidigungsplattform"] button[data-aktion="def-bauen"]'); await sleep(300);
  ok((await anzahl("orbitalverteidigungsplattform")) === 7, "Master: 7 Orbitalplattformen sofort");
  ok(/orbitalverteidigungsplattform-4\.png/.test(await page.getAttribute('article[data-def="orbitalverteidigungsplattform"] img', "src")), "Stufenbild 4 bei 7 Plattformen");
  if (!handy) await shot("master-verteidigung", true);
  await page.click("#knopf-master"); await sleep(200);
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
