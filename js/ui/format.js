/* Sternenspiel – Zahlen-/Zeitformatierung (deutsch). DOM-frei, daher auch in Node testbar. */
(function (g) {
  "use strict";
  var SS = (g.SS = g.SS || {});
  var nf0 = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 });
  var nf1 = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 });

  function zahl(n) { return nf0.format(Math.floor(n || 0)); }
  function rate(n) { return (n >= 100 || n === 0 ? nf0 : nf1).format(n); }
  function prozent(m) { return "+" + nf0.format(Math.round((m - 1) * 100)) + " %"; }
  function kurz(n) {
    n = Math.floor(n || 0);
    if (n >= 1e6) return nf1.format(n / 1e6) + " Mio.";
    if (n >= 1e4) return nf1.format(n / 1e3) + " Tsd.";
    return nf0.format(n);
  }
  function dauer(ms) {
    var s = Math.floor(Math.max(0, ms) / 1000);
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sek = s % 60;
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
