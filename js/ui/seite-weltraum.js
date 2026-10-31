/*
 * Sternenspiel – Seite „Weltraum“ (0.16.0, Sandro pt40u): Sektor → Sonnensystem → Planet, OGame-artig reduziert.
 * Systemansicht: Positionen 1–12 (+ Expeditionsraum :13). Knöpfe springen per Deeplink ins Flottenfenster:
 *   #flotte/senden/<mission>/<S:SYS:P>  (Mission + Koordinaten vorausgefüllt)
 * Spionage schickt – wie OGame – automatisch eine Spionagesonde los (app.js → spionageSchnell).
 * Datenmodell unverändert (js/data/weltraum.js: 5 Sektoren, 300 Systeme, 60 je Sektor); sichtbar ist je Sektor
 * ein Fenster von SICHTBAR (=5) Sonnensystemen um das gewählte System. Beim Laden DOM-frei (Node-Tests).
 */
(function (g) {
  "use strict";
  var SS = (g.SS = g.SS || {});
  SS.ui = SS.ui || {};
  var SICHTBAR = 5; // ANNAHME (Sandro: „4–5 Sonnensysteme pro Sektor“ in der Ansicht)

  /** Belegung eines Systems: 12 Zeilen {position, koord, art: eigen|gegner|leer, name, spieler, vernichtet}. DOM-frei. */
  function belegung(z, sys) {
    var D = SS.DATEN, W = D.weltraum, FL = SS.kern.flotte, s = W.system(sys);
    if (!s) return [];
    var eigene = FL.eigenePlaneten(z), gg = SS.kern.testphase ? SS.kern.testphase.alleGegner(z) : (z.gegner || []);
    return s.planeten.map(function (pl) {
      var k = { sektor: pl.sektor, system: pl.system, planet: pl.position };
      var gl = function (x) { return x.sektor === k.sektor && x.system === k.system && x.planet === k.planet; };
      var e = eigene.filter(gl)[0], x = gg.filter(gl)[0];
      var r = { position: pl.position, koord: W.koordinatenText(k), ziel: k, typ: pl.typ, art: "leer", name: "", spieler: "" };
      var pt = function (t, o) { return t && t[o] ? (t[o].metall || 0) + (t[o].silizium || 0) : 0; };
      if (e) { r.art = "eigen"; r.name = e.name || pl.name; r.spieler = (z.spieler && z.spieler.name) || z.name || "Du";
        var ep = (z.planeten || []).filter(function (q) { return q.id === e.id; })[0];
        r.truemmerOrbit = pt(ep && ep.truemmer, "orbit"); r.schrottBoden = pt(ep && ep.truemmer, "boden");
        r.schild = !!(SS.kern.bergung && SS.kern.bergung.schildStatus(ep, Date.now()).aktiv); }
      else if (x) { r.truemmerOrbit = pt(x.truemmer, "orbit"); r.art = "gegner"; r.name = x.name; r.spieler = x.name;
        if (x.ki && SS.kern.ki) { var jt = (z.zeit && z.zeit.letzterTick) || Date.now(); r.kiArt = x.ki.art; r.punkte = SS.kern.ki.punkte(z, x, jt); r.kiAktiv = SS.kern.ki.aktiv(x, jt, z); r.tfAlter = SS.kern.ki.tfAlterTage(x, jt, z); } r.vernichtet = !(FL.summe(x.schiffe) + FL.summe(x.verteidigung)); }
      return r;
    });
  }
  /** Sichtbares Fenster (SICHTBAR Systeme) im Sektor um sys. */
  function fenster(sys) {
    var W = SS.DATEN.weltraum, sk = W.sektor(W.sektorVonSystem(sys));
    var von = Math.max(sk.systemVon, Math.min(sys - Math.floor(SICHTBAR / 2), sk.systemBis - SICHTBAR + 1)), out = [];
    for (var n = von; n < von + SICHTBAR; n++) out.push(n);
    return out;
  }
  /** Deeplink ins Flottenfenster. */
  function link(mission, koord) { return "#flotte/senden/" + mission + "/" + koord; }

  SS.ui.weltraum = function (h) {
    var D = SS.DATEN, W = D.weltraum, esc = h.esc;
    function knopf(mission, koord, text, extra) {
      return "<a class=\"knopf klein wr-knopf wr-" + mission + "\" href=\"" + link(mission, koord) + "\" data-mission=\"" + mission + "\" data-koord=\"" + koord + "\" data-tip=\"" + text + "\" aria-label=\"" + text + "\"" + (extra || "") + ">" + SS.ui.symbole.svg(mission) + "</a>";
    }
    function seite() {
      var zz = h.zustand(), heim = SS.kern.flotte.herkunftKoord(zz, h.hp()), teile = h.teile();
      var sys = teile[0] === "system" ? parseInt(teile[1], 10) : teile[0] === "sektor" ? W.sektor(parseInt(teile[1], 10)) && W.sektor(parseInt(teile[1], 10)).systemVon : heim.system;
      if (!W.system(sys)) sys = heim.system;
      var s = W.system(sys), sk = W.sektor(s.sektor), U = W.universum();
      var sekSel = "<label>Sektor <select id=\"wr-sektor\">" + U.sektoren.map(function (x) { return "<option value=\"" + x.nummer + "\"" + (x.nummer === sk.nummer ? " selected" : "") + ">" + esc(x.name) + "</option>"; }).join("") + "</select></label>";
      var nav = "<div class=\"wr-nav\">" + sekSel +
        "<a class=\"knopf klein\" href=\"#weltraum/system/" + Math.max(sk.systemVon, sys - 1) + "\" id=\"wr-zurueck\" aria-label=\"Vorheriges Sonnensystem\">◀</a>" +
        "<label>Sonnensystem <input id=\"wr-system\" type=\"number\" min=\"" + sk.systemVon + "\" max=\"" + sk.systemBis + "\" value=\"" + sys + "\" inputmode=\"numeric\"></label>" +
        "<a class=\"knopf klein\" href=\"#weltraum/system/" + Math.min(sk.systemBis, sys + 1) + "\" id=\"wr-vor\" aria-label=\"Nächstes Sonnensystem\">▶</a>" +
        "<a class=\"knopf klein\" href=\"#weltraum/system/" + heim.system + "\" id=\"wr-heimat\">⌂ Heimat</a></div>" +
        "<ul class=\"wr-fenster\" id=\"wr-fenster\">" + fenster(sys).map(function (n) {
          var x = W.system(n), b = belegung(zz, n).filter(function (r) { return r.art !== "leer"; }).length;
          return "<li" + (n === sys ? " class=\"aktiv\"" : "") + "><a href=\"#weltraum/system/" + n + "\" data-system=\"" + n + "\"><b>" + x.sektor + ":" + n + "</b>" + (b ? " <span class=\"tab-zahl\">" + b + "</span>" : "") + "</a></li>"; }).join("") + "</ul>" +
        "<p class=\"hinweis\">" + D.weltraum.universum().sektoren.length + " Sektoren · " + SS.BALANCE.WELTRAUM.SYSTEME_GESAMT + " Sonnensysteme (" + sk.systemVon + "–" + sk.systemBis + " in " + esc(sk.name) + ") · " + SS.BALANCE.WELTRAUM.PLANETEN_PRO_SYSTEM + " Planeten je Sonnensystem</p>";
      var zeilen = belegung(zz, sys).map(function (r) {
        var aktion = r.art === "leer" ? knopf("kolonisieren", r.koord, "Kolonisieren") :
          (r.art === "gegner" ? knopf("spionieren", r.koord, "Spionage", " data-aktion=\"wr-spionage\"") + knopf("angriff", r.koord, "Angriff") : "") +
          knopf("transportieren", r.koord, "Transport") + (r.art === "eigen" ? knopf("stationieren", r.koord, "Stationieren") : "");
        return "<tr class=\"wr-" + r.art + "\" data-position=\"" + r.position + "\" data-koord=\"" + r.koord + "\"><td class=\"z\">" + r.position + "</td>" +
          "<td>" + (r.art === "leer" ? "<span class=\"hinweis\">– frei –</span>" : "<b>" + esc(r.name) + "</b>" + (r.schild ? " <img class=\"schild-symbol\" src=\"assets/icons/schild.svg\" alt=\"Schild aktiv\" title=\"Angriffsschild aktiv\" width=\"16\" height=\"16\">" : "") + (r.vernichtet ? " <i>vernichtet</i>" : "")) + "</td>" +
          "<td class=\"wr-truemmer\">" + (r.truemmerOrbit > 0 ? "<a class=\"wr-tf\" href=\"" + link("sammeln", r.koord) + "\" data-mission=\"sammeln\" title=\"Trümmerfeld (Orbit): " + r.truemmerOrbit + (r.tfAlter !== null && r.tfAlter !== undefined ? " · Tag " + (r.tfAlter + 1) + "/" + SS.kern.ki.K.TF_MAX_TAGE : "") + " – Wracksammler senden\"><img src=\"assets/icons/wracksammlung.svg\" alt=\"Trümmerfeld\" width=\"20\" height=\"20\"></a>" : "") +
            (r.schrottBoden > 0 ? "<a class=\"wr-bs\" href=\"" + link("bodensammlung", r.koord) + "\" data-mission=\"bodensammlung\" title=\"Boden-Schrott: " + r.schrottBoden + " – Bodensammler senden\"><img src=\"assets/icons/bodensammlung.svg\" alt=\"Boden-Schrott\" width=\"20\" height=\"20\"></a>" : "") + "</td>" +
          "<td>[" + r.koord + "]</td><td>" + (r.art === "eigen" ? "<span class=\"gut\">" + esc(r.spieler) + " (du)</span>" : r.art === "gegner" ? "<span class=\"schlecht\">⚔ " + esc(r.spieler) + "</span>" + (r.kiArt ? " <span class=\"wr-ki wr-ki-" + r.kiArt + "\">" + ({ siedler: "Siedler", pirat: "Pirat", rivale: "Rivale" })[r.kiArt] + (r.kiArt === "rivale" && !r.kiAktiv ? " (inaktiv)" : "") + " · " + (SS.format ? SS.format.zahl(r.punkte) : r.punkte) + " P</span>" : "") : "") + "</td>" +
          "<td class=\"wr-aktionen\">" + aktion + "</td></tr>";
      }).join("");
      var exKoord = s.sektor + ":" + sys + ":" + SS.BALANCE.EXPEDITION.POSITION;
      var tab = "<div class=\"tabelle-huelle\"><table class=\"tabelle wr-tabelle\" id=\"wr-tabelle\"><thead><tr><th class=\"z\">Pos.</th><th>Planet</th><th title=\"Trümmerfeld / Boden-Schrott\">TF</th><th>Koordinaten</th><th>Spieler</th><th>Aktionen</th></tr></thead><tbody>" + zeilen +
        "<tr class=\"wr-expedition\" data-position=\"" + SS.BALANCE.EXPEDITION.POSITION + "\"><td class=\"z\">" + SS.BALANCE.EXPEDITION.POSITION + "</td><td><i>Expeditionsraum</i></td><td></td><td>[" + exKoord + "]</td><td></td><td class=\"wr-aktionen\">" + knopf("expedition", exKoord, "Expedition") + "</td></tr></tbody></table></div>";
      return h.box("Navigation", nav, "", " id=\"wr-navigation\"") +
        h.box("Sonnensystem " + sys + " [" + s.sektor + ":" + sys + "] · " + esc(s.stern.name), tab, "", " id=\"wr-system-box\"");
    }
    return { seite: seite };
  };
  SS.ui.weltraum.belegung = belegung;
  SS.ui.weltraum.fenster = fenster;
  SS.ui.weltraum.link = link;
  SS.ui.weltraum.SICHTBAR = SICHTBAR;
})(typeof globalThis !== "undefined" ? globalThis : this);
