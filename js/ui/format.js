/* Sternenspiel – Zahlen-/Zeitformatierung (deutsch). DOM-frei, daher auch in Node testbar. */
(function (g) {
  "use strict";
  var SS = (g.SS = g.SS || {});
  var nf0 = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 });
  var nf1 = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 });

  function zahl(n) { return isFinite(n) ? nf0.format(Math.floor(n || 0)) : "∞"; }
  function rate(n) { return (n >= 100 || n === 0 ? nf0 : nf1).format(n); }
  function prozent(m) { return "+" + nf0.format(Math.round((m - 1) * 100)) + " %"; }
  function kurz(n) {
    n = Math.floor(n || 0);
    if (!isFinite(n)) return "∞";
    if (n >= 1e21) return n.toExponential(2).replace(".", ",").replace("e+", " · 10^");
    if (n >= 1e18) return nf1.format(n / 1e18) + " Trio.";
    if (n >= 1e15) return nf1.format(n / 1e15) + " Brd.";
    if (n >= 1e12) return nf1.format(n / 1e12) + " Bio.";
    if (n >= 1e9) return nf1.format(n / 1e9) + " Mrd.";
    if (n >= 1e6) return nf1.format(n / 1e6) + " Mio.";
    if (n >= 1e4) return nf1.format(n / 1e3) + " Tsd.";
    return nf0.format(n);
  }
  function dauer(ms) {
    var s = Math.floor(Math.max(0, ms) / 1000);
    if (!isFinite(s)) return "∞";
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sek = s % 60;
    var tage = Math.floor(h / 24);
    if (tage >= 365) { var j = Math.floor(tage / 365); return j + (j === 1 ? " Jahr " : " Jahre ") + (tage % 365) + " T."; }
    if (tage > 0) return tage + " T. " + (h % 24) + " Std.";
    if (h > 0) return h + " Std. " + m + " Min.";
    if (m > 0) return m + " Min. " + sek + " Sek.";
    return sek + " Sek.";
  }
  function uhrzeit(ts) {
    var d = new Date(ts);
    return d.toLocaleDateString("de-DE") + ", " + d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }
  SS.format = { zahl: zahl, rate: rate, prozent: prozent, kurz: kurz, dauer: dauer, uhrzeit: uhrzeit };
})(typeof globalThis !== "undefined" ? globalThis : this);
