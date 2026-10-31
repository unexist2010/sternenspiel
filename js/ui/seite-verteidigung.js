/*
 * Sternenspiel – Seite „Verteidigung“ (Kapitel 5). Reine HTML-Erzeugung im Retro-Layout der Werft; app.js übergibt die Helfer (h).
 * Enthält: Verteidigungswerft-Info, Aufträge, Anlagen je Gruppe, Waffenprofile (Zwei-Hüllen-System) und einen Kampf-Simulator (Test,
 * ändert den Spielstand NICHT). Beim Laden DOM-frei (Node-Tests).
 */
(function (g) {
  "use strict";
  var SS = (g.SS = g.SS || {});
  SS.ui = SS.ui || {};

  SS.ui.verteidigung = function (h) {
    var D = SS.DATEN, VT = SS.kern.verteidigung, KA = SS.kern.kampf, F = SS.format, esc = h.esc;
    var letzterBericht = null;
    function z() { return h.zustand(); }
    function p() { return h.hp(); }
    function zahl(n) { return F.zahl(Math.round(n)); }
    function mit(v, grund) { return zahl(v) + (Math.abs(v - grund) > 1e-6 ? " <small class=\"plus\">(" + zahl(grund) + " +" + Math.round((v / Math.max(1e-9, grund) - 1) * 100) + " %)</small>" : ""); }

    function waffenMarken(waffen) {
      return Object.keys(waffen).map(function (id) {
        var wt = D.waffentypNachId(id);
        return "<span class=\"waffe-marke\" style=\"border-color:" + wt.farbe + ";color:" + wt.farbe + "\">" + wt.name + (waffen[id] < 1 ? " " + Math.round(waffen[id] * 100) + " %" : "") + "</span>";
      }).join("") || "<span class=\"waffe-marke leer\">unbewaffnet</span>";
    }
    function kachel(d) {
      var zz = z(), pp = p(), master = VT.istMaster(zz), n = VT.anzahl(pp, d.id), w = VT.werte(zz, d), vorOk = VT.voraussetzungenOk(zz, pp, d);
      var laeuft = (pp.verteidigungsauftraege || []).some(function (a) { return a.id === d.id; });
      var vor = VT.voraussetzungen(zz, pp, d).map(function (x) { return "<span class=\"vor " + (x.ok ? "ok" : "fehlt") + "\" title=\"aktuell Stufe " + x.ist + "\">" + (x.ok ? "✔ " : "✘ ") + esc(x.name) + " " + x.stufe + "</span>"; }).join(" ");
      return "<article class=\"schiff-zeile schiff-kachel def-kachel" + (laeuft ? " im-bau" : "") + (!vorOk ? " gesperrt" : "") + "\" data-def=\"" + d.id + "\">" +
        "<div class=\"schiff-bildspalte\"><img class=\"anlage-bild schiff-bild\" src=\"" + D.verteidigungBild(d, n) + "\" alt=\"" + esc(d.name) + "\" width=\"200\" height=\"200\"></div><div class=\"schiff-inhalt\">" +
        "<div class=\"anlage-kopf schiff-kopf\"><div class=\"anlage-titel\"><h3>" + d.name + " " + h.infoKnopf("verteidigung", d.id, d.name) + "</h3>" +
        "<span class=\"stufe\">Anzahl <b data-def-anzahl=\"" + d.id + "\">" + F.zahl(n) + "</b>" + (d.max ? " / " + d.max : "") + "</span>" +
        (!vorOk ? "<span class=\"sperr-marke\">🔒 Voraussetzung fehlt" + (master ? " (Master)" : "") + "</span>" : "") + "</div></div>" +
        "<p class=\"schiff-marken\"><span class=\"huelle-marke " + d.huelle + "\">" + (d.phase === "orbit" ? "Phase Orbit" : "Phase Boden") + "</span>" + waffenMarken(d.waffen) +
        (d.schutzschild ? "<span class=\"antrieb-marke\">Planetenschild</span>" : "") + "</p>" +
        "<p class=\"beschreibung\">" + esc(d.beschreibung) + "</p><p class=\"vor-liste\"><span class=\"vor-titel\">Voraussetzungen:</span> " + vor + "</p>" +
        "<dl class=\"anlage-werte\"><dt>Kosten je Stück</dt><dd>" + h.kostenHtml(d.kosten) + (master ? " <span class=\"master-marke\">kostenlos</span>" : "") + "</dd>" +
        "<dt>Bauzeit je Stück</dt><dd>" + (master ? "sofort <span class=\"master-marke\">Master</span>" : VT.vwStufe(pp) > 0 ? F.dauer(VT.stueckMs(zz, pp, d)) : "–") + "</dd>" +
        "<dt>Angriff</dt><dd>" + mit(w.angriff, w.grund.angriff) + "</dd>" +
        "<dt>Energiehülle / Metallhülle</dt><dd>" + mit(w.energie, w.grund.energie) + " / " + mit(w.metall, w.grund.metall) + "</dd></dl>" +
        "<div class=\"bau-aktion schiff-bestellung\"><label class=\"menge\"><span>Menge</span><input type=\"number\" min=\"1\" step=\"1\" value=\"1\" inputmode=\"numeric\" data-def-menge=\"" + d.id + "\" aria-label=\"Menge " + esc(d.name) + "\"></label>" +
        "<button class=\"knopf klein\" type=\"button\" data-aktion=\"def-max\" data-id=\"" + d.id + "\">max</button>" +
        "<button class=\"knopf primaer\" type=\"button\" data-aktion=\"def-bauen\" data-id=\"" + d.id + "\">" + (master ? "Sofort bauen" : "Bauen") + "</button><span class=\"grund hinweis\"></span></div>" +
        "</div></article>";
    }

    function auftragZeile(a, i) {
      return "<div class=\"bau-laufend werft-auftrag\" data-def-index=\"" + i + "\"><div class=\"bau-zeile\"><b>" + F.zahl(a.menge) + "× " + esc(a.name) + "</b><span data-live=\"vert-rest:" + i + "\"></span></div>" +
        "<div class=\"balken\"><div class=\"balken-fuellung werft\" data-live=\"vert-balken:" + i + "\"></div></div>" +
        "<div class=\"knopf-reihe\"><span class=\"hinweis\" data-live=\"vert-stand:" + i + "\"></span><button class=\"knopf klein gefahr\" type=\"button\" data-aktion=\"def-abbrechen\" data-index=\"" + i + "\">Abbrechen</button></div></div>";
    }
    function auftragBox(aufSeite) {
      var pp = p(), q = pp.verteidigungsauftraege || [], ohne = !(VT.vwStufe(pp) > 0);
      var inhalt = q.length ? q.map(auftragZeile).join("") :
        "<p class=\"hinweis\">" + (ohne ? "Noch keine Verteidigungswerft – zuerst unter Anlagen bauen." : "Keine Anlagen im Bau. Die Warteschlange läuft unabhängig von Werft, Bau und Forschung.") + "</p>";
      if (!aufSeite) inhalt += "<a class=\"knopf klein\" href=\"" + (ohne ? "#anlagen" : "#verteidigung") + "\">" + (ohne ? "Verteidigungswerft bauen" : "Zur Verteidigung") + "</a>";
      return h.box("Verteidigungs-Aufträge", inhalt, "<span class=\"box-zahl\">" + q.length + "</span>", " id=\"def-box\"");
    }

    function waffenTabelle() {
      var K = SS.BALANCE.KAMPF;
      var zeilen = D.waffentypen.map(function (w) {
        return "<tr><td><span class=\"waffe-marke\" style=\"border-color:" + w.farbe + ";color:" + w.farbe + "\">" + w.name + "</span></td><td class=\"z\">×" + F.rate(w.profil.energie) + "</td><td class=\"z\">×" + F.rate(w.profil.metall) +
          "</td><td class=\"z\">×" + F.rate(Math.round(w.profil.metall * (w.profil.metall >= K.BONUS_SCHWELLE ? K.BONUS_NACH_ENERGIE : K.MALUS_NACH_ENERGIE) * 100) / 100) + "</td><td>" + esc(w.rolle) + "</td></tr>";
      }).join("");
      return h.box("Waffen & Hüllen", "<p class=\"hinweis\">Jedes Schiff und jede Anlage hat eine <b>Metallhülle</b> und eine <b>Energiehülle</b>; beide werden gleichzeitig getroffen. " +
        "Fällt die Energiehülle, treffen metallwirksame Waffen die Metallhülle ×" + F.rate(K.BONUS_NACH_ENERGIE) + ", reine Energiewaffen nur noch ×" + F.rate(K.MALUS_NACH_ENERGIE) + ". " +
        "Ziele ganz ohne Energiehülle (frühe Schiffe) zählen wie „Hülle schon gebrochen“: Metallwaffen bekommen den Bonus, Laser &amp; Ionen sind nahezu wirkungslos. Planetenschild ohne Abklingzeit – nach jedem Angriff wieder aktiv. Orbitalplattformen sind danach immer wieder vollständig da, außer ein Titan hat überlebt. <span class=\"annahme-marke\">Annahme: Zahlen</span></p>" +
        "<div class=\"tabelle-wrap\"><table class=\"info-tabelle\" id=\"waffen-tabelle\"><thead><tr><th>Waffe</th><th class=\"z\">vs Energie</th><th class=\"z\">vs Metall</th><th class=\"z\">Metall nach Zusammenbruch</th><th>Rolle</th></tr></thead><tbody>" + zeilen + "</tbody></table></div>", "", " id=\"waffen-box\"");
    }

    function berichtHtml(b) {
      var zeile = function (x) { return "<tr><td>" + esc(x.name) + "</td><td class=\"z\">" + F.zahl(x.vorher) + "</td><td class=\"z\">" + F.zahl(x.nachher) + "</td><td class=\"z\">" + (x.verloren ? "−" + F.zahl(x.verloren) : "–") + "</td><td class=\"z\">" + (x.repariert != null ? F.zahl(x.repariert) : "–") + "</td></tr>"; };
      var tab = function (t, l) { return l.length ? "<h4>" + t + "</h4><div class=\"tabelle-wrap\"><table class=\"info-tabelle\"><thead><tr><th>Einheit</th><th class=\"z\">vorher</th><th class=\"z\">nachher</th><th class=\"z\">verloren</th><th class=\"z\">repariert</th></tr></thead><tbody>" + l.map(zeile).join("") + "</tbody></table></div>" : "<h4>" + t + "</h4><p class=\"hinweis\">keine</p>"; };
      var sieg = { angreifer: "Angreifer gewinnt", verteidiger: "Verteidigung hält", unentschieden: "Unentschieden" }[b.sieger];
      var rs = function (r) { return F.zahl(r.metall) + " Metall · " + F.zahl(r.silizium) + " Silizium"; };
      return "<div class=\"kampf-bericht\" id=\"kampf-bericht\"><p><b data-sieger=\"" + b.sieger + "\">" + sieg + "</b> · Orbit " + b.phasen[0].runden.length + " Runden · Boden " + b.phasen[1].runden.length + " Runden" +
        (b.schild ? " · Planetenschild " + (b.schild.gefallen ? "gefallen (nach dem Angriff wieder aktiv)" : "hält (" + zahl(b.schild.rest) + " / " + zahl(b.schild.start) + ")") : "") + "</p>" +
        tab("Angreifer", b.angreifer) + tab("Phase 1 – Orbit (Startplätze + Orbitalplattform)", b.orbit) + tab("Phase 2 – Boden", b.boden) +
        "<p class=\"hinweis\">Trümmerfeld Orbit (Wracksammler, " + Math.round(b.quoten.orbit * 100) + " %): " + rs(b.truemmerOrbit) + "<br>Schrott Boden (Bodensammler, " + Math.round(b.quoten.schrott * 100) + " %): " + rs(b.schrottBoden) +
        "<br>Reparatur Verteidigung: " + Math.round(b.quoten.reparatur * 100) + " % · Hangar geschützt: " + F.zahl(Object.keys(b.verteilung.hangar).reduce(function (s, k) { return s + b.verteilung.hangar[k]; }, 0)) +
        " Schiffe · rücken nach dem Kampf nach: " + F.zahl(b.nachruecken) + "</p></div>";
    }
    function simulator() {
      var opts = D.schiffe.filter(function (s) { return s.gruppe === "kampf"; }).map(function (s) { return "<option value=\"" + s.id + "\">" + esc(s.name) + "</option>"; }).join("");
      return h.box("Kampf-Simulator (Test)", "<p class=\"hinweis\">Probe-Angriff auf diesen Planeten: Phase 1 Orbit, Phase 2 Boden. Der Spielstand wird <b>nicht</b> verändert. " +
        "Angreifer ohne Forschung; kein Schnellfeuer, kein Zufall (Erwartungswerte). Echte Angriffe kommen mit den Flotten (Kapitel 6). <span class=\"annahme-marke\">Platzhalter</span></p>" +
        "<div class=\"bau-aktion\"><label class=\"menge\"><span>Schiff</span><select id=\"sim-schiff\">" + opts + "</select></label>" +
        "<label class=\"menge\"><span>Anzahl</span><input type=\"number\" id=\"sim-anzahl\" min=\"1\" value=\"10\"></label>" +
        "<label class=\"menge\"><span>Bergung</span><input type=\"checkbox\" id=\"sim-bergung\"></label>" +
        "<button class=\"knopf primaer\" type=\"button\" data-aktion=\"sim-start\">Simulieren</button></div><div id=\"sim-ausgabe\">" + (letzterBericht ? berichtHtml(letzterBericht) : "") + "</div>", "", " id=\"sim-box\"");
    }
    function simuliere(id, n, bergung) {
      var ang = {}; ang[id] = Math.max(1, Math.floor(Number(n) || 1));
      letzterBericht = KA.simuliere(z(), p(), { angreifer: ang, bergung: !!bergung });
      return berichtHtml(letzterBericht);
    }

    function seite() {
      var zz = z(), pp = p(), st = VT.vwStufe(pp), master = VT.istMaster(zz);
      if (!(st > 0)) {
        return h.box("Verteidigung", "<p class=\"forschung-fehlt\" id=\"def-hinweis\"><b>Verteidigungswerft bauen</b> – Verteidigungsanlagen und die Orbitalverteidigungsplattform werden in der Verteidigungswerft gebaut (Stufe 1 nötig, auch im Master-Modus).</p>" +
          "<a class=\"knopf primaer\" href=\"#anlagen\" id=\"knopf-vw-bauen\">Verteidigungswerft bauen</a>", "", " id=\"def-info\"") + waffenTabelle();
      }
      var vt = KA.verteilung(pp), sum = function (o) { return Object.keys(o).reduce(function (s, k) { return s + o[k]; }, 0); };
      var bestand = D.verteidigung.reduce(function (s, d) { return s + (d.schutzschild ? 0 : VT.anzahl(pp, d.id)); }, 0);
      var schild = D.verteidigung.filter(function (d) { return d.schutzschild; }).reduce(function (s, d) { return s + VT.anzahl(pp, d.id) * VT.werte(zz, d).energie; }, 0);
      var info = h.box("Verteidigungswerft", "<dl class=\"werte\"><dt>Stufe</dt><dd id=\"vw-stufe\">" + st + "</dd><dt>Bauzeit</dt><dd>÷ " + (1 + st) + " (1 + Stufe) × Roboter</dd>" +
        "<dt>Anlagen am Planeten</dt><dd id=\"def-bestand\">" + F.zahl(bestand) + "</dd><dt>Planetenschild</dt><dd id=\"def-schild\">" + (schild ? zahl(schild) : "–") + "</dd>" +
        "<dt>Schiffe Startplätze / Hangar</dt><dd id=\"def-verteilung\">" + F.zahl(sum(vt.startplatz)) + " / " + F.zahl(sum(vt.hangar)) + " (Kapazität " + F.zahl(vt.kapazitaet) + ")</dd>" +
        "<dt>Trümmer Orbit / Schrott Boden</dt><dd>" + F.zahl((pp.truemmer && pp.truemmer.orbit.metall + pp.truemmer.orbit.silizium) || 0) + " / " + F.zahl((pp.truemmer && pp.truemmer.boden.metall + pp.truemmer.boden.silizium) || 0) + "</dd></dl>" +
        "<p class=\"hinweis\">Kampfablauf: <b>1. Orbit</b> – Angreifer gegen Schiffe auf den Startplätzen (starten automatisch) und Orbitalplattformen. <b>2. Boden</b> – verbleibende Angreifer gegen die Bodenverteidigung. " +
        "Schiffe im Hangar sind geschützt und rücken erst nach dem Kampf auf freie Startplätze nach.</p>" +
        (master ? "<p class=\"hinweis\">Master: sofort und kostenlos, Voraussetzungen ignoriert (Verteidigungswerft bleibt Pflicht).</p>" : ""), "", " id=\"def-info\"");
      var gruppen = D.verteidigungGruppen.map(function (gr) {
        var liste = D.verteidigung.filter(function (d) { return d.gruppe === gr.id; });
        return h.box(gr.name, "<div class=\"schiff-liste\">" + liste.map(kachel).join("") + "</div>", "<span class=\"box-zahl\">" + liste.length + "</span>", " data-def-gruppe=\"" + gr.id + "\"");
      }).join("");
      return "<div class=\"zwei-spalten\">" + auftragBox(true) + info + "</div>" + gruppen + waffenTabelle() + simulator();
    }

    function info(d) {
      var zz = z(), pp = p(), w = VT.werte(zz, d);
      var zeile = function (t, grund, v, b) { return "<tr><td>" + t + "</td><td class=\"z\">" + zahl(grund) + "</td><td class=\"z\">" + zahl(v) + "</td><td class=\"z\">" + (b > 1e-9 ? "<span class=\"plus\">+" + F.rate(Math.round(b * 10) / 10) + " %</span>" : "–") + "</td></tr>"; };
      var waffen = Object.keys(d.waffen).map(function (id) { return D.waffentypNachId(id).name + " " + Math.round(d.waffen[id] * 100) + " %"; }).join(", ") || "keine";
      var vor = VT.voraussetzungen(zz, pp, d).map(function (x) { return (x.ok ? "✔ " : "✘ ") + esc(x.name) + " " + x.stufe; }).join(", ");
      return { titel: d.name + " · Anzahl " + F.zahl(VT.anzahl(pp, d.id)), text: d.info,
        extra: "<p class=\"hinweis\">Phase: <b>" + (d.phase === "orbit" ? "Orbit" : "Boden") + "</b> · Waffen: <b>" + waffen + "</b>" + (d.max ? " · höchstens " + d.max : "") + "</p><p class=\"hinweis\">Voraussetzungen: " + vor + "</p>",
        kopf: "<tr><th>Wert</th><th class=\"z\">Grund</th><th class=\"z\">mit Forschung</th><th class=\"z\">Bonus</th></tr>",
        zeilen: zeile("Angriff", w.grund.angriff, w.angriff, w.bonus.waffen) + zeile("Energiehülle", w.grund.energie, w.energie, w.bonus.schild) + zeile("Metallhülle", w.grund.metall, w.metall, w.bonus.panzerung),
        hinweis: "Alle Verteidigungswerte sind Vorschläge (Annahme).", bild: D.verteidigungBild(d, VT.anzahl(pp, d.id)) };
    }

    function live(el, art, i, t) {
      var a = (p().verteidigungsauftraege || [])[Number(i)];
      if (art === "vert-balken") { el.style.width = a ? Math.min(100, Math.max(0, (t - a.start) / Math.max(1, a.ende - a.start) * 100)).toFixed(1) + "%" : "0%"; return null; }
      if (art === "vert-rest") return a ? (t < a.start ? "wartet · " : "noch ") + F.dauer(Math.max(0, a.ende - t)) : "";
      if (art === "vert-stand") return a ? F.zahl(Math.min(a.menge, Math.max(a.fertig, Math.floor((t - a.start) / a.stueckMs)))) + " / " + F.zahl(a.menge) + " fertig · je " + F.dauer(a.stueckMs) + " · Ende " + F.uhrzeit(a.ende) : "";
      return undefined;
    }
    return { seite: seite, auftragBox: auftragBox, info: info, live: live, simuliere: simuliere };
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
