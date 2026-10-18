// Browser-Playtest Kapitel 2 „Anlagen“ (playwright-core, Chromium headless; PLAYTEST_BROWSER=firefox optional).
// Aufruf:  node tests/playtest-kapitel2.js                  → file:// (ohne Server)
//          LIVE_URL=https://unexist2010.github.io/sternenspiel/ node tests/playtest-kapitel2.js
// Prüft auf Handy 412×915 und Desktop 1366×768: Menüreihenfolge, Ressourcenleiste (7 Rohstoffe, ohne Antimaterie),
// Übersicht/Ressourcen/Anlagen mit Inhalt, übrige 5 Seiten Platzhalter, Solarfarm + Metallmine bauen, Zeit vorspulen,
// Stufe steigt, Produktion steigt, Regler, Abbrechen mit Erstattung, Raumflughafen + Startplätze A–J,
// Offline-Fertigstellung nach Neuladen, kein Überlauf, keine Konsolenfehler. Screenshots: playtest/kapitel2-*.png
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

const MENUE = ["Übersicht", "Ressourcen", "Anlagen", "Forschung", "Werft", "Verteidigung", "Flotte", "Weltraum"];
const IDS = ["uebersicht", "ressourcen", "anlagen", "forschung", "werft", "verteidigung", "flotte", "weltraum"];
const PLATZHALTER = "Wird in einem eigenen Kapitel ausgearbeitet.";
const VERSION = "0.6.0";
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
  const praefix = `kapitel2-${BROWSERNAME === "chromium" ? "" : BROWSERNAME + "-"}${LIVE ? "live-" : ""}`;
  const shot = async (n, ganz) => { await page.evaluate((g) => { document.getElementById("meldung").className = "meldung"; if (g) window.scrollTo(0, 0); }, !!ganz); await sleep(350); await page.screenshot({ path: path.join(OUT, praefix + n + ".png"), fullPage: !!ganz }); };
  const ueberlauf = () => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  const bilderFehlen = () => page.evaluate(() => [...document.images].filter((i) => i.offsetParent !== null && !(i.complete && i.naturalWidth > 0)).map((i) => i.getAttribute("src")));
  const geheZu = async (hash, seite) => { await page.evaluate((h) => { location.hash = h; }, hash); await page.waitForSelector(`#inhalt[data-seite="${seite}"]`); await sleep(250); };
  const Z = (fn, arg) => page.evaluate(fn, arg);
  // Zeit vorspulen: laufenden Bauauftrag so verschieben, dass er sofort fertig ist; Tick abwarten.
  const vorspulen = async () => {
    await Z(() => { const a = window.SS.app.zustand.planeten[0].bauauftrag; const d = a.ende - Date.now() + 500; a.start -= d; a.ende -= d; });
    await page.waitForFunction(() => !window.SS.app.zustand.planeten[0].bauauftrag, null, { timeout: 5000 });
    await sleep(300);
  };
  const stufe = (id) => Z((i) => window.SS.app.zustand.planeten[0].gebaeude[i], id);
  const klickBauen = async (id) => { await page.click(`article.anlage[data-gebaeude="${id}"] button[data-aktion="bauen"]`); await sleep(200); };

  await page.goto(URL_);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  ok((await page.getAttribute("html", "data-version")) === VERSION && (await Z(() => window.SS.VERSION)) === VERSION, `Version ${VERSION} (HTML = Skripte)`);
  await page.fill("#eingabe-name", "Sandro");
  await page.click("#knopf-neues-spiel");
  await page.waitForSelector('#inhalt[data-seite="uebersicht"]');
  ok(await page.isVisible("#bildschirm-spiel"), "Neues Spiel startet direkt im Spiel");
  ok(await Z(() => { const z = window.SS.app.zustand, p = z.planeten[0]; return z.version === 4 && p.istHauptplanet === true && p.rohoelfelder === 0 && p.bauauftrag === null && p.startplaetze.length === 10; }), "Datenmodell v4: Planet mit istHauptplanet, rohoelfelder, bauauftrag, 10 Startplätzen");

  // Ressourcenleiste
  const rs = await page.$$eval("#ressourcen-leiste .rs", (e) => e.map((x) => x.getAttribute("data-rohstoff")));
  ok(JSON.stringify(rs) === '["metall","silizium","rohoel","strom","kunststoff_t1","kunststoff_t2","kunststoff_t3"]', "Leiste: Metall, Silizium, Rohöl, Strom, Kunststoff T1–T3 (" + rs.join(",") + ")");
  ok(!rs.includes("antimaterie"), "Antimaterie ausgeblendet");
  const reihen = await page.$$eval("#ressourcen-leiste .rs", (e) => new Set(e.map((x) => Math.round(x.getBoundingClientRect().top))).size);
  ok(handy ? reihen === 2 : reihen === 1, `Leiste ${handy ? "zweireihig (4+3)" : "einreihig"} (ist ${reihen})`);
  ok(/\d+ \/ \d+/.test(await page.textContent('#ressourcen-leiste .rs[data-rohstoff="strom"]')), "Strom zeigt verfügbar / Bedarf");

  // Übersicht
  let text = (await page.textContent("#inhalt")).replace(/\s+/g, " ");
  const heimat = await Z(() => window.SS.app.zustand.heimat);
  ok(text.includes(heimat.name) && text.includes(`[${heimat.sektor}:${heimat.system}:${heimat.planet}]`) && /Sektor/.test(text) && /System/.test(text), "Übersicht: Hauptplanet, Koordinaten, Sektor, System");
  ok(/Punkte/.test(text) && (await page.isVisible("#bauauftrag-box")), "Übersicht: Punkte + Bauauftrag");
  ok(!/Startplatz|Startplätze/.test(text), "Übersicht: keine Startplatz-Anzeige");
  const knoepfe = await page.$$eval('#inhalt button[data-aktion]', (b) => b.map((x) => x.textContent.trim()));
  ok(["Speichern", "Laden", "Spieler wechseln", "Zurücksetzen"].every((k) => knoepfe.includes(k)), "Übersicht: Spielstand-Knöpfe (" + knoepfe.join(", ") + ")");

  // Platzhalter-Seiten
  for (const [id, name] of [["forschung", "Forschung"], ["werft", "Werft"], ["verteidigung", "Verteidigung"], ["flotte", "Flotte"], ["weltraum", "Weltraum"]]) {
    await geheZu("#" + id, id);
    const t = (await page.textContent("#inhalt")).replace(/\s/g, "");
    ok(t === (name + name + "Wird in einem eigenen Kapitel ausgearbeitet.").replace(/\s/g, ""), `„${name}“: nur Platzhalter`);
    ok(await ueberlauf() <= 0, `„${name}“: kein Überlauf`);
  }

  // Anlagen
  await geheZu("#anlagen", "anlagen");
  const gruppen = await page.$$eval("#inhalt [data-gruppe] .box-kopf span", (s) => s.map((x) => x.textContent.trim()));
  ok(JSON.stringify(gruppen) === '["Ressourcenabbau","Energie","Kunststoffproduktion","Weitere Anlagen"]', "Anlagen: 4 Gruppen (" + gruppen.join(" / ") + ")");
  const kacheln = await page.$$eval("article.anlage", (a) => a.map((x) => x.getAttribute("data-gebaeude")));
  ok(kacheln.length === 14 && ["metallmine", "siliziummine", "bohrstation", "solarfarm", "oelverbrennung", "solarsatellit", "kunststoffwerk_t1", "kunststoffwerk_t2", "kunststoffwerk_t3", "geologiestation", "raumflughafen", "werft", "verteidigungswerft", "forschungseinrichtung"].every((k) => kacheln.includes(k)), `Anlagen: 13 Gebäude + Solarsatelliten (${kacheln.length} Kacheln)`);
  ok((await bilderFehlen()).length === 0, "Anlagen: alle SVG-Bilder geladen");
  ok(await page.$$eval("article.anlage[data-gebaeude]:not([data-gebaeude=solarsatellit])", (a) => a.every((x) => x.querySelector(".stufe") && x.querySelector(".beschreibung") && /Bauzeit/.test(x.textContent) && /Aktuell/.test(x.textContent))), "Jede Kachel: Stufe, Beschreibung, Kosten, Bauzeit, aktuell/nächste Stufe");
  ok(await page.isEnabled('article[data-gebaeude="metallmine"] button[data-aktion="bauen"]'), "Metallmine sofort baubar (Startbestand)");
  const grundOel = (await page.textContent('article[data-gebaeude="oelverbrennung"] .grund')).trim();
  ok(!(await page.isEnabled('article[data-gebaeude="oelverbrennung"] button[data-aktion="bauen"]')) && /Es fehlen/.test(grundOel), `Ölverbrennung deaktiviert mit Grund („${grundOel}“)`);
  ok(/Forschungszeit/.test(await page.textContent('article[data-gebaeude="forschungseinrichtung"]')), "Forschungseinrichtung zeigt Forschungszeit-Wert");
  ok(await ueberlauf() <= 0, "Anlagen: kein Überlauf");

  // Solarfarm bauen (Strom), dann Metallmine
  const m0 = await Z(() => window.SS.app.zustand.rohstoffe.metall);
  await klickBauen("solarfarm");
  ok(await Z(() => (window.SS.app.zustand.planeten[0].bauauftrag || {}).id === "solarfarm"), "Solarfarm: Bauauftrag gestartet");
  ok(await Z((m) => window.SS.app.zustand.rohstoffe.metall < m - 70, m0), "Kosten abgezogen");
  ok(await page.isVisible('article[data-gebaeude="solarfarm"].im-bau .balken'), "Fortschrittsbalken in der Kachel");
  const grundBelegt = (await page.textContent('article[data-gebaeude="metallmine"] .grund')).trim();
  ok(!(await page.isEnabled('article[data-gebaeude="metallmine"] button[data-aktion="bauen"]')) && /läuft bereits/.test(grundBelegt), `Ein Bauplatz: andere Knöpfe gesperrt („${grundBelegt}“)`);
  await vorspulen();
  ok((await stufe("solarfarm")) === 1, "Solarfarm nach Vorspulen auf Stufe 1");
  const rate0 = await Z(() => window.SS.kern.produktion.uebersicht(window.SS.app.zustand).netto.metall);
  await klickBauen("metallmine");
  await vorspulen();
  ok((await stufe("metallmine")) === 1, "Metallmine nach Vorspulen auf Stufe 1");
  ok(/Stufe\s*1/.test(await page.textContent('article[data-gebaeude="metallmine"] .stufe')), "Kachel zeigt Stufe 1");
  const rate1 = await Z(() => window.SS.kern.produktion.uebersicht(window.SS.app.zustand).netto.metall);
  ok(rate1 > rate0, `Metallproduktion steigt (${rate0} → ${Math.round(rate1 * 10) / 10}/h)`);
  ok(await Z(() => window.SS.app.zustand.punkte >= 0), "Punkte vorhanden");
  // Zeit vorspulen (Produktion): 1 Std. zurück
  const mv = await Z(() => window.SS.app.zustand.rohstoffe.metall);
  await Z(() => { window.SS.app.zustand.zeit.letzterTick -= 3600000; });
  await sleep(1300);
  const mn = await Z(() => window.SS.app.zustand.rohstoffe.metall);
  ok(mn - mv >= rate1 * 0.98, `1 Std. vorgespult: +${Math.round(mn - mv)} Metall (Rate ${Math.round(rate1)}/h)`);
  if (!handy) await shot("desktop-anlagen");
  else { await page.evaluate(() => window.scrollTo(0, 0)); await shot("handy-anlagen"); }

  // Abbrechen mit voller Erstattung
  const vorAbbruch = await Z(() => JSON.stringify(window.SS.app.zustand.rohstoffe));
  await klickBauen("siliziummine");
  ok(await Z(() => !!window.SS.app.zustand.planeten[0].bauauftrag), "Siliziummine: Auftrag läuft");
  await page.click('article[data-gebaeude="siliziummine"] button[data-aktion="abbrechen"]');
  await page.click("#dialog-ok");
  await sleep(250);
  ok(await Z((v) => { const a = JSON.parse(v), b = window.SS.app.zustand.rohstoffe; return !window.SS.app.zustand.planeten[0].bauauftrag && b.metall >= a.metall - 1 && b.silizium >= a.silizium - 1; }, vorAbbruch), "Abbrechen: Auftrag weg, Kosten voll erstattet");

  // Ressourcen
  await geheZu("#ressourcen", "ressourcen");
  ok((await page.$$eval("#rohstoff-tabelle tbody tr", (r) => r.length)) === 6, "Ressourcen: Tabelle mit 6 Rohstoffen (ohne Strom/Antimaterie)");
  const netto = await page.textContent('#rohstoff-tabelle tr[data-rohstoff="metall"] [data-live="netto:metall"]');
  ok(/\+/.test(netto), `Ressourcen: Netto Metall ${netto.trim()}`);
  ok(await page.isVisible("#energie-box") && /Produktionsfaktor/.test(await page.textContent("#energie-box")), "Energiebilanz mit Produktionsfaktor");
  ok(await page.$('#gebaeude-tabelle tr[data-gebaeude="metallmine"]') && await page.$('#gebaeude-tabelle tr[data-gebaeude="solarfarm"]'), "Produktion je Gebäude: Metallmine + Solarfarm");
  await page.selectOption('select[data-regler="metallmine"]', "50");
  await sleep(200);
  const r50 = await Z(() => ({ r: window.SS.app.zustand.planeten[0].regler.metallmine, n: window.SS.kern.produktion.uebersicht(window.SS.app.zustand).netto.metall }));
  ok(r50.r === 50 && r50.n < rate1, `Regler 50 %: Metall ${Math.round(r50.n * 10) / 10}/h`);
  await page.selectOption('select[data-regler="metallmine"]', "100");
  ok(await ueberlauf() <= 0, "Ressourcen: kein Überlauf");
  if (!handy) await shot("desktop-ressourcen", true);

  // Raumflughafen + Startplätze
  await geheZu("#anlagen/raumflughafen", "anlagen");
  ok(/noch nicht errichtet/.test(await page.textContent("#inhalt")), "Raumflughafen-Unterseite: Hinweis, solange nicht gebaut");
  await Z(() => { const r = window.SS.app.zustand.rohstoffe; r.metall += 2e6; r.silizium += 2e6; r.rohoel += 1e6; });
  await sleep(1100);
  await klickBauen("raumflughafen");
  await vorspulen();
  ok((await stufe("raumflughafen")) === 1, "Raumflughafen errichtet");
  await geheZu("#anlagen", "anlagen");
  await page.click("#knopf-startplaetze");
  await page.waitForSelector(".startplatz-raster");
  ok((await page.getAttribute("#inhalt", "data-unterseite")) === "raumflughafen", "Link „Startplätze verwalten“ öffnet Unterseite");
  const karten = await page.$$eval(".startplatz-karte", (k) => k.map((x) => x.getAttribute("data-buchstabe")).join(""));
  ok(karten === "ABCDEFGHIJ", "10 Startplätze A–J");
  ok(await page.$eval('.startplatz-karte[data-buchstabe="J"]', (k) => k.classList.contains("gesperrt") && /Gesperrt bis/.test(k.textContent)), "Startplatz J gesperrt (Punkte-Schwelle)");
  await page.click('.startplatz-karte[data-buchstabe="A"] button[data-aktion="bauen"]');
  await sleep(200);
  await vorspulen();
  ok((await Z(() => window.SS.app.zustand.planeten[0].startplaetze[0].stufe)) === 1, "Startplatz A auf Stufe 1");
  ok(/^5$/.test((await page.textContent('#startplaetze-info [data-live="kapazitaet"]')).trim()), "Gesamtkapazität 5 Schiffe");
  ok(await ueberlauf() <= 0, "Raumflughafen: kein Überlauf");
  await shot(handy ? "handy-raumflughafen" : "raumflughafen", true);

  // Übersicht-Screenshot mit laufendem Auftrag
  await geheZu("#anlagen", "anlagen");
  await klickBauen("metallmine");
  await geheZu("#uebersicht", "uebersicht");
  ok(/Metallmine/.test(await page.textContent("#bauauftrag-box")), "Übersicht zeigt laufenden Bauauftrag");
  if (!handy) await shot("desktop-uebersicht");

  // Offline-Fertigstellung: speichern, Spielstand 2 Std. zurückdatieren, neu laden
  if (handy) { await page.click("#knopf-menue-auf"); await sleep(260); }
  await page.click("#knopf-spieler-wechseln");
  await Z(() => {
    const B = window.SS.BALANCE, idx = JSON.parse(localStorage.getItem(B.PROFIL_INDEX_SCHLUESSEL));
    const k = B.PROFIL_SPIELSTAND_PRAEFIX + idx.profile[0].id, z = JSON.parse(localStorage.getItem(k));
    const d = 2 * 3600000, a = z.planeten[0].bauauftrag;
    z.zeit.letzterTick -= d; z.zeit.zuletztGespeichert -= d; a.start -= d; a.ende -= d;
    localStorage.setItem(k, JSON.stringify(z));
  });
  await page.reload();
  await page.click('#profil-liste [data-aktion="spielen"]');
  await page.waitForSelector("#dialog", { state: "visible" });
  ok(/Metallmine Stufe 2 fertiggestellt/.test(await page.textContent("#dialog")), "Offline: Bauauftrag beim Laden fertiggestellt (Dialog)");
  ok((await stufe("metallmine")) === 2, "Metallmine offline auf Stufe 2");
  await page.click("#dialog-ok");
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
