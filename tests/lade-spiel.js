// Lädt die DOM-freien Spieldateien in einen frischen Node-vm-Kontext – in der Reihenfolge aus index.html
// (alle <script>-Einträge außer js/ui/app.js). So testen die Tests genau das, was der Browser lädt.
const vm = require("vm");
const fs = require("fs");
const path = require("path");
const WURZEL = path.join(__dirname, "..");

function skriptListe() {
  const html = fs.readFileSync(path.join(WURZEL, "index.html"), "utf8");
  return [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]).filter((s) => s !== "js/ui/app.js");
}

function ladeSpiel() {
  const ctx = { console, Intl, Date, Math, JSON };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  for (const datei of skriptListe()) {
    vm.runInContext(fs.readFileSync(path.join(WURZEL, datei), "utf8"), ctx, { filename: datei });
  }
  return ctx.SS;
}

function speicherAttrappe() {
  const daten = {};
  return {
    daten,
    getItem: (k) => (k in daten ? daten[k] : null),
    setItem: (k, v) => { daten[k] = String(v); },
    removeItem: (k) => { delete daten[k]; },
  };
}

module.exports = { ladeSpiel, speicherAttrappe, skriptListe };
