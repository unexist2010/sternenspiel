// Browser-Playtest Kapitel 1 (Chromium headless über playwright-core, Seite per file:// – ohne Server).
// Prüft: keine Konsolen-/Seitenfehler, Startplatz-Wahl, Produktion läuft, Speichern, Offline-Fortschritt, Zurücksetzen,
// kein waagrechtes Überlaufen. Screenshots: playtest/kapitel1-<geraet>-<schritt>.png (Handy 412×915, Desktop 1366×768).
// Aufruf: node tests/playtest-kapitel1.js   (optional: CHROME=/pfad/zu/chrome, PLAYWRIGHT_CORE=/pfad/zu/playwright-core)
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

function ladePlaywright() {
  const kandidaten = [process.env.PLAYWRIGHT_CORE, "playwright-core", "playwright"].filter(Boolean);
  // Fallback: auf der Box per pnpm global vorhandenes playwright-core
  const pnpm = "/usr/local/lib/pnpm/5/.pnpm";
  if (fs.existsSync(pnpm)) for (const d of fs.readdirSync(pnpm).filter((d) => d.startsWith("playwright-core@")).sort().reverse()) kandidaten.push(path.join(pnpm, d, "node_modules/playwright-core"));
  for (const k of kandidaten) { try { return require(k); } catch (e) { /* nächster */ } }
  throw new Error("playwright-core nicht gefunden (npm i playwright-core oder PLAYWRIGHT_CORE setzen)");
}
const { chromium } = ladePlaywright();
const CHROME = process.env.CHROME || ["/usr/bin/google-chrome", "/opt/google/chrome/chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const URL_ = pathToFileURL(path.join(__dirname, "..", "index.html")).href;
const OUT = path.join(__dirname, "..", "playtest");
fs.mkdirSync(OUT, { recursive: true });

let fehlschlaege = 0;
function ok(bed, text) { console.log((bed ? "OK   " : "FAIL ") + text); if (!bed) fehlschlaege++; }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const GERAETE = [
  { name: "handy", viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  { name: "desktop", viewport: { width: 1366, height: 768 }, isMobile: false, hasTouch: false, deviceScaleFactor: 1 },
];

async function lauf(browser, g) {
  console.log(`\n== ${g.name} ${g.viewport.width}×${g.viewport.height} ==`);
  const ctx = await browser.newContext({ viewport: g.viewport, isMobile: g.isMobile, hasTouch: g.hasTouch, deviceScaleFactor: g.deviceScaleFactor, locale: "de-DE", timezoneId: "Europe/Vienna" });
  const page = await ctx.newPage();
  const fehler = [];
  page.on("pageerror", (e) => fehler.push("pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") fehler.push("console." + m.type() + ": " + m.text()); });
  page.on("requestfailed", (r) => fehler.push("requestfailed: " + r.url()));
  page.on("request", (r) => { if (!r.url().startsWith("file:")) fehler.push("externe Anfrage: " + r.url()); });
  const shot = async (n) => { await sleep(350); await page.screenshot({ path: path.join(OUT, `kapitel1-${g.name}-${n}.png`) }); };
  const ueberlauf = () => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  const metall = () => page.evaluate(() => window.SS.app.zustand.rohstoffe.metall);

  await page.goto(URL_);
  ok(await page.isVisible("#bildschirm-start"), "Startbildschirm sichtbar");
  ok(!(await page.isVisible("#knopf-weiterspielen")), "Ohne Spielstand kein „Weiterspielen“");
  await shot("01-start");

  await page.click("#knopf-neues-spiel");
  ok(await page.locator(".startplatz").count() === 26, "26 Startplätze A–Z");
  ok(await page.isDisabled("#knopf-starten"), "Starten erst nach Wahl möglich");
  await page.fill("#eingabe-name", "Sandro");
  await page.click('.startplatz[data-buchstabe="L"]');
  ok((await page.textContent("#startplatz-details")).includes("Stufe 15"), "Details zeigen Stufe 15 für L");
  ok(await ueberlauf() <= 0, "Startplatz-Wahl: kein waagrechter Überlauf");
  await shot("02-startplatz");
  await page.click('#startplatz-filter [data-sort="stufe"]');
  ok((await page.locator(".startplatz").first().getAttribute("data-buchstabe")) === "L", "Sortierung nach Stufe (L zuerst)");

  await page.click("#knopf-starten");
  ok(await page.isVisible("#bildschirm-spiel"), "Spielbildschirm nach Start");
  ok(await page.locator("#ressourcen-leiste .rs").count() === 8, "Ressourcenleiste mit 8 Rohstoffen");
  const m0 = await metall();
  await sleep(2600);
  const m1 = await metall();
  ok(m1 > m0, `Produktion läuft (Metall ${m0.toFixed(2)} → ${m1.toFixed(2)})`);
  ok(await ueberlauf() <= 0, "Spiel: kein waagrechter Überlauf");
  await shot("03-spiel");

  await page.click("#knopf-speichern");
  const gespeichert = await page.evaluate(() => JSON.parse(localStorage.getItem(window.SS.BALANCE.SPEICHER_SCHLUESSEL)));
  ok(gespeichert && gespeichert.name === "Sandro" && gespeichert.startplatz.buchstabe === "L", "Spielstand in localStorage");

  // Offline simulieren: über „Hauptmenü“ verlassen (speichert, Spiel-Schleifen stoppen), dann den Spielstand
  // 3 Std. in die Vergangenheit verschieben und die Seite neu laden.
  await page.click("#knopf-menue");
  ok(await page.isVisible("#knopf-weiterspielen"), "Hauptmenü zeigt „Weiterspielen“");
  const vorher = await page.evaluate(() => {
    const k = window.SS.BALANCE.SPEICHER_SCHLUESSEL, z = JSON.parse(localStorage.getItem(k));
    z.zeit.letzterTick -= 3 * 3600000; z.zeit.zuletztGespeichert -= 3 * 3600000;
    localStorage.setItem(k, JSON.stringify(z));
    return z.rohstoffe.metall;
  });
  await page.reload();
  ok(await page.isVisible("#knopf-weiterspielen"), "„Weiterspielen“ nach Neuladen sichtbar");
  await page.click("#knopf-weiterspielen");
  ok(await page.isVisible("#dialog"), "Willkommen-zurück-Dialog");
  const nachher = await metall();
  const rate = await page.evaluate(() => window.SS.kern.produktion.produktionProStunde(window.SS.app.zustand).metall);
  ok(nachher - vorher >= rate * 2.9 || nachher >= 10000, `Offline-Fortschritt ~3 Std. (+${Math.round(nachher - vorher)} Metall, Rate ${Math.round(rate)}/h)`);
  await shot("04-offline");
  await page.click("#dialog-ok");

  await page.click("#knopf-zuruecksetzen");
  await page.click("#dialog-abbrechen");
  ok(await page.isVisible("#bildschirm-spiel"), "Zurücksetzen abbrechen behält Spiel");
  await page.click("#knopf-zuruecksetzen");
  await shot("05-zuruecksetzen");
  await page.click("#dialog-ok");
  ok(await page.isVisible("#bildschirm-start") && !(await page.isVisible("#knopf-weiterspielen")), "Zurücksetzen löscht Spielstand");
  ok(await page.evaluate(() => localStorage.getItem(window.SS.BALANCE.SPEICHER_SCHLUESSEL)) === null, "localStorage leer");

  ok(fehler.length === 0, "Keine Konsolen-/Seitenfehler, keine externen Anfragen" + (fehler.length ? ":\n  " + fehler.join("\n  ") : ""));
  await ctx.close();
}

(async () => {
  console.log("Chrome:", CHROME, "\nURL:", URL_);
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox", "--disable-gpu"] });
  try { for (const g of GERAETE) await lauf(browser, g); }
  finally { await browser.close(); }
  console.log(`\n${fehlschlaege === 0 ? "ALLE PRÜFUNGEN GRÜN" : fehlschlaege + " FEHLGESCHLAGEN"}`);
  process.exit(fehlschlaege ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
