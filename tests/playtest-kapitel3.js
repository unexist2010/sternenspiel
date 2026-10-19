// Browser-Playtest Kapitel 3 (0.8.0): Forschung – Sichtbarkeit, Voraussetzungen, Schleife, Wirkungen, Info-Fenster, Offline, Master.
// Aufruf:  node tests/playtest-kapitel3.js                  → file:// (ohne Server)
//          LIVE_URL=https://unexist2010.github.io/sternenspiel/ node tests/playtest-kapitel3.js
//          PLAYTEST_BROWSER=firefox node tests/playtest-kapitel3.js
// Desktop 1366×768 und Handy 412×915. Screenshots: playtest/kapitel3-*.png
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
  page.on("requestfailed", (r) => fehler.push("requestfailed: " + r.url()));
  page.on("request", (r) => { if (!r.url().startsWith(BASIS) && !r.url().startsWith("data:")) fehler.push("externe Anfrage: " + r.url()); });
  const praefix = `kapitel3-${BROWSERNAME === "chromium" ? "" : BROWSERNAME + "-"}${LIVE ? "live-" : ""}`;
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
    const k = page.locator(sel).first();
    await k.scrollIntoViewIfNeeded(); await sleep(250); // Scroll-Ereignis abwarten (schließt ein Hover-Fenster)
    if (handy) await k.tap(); else await k.hover();
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
  const fo = (id) => Z((i) => window.SS.app.zustand.forschung[i], id);
  const kachelIds = () => page.$$eval("article.forschung-kachel", (k) => k.map((x) => x.getAttribute("data-forschung")));
  const aendern = async (fn, arg) => { await Z(fn, arg); await Z(() => { window.SS.app.speichern(); window.SS.app.route(true); }); await sleep(200); };
  const grund = (id) => page.textContent(`article[data-forschung="${id}"] .grund`).then((t) => t.trim()).catch(() => "");

  await page.goto(URL_);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  ok((await page.getAttribute("html", "data-version")) === VERSION && (await Z(() => window.SS.VERSION)) === VERSION, `Version ${VERSION}`);
  await page.fill("#eingabe-name", "Sandro");
  await page.click("#knopf-neues-spiel");
  await page.waitForSelector('#inhalt[data-seite="uebersicht"]');
  ok(await Z(() => { const z = window.SS.app.zustand; return z.version === window.SS.BALANCE.SPIELSTAND_VERSION && z.forschungsauftrag === null && Object.keys(z.forschung).length === 18; }), "Spielstand: 18 Forschungen auf 0, kein Auftrag");
  ok(/Forschungseinrichtung bauen/.test(await page.textContent("#forschung-box")), "Übersicht: Forschungs-Kasten mit Hinweis „Forschungseinrichtung bauen“");

  // ---- Forschung ohne Einrichtung ----
  await geheZu("#forschung", "forschung");
  ok(await page.isVisible("#forschung-hinweis") && /Forschungseinrichtung bauen/.test(await page.textContent("#forschung-hinweis")), "Forschung: Hinweis „Forschungseinrichtung bauen“");
  let ids = await kachelIds();
  ok(JSON.stringify(ids) === JSON.stringify(["energie", "roboter", "computer", "waffen", "panzerung", "spionage"]), `Früh sichtbar nur Forschungen ohne Voraussetzung (${ids.join(", ")})`);
  ok(/12 weitere Forschungen/.test(await page.textContent("#forschung-ausgeblendet")), "Hinweis: 12 Forschungen ausgeblendet");
  ok(!(await page.isEnabled('article[data-forschung="energie"] button[data-aktion="forschen"]')) && (await grund("energie")) === "Zuerst die Forschungseinrichtung bauen.", "Forschen gesperrt ohne Einrichtung (mit Grund)");
  ok((await page.$$eval("article.forschung-kachel img.anlage-bild", (im) => im.filter((i) => i.complete && i.naturalWidth > 0).length)) === 6, "Eigene SVGs der sichtbaren Forschungen geladen");

  // ---- Einrichtung + Rohstoffe ----
  await aendern(() => { const z = window.SS.app.zustand; z.planeten[0].gebaeude.forschungseinrichtung = 2; z.planeten[0].gebaeude.solarfarm = 6; Object.assign(z.rohstoffe, { metall: 5e6, silizium: 5e6, rohoel: 5e6 }); });
  ok(/Stufe\s*2/.test(await page.textContent("#einrichtung-box")) && /÷ 3/.test(await page.textContent("#einrichtung-box")), "Einrichtung Stufe 2: Forschungszeit ÷ 3");
  ok(/16 Min\. 0 Sek\./.test(await page.textContent('article[data-forschung="energie"]')), "Energie-Technologie Stufe 1: Dauer 800 / (1000 · 3) Std. = 16 Min.");
  const stromVor = await Z(() => window.SS.kern.produktion.uebersicht(window.SS.app.zustand).strom.erzeugung);
  await page.click('article[data-forschung="energie"] button[data-aktion="forschen"]'); await sleep(250);
  ok(await Z(() => window.SS.app.zustand.forschungsauftrag && window.SS.app.zustand.forschungsauftrag.id === "energie"), "Forschung gestartet (Energie-Technologie → 1)");
  ok(await page.isVisible('#forschung-box [data-live="forschung-rest"]') && /Energie-Technologie → Stufe 1/.test(await page.textContent("#forschung-box")), "Laufende Forschung mit Restzeit und Balken");
  ok(!(await page.isEnabled('article[data-forschung="computer"] button[data-aktion="forschen"]')) && (await grund("computer")) === "Es läuft bereits eine Forschung.", "Nur eine Forschung gleichzeitig");
  await geheZu("#anlagen", "anlagen");
  ok(/Während einer Forschung/.test(await page.textContent('article[data-gebaeude="forschungseinrichtung"] .grund')) && !(await page.isEnabled('article[data-gebaeude="forschungseinrichtung"] button[data-aktion="bauen"]')), "Anlagen: Forschungseinrichtung während der Forschung gesperrt");
  ok(await page.isEnabled('article[data-gebaeude="metallmine"] button[data-aktion="bauen"]'), "Gebäudebau läuft unabhängig (Metallmine baubar)");
  await geheZu("#uebersicht", "uebersicht");
  ok(/Energie-Technologie → Stufe 1/.test(await page.textContent("#forschung-box")), "Übersicht zeigt die laufende Forschung");
  await shot(handy ? "handy-uebersicht-forschung" : "desktop-uebersicht-forschung");

  // ---- Forschung fertig (Zeit vorspulen) ----
  await Z(() => { const a = window.SS.app.zustand.forschungsauftrag; const d = a.ende - a.start; a.start = Date.now() - d - 2000; a.ende = Date.now() - 1000; });
  await sleep(1500);
  ok((await fo("energie")) === 1 && await Z(() => window.SS.app.zustand.forschungsauftrag === null), "Forschung pünktlich fertig: Energie-Technologie Stufe 1");
  const stromNach = await Z(() => window.SS.kern.produktion.uebersicht(window.SS.app.zustand).strom.erzeugung);
  ok(Math.abs(stromNach / stromVor - 1.05) < 1e-6, `Energie-Technologie wirkt: Strom ${Math.round(stromVor)} → ${Math.round(stromNach)} (+5 %)`);
  ok(await Z(() => window.SS.app.zustand.punkte) >= 1.2, "Punkte für Forschung gutgeschrieben");
  await geheZu("#ressourcen", "ressourcen");
  ok(/Stufe 1 · \+5 % Stromerzeugung/.test(await page.textContent("#energie-technik")), "Ressourcen: Energie-Technologie in der Energiebilanz");

  // ---- Sichtbarkeit / Voraussetzungen ----
  await geheZu("#forschung", "forschung");
  ids = await kachelIds();
  ok(ids.includes("verbrennung") && !ids.includes("laser") && !ids.includes("graviton"), "ET 1: Verbrennungstriebwerk erscheint, Laser (ET 2) noch nicht");
  await aendern(() => { window.SS.app.zustand.forschung.energie = 3; });
  ids = await kachelIds();
  ok(["laser", "schild", "impuls", "hyperspace"].every((i) => ids.includes(i)) && !ids.includes("ionen"), "ET 3: Laser, Schild, Impuls, Hyperspace sichtbar; Ionen nicht");
  const vorImpuls = await page.$$eval('article[data-forschung="impuls"] .vor', (v) => v.map((x) => x.className + "|" + x.textContent));
  ok(vorImpuls.some((v) => /ok/.test(v) && /Energie-Technologie 2/.test(v)) && vorImpuls.some((v) => /fehlt/.test(v) && /Verbrennungstriebwerk 5/.test(v)), "Voraussetzungen grün/rot (Impuls: ET 2 ✔, Verbrennung 5 ✘)");
  ok(!(await page.isEnabled('article[data-forschung="impuls"] button[data-aktion="forschen"]')) && /Voraussetzung fehlt: Verbrennungstriebwerk 5/.test(await grund("impuls")), "Fehlende Voraussetzung blockiert den Start");
  await aendern(() => { window.SS.app.zustand.forschung.computer = 4; });
  ok((await kachelIds()).includes("komprimierung") && /oder/.test(await page.textContent('article[data-forschung="komprimierung"] .vor-liste')), "Komprimierung: ODER-Voraussetzung (Computer 4) – sichtbar und erforschbar");
  ok(await page.isEnabled('article[data-forschung="komprimierung"] button[data-aktion="forschen"]'), "Komprimierung mit Computer 4 startbar");
  ok(await ueberlauf() <= 0, "Forschung: kein waagrechter Überlauf");
  await shot(handy ? "handy-forschung" : "desktop-forschung", !handy);

  // ---- Info-Fenster Forschung ----
  let inf = await oeffneInfo('article[data-forschung="energie"] .info-knopf');
  ok(inf.sichtbar && inf.imBild, `Info Energie-Technologie ${handy ? "per Antippen" : "per Hover"} sichtbar und im Bild ${JSON.stringify(inf.r)}`);
  ok(inf.zeilen === 6 && /Dauer/.test(inf.text) && /Kosten/.test(inf.text) && /Energieausbeute/.test(inf.text) && /wirkt jetzt/.test(inf.text), `Info-Tabelle: aktuelle + 5 Stufen mit Wirkung/Diff./Kosten/Dauer (${inf.zeilen} Zeilen)`);
  await shot(handy ? "handy-infofenster-forschung" : "desktop-infofenster-forschung");
  await schliesseInfo();
  inf = await oeffneInfo('article[data-forschung="komprimierung"] .info-knopf');
  ok(inf.sichtbar && inf.imBild && /ODER/.test(inf.text), "Info Komprimierung im Bild, nennt ODER-Voraussetzung " + JSON.stringify(inf.r || inf));
  await schliesseInfo();

  // ---- Abbrechen mit voller Erstattung ----
  const si0 = await Z(() => window.SS.app.zustand.rohstoffe.silizium);
  await page.click('article[data-forschung="spionage"] button[data-aktion="forschen"]'); await sleep(250);
  await page.click('#forschung-box [data-aktion="forschung-abbrechen"]'); await sleep(150);
  await page.click("#dialog-ok"); await sleep(250);
  const si1 = await Z(() => window.SS.app.zustand.rohstoffe.silizium);
  ok(await Z(() => window.SS.app.zustand.forschungsauftrag === null) && Math.abs(si1 - si0) < 50, `Abbrechen erstattet voll (Silizium ${Math.round(si0)} → ${Math.round(si1)})`);

  // ---- Offline-Fertigstellung ----
  await page.click('article[data-forschung="spionage"] button[data-aktion="forschen"]'); await sleep(250);
  const pid = await Z(() => window.SS.app.aktivId);
  await page.click(handy ? "#knopf-menue-auf" : "#knopf-spieler-wechseln").catch(() => {});
  if (handy) { await sleep(300); await page.click("#knopf-spieler-wechseln"); }
  await page.waitForSelector("#bildschirm-start.aktiv");
  await Z((id) => { // gespeicherten Stand zurückdatieren: Forschung endete vor 1 Min., letzter Tick vor 2 Std.
    const k = window.SS.kern.profile.spielstandSchluessel(id), z = JSON.parse(localStorage.getItem(k)), a = z.forschungsauftrag;
    a.ende = Date.now() - 60000; a.start = a.ende - 600000; z.zeit.letzterTick = Date.now() - 2 * 3600000; localStorage.setItem(k, JSON.stringify(z));
  }, pid);
  await page.reload();
  await page.click(`#profil-liste .profil:has(b:text-is("Sandro")) [data-aktion="spielen"]`);
  await page.waitForSelector('#bildschirm-spiel.aktiv');
  ok(await page.isVisible("#dialog") && /Spionage-Technologie Stufe 1 erforscht/.test(await page.textContent("#dialog")), "Offline: Forschung beim Neuladen fertig („erforscht“ im Willkommen-Dialog)");
  if (await page.isVisible("#dialog")) await page.click("#dialog-ok");
  ok((await fo("spionage")) === 1, "Spionage-Technologie Stufe 1 nach Offline-Zeit");

  // ---- Master: alles sichtbar, sofort, kostenlos ----
  await page.click("#knopf-master"); await sleep(200);
  await geheZu("#forschung", "forschung");
  ok((await kachelIds()).length === 18, "Master: alle 18 Forschungen sichtbar");
  const m0 = await Z(() => window.SS.app.zustand.rohstoffe.metall);
  await page.click('article[data-forschung="graviton"] button[data-aktion="forschen"]'); await sleep(250);
  ok((await fo("graviton")) === 1 && Math.abs((await Z(() => window.SS.app.zustand.rohstoffe.metall)) - m0) < 1000, "Master: Graviton sofort und kostenlos trotz fehlender Voraussetzungen");
  await page.click('article[data-forschung="roboter"] button[data-aktion="forschen"]'); await sleep(250);
  ok((await fo("roboter")) === 1, "Master: Roboterforschung sofort Stufe 1");
  await shot(handy ? "handy-master-forschung" : "master-alle-forschungen", !handy);
  await page.click("#knopf-master"); await sleep(200);
  await geheZu("#anlagen", "anlagen");
  ok(/43 Sek\./.test(await page.textContent('article[data-gebaeude="metallmine"] .anlage-werte')), "Roboterforschung 1: Metallmine Stufe 1 in 43 Sek. statt 1 Min. 48 Sek.");
  await geheZu("#forschung", "forschung");
  ok(await ueberlauf() <= 0, "Kein waagrechter Überlauf");
  ok(fehler.length === 0, "Keine Konsolen-/Seitenfehler, keine externen Anfragen" + (fehler.length ? ":\n  " + fehler.join("\n  ") : ""));
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
