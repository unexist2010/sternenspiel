/*
 * Sternenspiel – Seite „Rangliste“ (0.21.0, Sandro pt61u). #rangliste/<kategorie>; Klick auf Zeile → #weltraum/system/N.
 */
(function (g) {
  "use strict";
  var SS = (g.SS = g.SS || {});
  SS.ui = SS.ui || {};
  SS.ui.rangliste = function (h) {
    function seite() {
      var R = SS.kern.rangliste, z = h.zustand(), t = h.teile(), kat = R.KATEGORIEN.some(function (k) { return k.id === t[0]; }) ? t[0] : "gesamt";
      var zahl = function (n) { return SS.format ? SS.format.zahl(n) : String(n); };
      var tabs = "<nav class=\"rl-tabs\" id=\"rl-tabs\">" + R.KATEGORIEN.map(function (k) {
        return "<a class=\"knopf klein" + (k.id === kat ? " aktiv" : "") + "\" href=\"#rangliste/" + k.id + "\" data-kategorie=\"" + k.id + "\">" + k.name + "</a>"; }).join(" ") + "</nav>";
      var zeilen = R.liste(z, kat).map(function (e) {
        var kt = e.koord.sektor + ":" + e.koord.system + ":" + e.koord.planet;
        return "<tr class=\"rl-zeile" + (e.eigen ? " rl-eigen" : "") + "\" data-system=\"" + e.koord.system + "\"><td class=\"z\">" + e.platz + "</td>" +
          "<td><a class=\"rl-link\" href=\"" + e.link + "\" title=\"Im Weltraum anzeigen\">" + h.esc(e.name) + (e.eigen ? " (du)" : "") + "</a></td><td>" + h.esc(e.art) + "</td>" +
          "<td><a href=\"" + e.link + "\">[" + kt + "]</a></td><td class=\"z\"><b>" + zahl(e.punkte[kat]) + "</b></td></tr>";
      }).join("");
      var tab = "<div class=\"tabelle-huelle\"><table class=\"tabelle rl-tabelle\" id=\"rl-tabelle\"><thead><tr><th class=\"z\">Platz</th><th>Name</th><th>Art</th><th>Heimat</th><th class=\"z\">Punkte</th></tr></thead><tbody>" + zeilen + "</tbody></table></div>" +
        "<p class=\"hinweis\">Klick auf einen Eintrag öffnet sein Sonnensystem im Weltraum.</p>";
      return h.box("Rangliste", tabs + tab, "", " id=\"rl-box\"");
    }
    return { seite: seite };
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
