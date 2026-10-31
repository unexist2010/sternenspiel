/*
 * Sternenspiel – Seite „Nachrichten“ (0.23.0, Sandro pt67u). OGame-artig: Tabs je Kategorie, Liste + Detail, gelesen/ungelesen, löschen.
 * Routen: #nachrichten[/<kat|alle>[/<id>]]. Koordinaten → #weltraum/system/<sys>/planet/<pos> (Zeile markiert).
 * DOM-frei beim Laden (Node-Tests): SS.ui.nachrichten.koordLink / verlinke / liste / detail.
 */
(function (g) {
  "use strict";
  var SS = (g.SS = g.SS || {});
  SS.ui = SS.ui || {};
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]; }); }
  function F() { return SS.format; }
  function kt(k) { return k.sektor + ":" + k.system + ":" + k.planet; }
  /** Anklickbarer Koordinaten-Link [S:SYS:P] → Weltraum-Ansicht. */
  function koordLink(k) {
    if (!k) return "";
    return "<a class=\"koord-link\" href=\"#weltraum/system/" + k.system + "/planet/" + k.planet + "\" data-koord=\"" + kt(k) + "\" title=\"In der Weltraum-Ansicht öffnen\">[" + kt(k) + "]</a>";
  }
  /** Ersetzt [S:SYS:P] bzw. S:SYS:P in bereits escaptem HTML durch Links (nur gültige Koordinaten). */
  function verlinke(html) {
    var W = SS.DATEN && SS.DATEN.weltraum;
    return String(html).replace(/\[?\b(\d{1,2}):(\d{1,3}):(\d{1,2})\b\]?(?![^<]*<\/a>)/g, function (m, a, b, c) {
      var k = W && W.leseKoordinaten(a + ":" + b + ":" + c);
      return k ? koordLink(k) : m;
    });
  }
  function namen(o, art) {
    var D = SS.DATEN, ids = Object.keys(o || {});
    return ids.length ? ids.map(function (id) { var d = art === "s" ? D.schiffNachId(id) : D.verteidigungNachId(id); return esc(d ? d.name : id) + " " + F().zahl(o[id]); }).join(", ") : "keine";
  }
  function spionageHtml(s) {
    var t = s.truemmer || { orbit: { metall: 0, silizium: 0 } };
    return "<div class=\"spionage-detail\" id=\"nachricht-spionage\"><p><b>" + esc(s.name || "") + "</b> " + koordLink(s.koordinaten) + (s.art ? " · " + esc(s.art) : "") + (s.punkte != null ? " · " + F().zahl(s.punkte) + " Punkte" : "") + "</p>" +
      "<dl class=\"info-liste\"><dt>Schiffe (Startplätze)</dt><dd>" + namen(s.schiffe, "s") + "</dd><dt>Verteidigung</dt><dd>" + namen(s.verteidigung, "v") + "</dd>" +
      (s.solarsatelliten ? "<dt>Solarsatelliten</dt><dd>" + F().zahl(s.solarsatelliten) + "</dd>" : "") +
      "<dt>Trümmer Orbit</dt><dd>" + F().zahl(t.orbit.metall) + " Metall · " + F().zahl(t.orbit.silizium) + " Silizium</dd>" +
      (s.tfAlterTage != null ? "<dt>Trümmerfeld-Alter</dt><dd>Tag " + (s.tfAlterTage + 1) + "</dd>" : "") + "</dl>" +
      (s.hinweis ? "<p class=\"spionage-hinweis\">» " + esc(s.hinweis) + "</p>" : "") + "</div>";
  }
  function detail(n) {
    var kopf = "<div class=\"nachricht-kopf\"><span>Von: <b>" + esc(n.von || "System") + "</b></span><span>" + F().uhrzeit(n.zeit) + "</span>" + (n.koord ? "<span>Ort: " + koordLink(n.koord) + "</span>" : "") + "</div>";
    var inhalt = n.kat === "kampf" && n.daten && SS.ui.kampfbericht ? "<p class=\"nachricht-text\">" + esc(n.text) + "</p>" + SS.ui.kampfbericht.html(n.daten).replace(/ id="kampf-bericht"/, " id=\"nachricht-kampfbericht\"")
      : n.kat === "spionage" && n.daten ? spionageHtml(n.daten)
      : "<p class=\"nachricht-text\">" + verlinke(esc(n.text)) + "</p>";
    return "<article class=\"nachricht-detail\" id=\"nachricht-detail\" data-id=\"" + esc(n.id) + "\">" + kopf + inhalt + "</article>";
  }
  function zeile(n, kat) {
    var K = SS.kern.nachrichten.katNachId(n.kat);
    return "<li class=\"nachricht-zeile" + (n.gelesen ? "" : " ungelesen") + "\" data-id=\"" + esc(n.id) + "\" data-kat=\"" + n.kat + "\">" +
      "<input type=\"checkbox\" class=\"nachricht-wahl\" value=\"" + esc(n.id) + "\" aria-label=\"Auswählen\">" +
      "<a class=\"nachricht-titel\" href=\"#nachrichten/" + kat + "/" + esc(n.id) + "\"><span class=\"nachricht-symbol\" title=\"" + K.name + "\">" + K.symbol + "</span> " + esc(n.titel) +
      (n.text && n.kat !== "spionage" ? " <small>– " + esc(n.text.length > 90 ? n.text.slice(0, 90) + "…" : n.text) + "</small>" : "") + "</a>" +
      (n.koord ? koordLink(n.koord) : "<span></span>") + "<time>" + F().uhrzeit(n.zeit) + "</time>" +
      "<button type=\"button\" class=\"knopf klein\" data-aktion=\"nachricht-loeschen\" data-id=\"" + esc(n.id) + "\" title=\"Löschen\" aria-label=\"Löschen\">✕</button></li>";
  }

  SS.ui.nachrichten = function (h) {
    function seite() {
      var z = h.zustand(), N = SS.kern.nachrichten, t = h.teile(), kat = N.katNachId(t[0]) ? t[0] : "alle";
      var tabs = "<nav class=\"nachrichten-tabs\" id=\"nachrichten-tabs\">" + [{ id: "alle", name: "Alle", symbol: "" }].concat(N.KATEGORIEN).map(function (k) {
        var u = N.ungelesen(z, k.id === "alle" ? null : k.id);
        return "<a href=\"#nachrichten/" + k.id + "\" data-kat=\"" + k.id + "\" class=\"" + (k.id === kat ? "aktiv" : "") + "\">" + (k.symbol ? k.symbol + " " : "") + k.name + (u ? " <span class=\"tab-zahl\">" + u + "</span>" : "") + "</a>";
      }).join("") + "</nav>";
      var l = z.nachrichten.filter(function (n) { return kat === "alle" || n.kat === kat; });
      var n = t[1] ? N.finde(z, t[1]) : null, kq = kat === "alle" ? "" : " data-kat=\"" + kat + "\"";
      var knoepfe = "<div class=\"knopf-reihe nachrichten-aktionen\">" +
        "<button type=\"button\" class=\"knopf klein\" data-aktion=\"nachrichten-gelesen\"" + kq + ">Alle als gelesen</button>" +
        "<button type=\"button\" class=\"knopf klein\" data-aktion=\"nachrichten-auswahl-loeschen\">Markierte löschen</button>" +
        "<button type=\"button\" class=\"knopf klein\" data-aktion=\"nachrichten-gelesene-loeschen\"" + kq + ">Gelesene löschen</button>" +
        "<button type=\"button\" class=\"knopf klein\" data-aktion=\"nachrichten-alle-loeschen\"" + kq + ">Alle löschen</button></div>";
      var liste = l.length ? "<ul class=\"nachrichten-liste\" id=\"nachrichten-liste\">" + l.map(function (x) { return zeile(x, kat); }).join("") + "</ul>" : "<p class=\"hinweis\" id=\"nachrichten-leer\">Keine Nachrichten in dieser Kategorie.</p>";
      var det = n ? h.box(esc(n.titel), detail(n), "<span class=\"knopf-reihe\"><a class=\"knopf klein\" href=\"#nachrichten/" + kat + "\">Zurück</a><button type=\"button\" class=\"knopf klein\" data-aktion=\"nachricht-loeschen\" data-id=\"" + esc(n.id) + "\" data-zurueck=\"" + kat + "\">Löschen</button></span>", " id=\"box-nachricht\"") : "";
      return tabs + det + h.box("Posteingang (" + l.length + ")", knoepfe + liste, "", " id=\"box-nachrichten\"");
    }
    return { seite: seite };
  };
  SS.ui.nachrichten.koordLink = koordLink;
  SS.ui.nachrichten.verlinke = verlinke;
  SS.ui.nachrichten.detail = detail;
  SS.ui.nachrichten.spionageHtml = spionageHtml;
})(typeof globalThis !== "undefined" ? globalThis : this);
