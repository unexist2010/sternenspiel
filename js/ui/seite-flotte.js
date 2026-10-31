/*
 * Sternenspiel – Seite „Flotte“ (Kapitel 6) + rechte Seitenleiste „Flotten unterwegs“.
 * Flottenfenster (Startbahnen/Hangar, Preset-Dropdown), Sendefenster im Flottenfenster integriert (0.13.1; #flotte/senden springt dorthin). Beim Laden DOM-frei (Node-Tests).
 */
(function (g) {
  "use strict";
  var SS = (g.SS = g.SS || {});
  SS.ui = SS.ui || {};

  SS.ui.flotte = function (h) {
    var D = SS.DATEN, FL = SS.kern.flotte, F = SS.format, W = function () { return D.weltraum; }, esc = h.esc;
    function z() { return h.zustand(); }
    function p() { return h.hp(); }
    function kt(k) { return W().koordinatenText(k); }
    function uhr(ms) { var x = Math.ceil(Math.max(0, ms) / 1000), hh = Math.floor(x / 3600), mm = Math.floor(x % 3600 / 60), ss = x % 60; return (hh ? hh + ":" + (mm < 10 ? "0" : "") : "") + mm + ":" + (ss < 10 ? "0" : "") + ss; }
    function mName(id) { var m = FL.missionNachId(id); return m ? m.name : id; }

    function schiffListe(obj, leer, attr) {
      var ids = Object.keys(obj).filter(function (id) { return obj[id] > 0; });
      if (!ids.length) return "<p class=\"hinweis\">" + leer + "</p>";
      ids.sort(function (a, b) { return D.schiffIds.indexOf(a) - D.schiffIds.indexOf(b); });
      return "<ul class=\"flotte-liste\"" + (attr || "") + ">" + ids.map(function (id) {
        var s = D.schiffNachId(id);
        return "<li data-schiff=\"" + id + "\"><img src=\"" + D.schiffBild(s, obj[id]) + "\" alt=\"\" width=\"36\" height=\"36\"><span>" + esc(s.name) + "</span><b>" + F.zahl(obj[id]) + "</b></li>";
      }).join("") + "</ul>";
    }
    function flugZeile(f, t, kurz) {
      var st = FL.status(f, t);
      return "<li class=\"flug\" data-flotte=\"" + f.id + "\"><div class=\"flug-kopf\"><b>" + esc(mName(f.mission)) + "</b> <span class=\"flug-phase\">" + (f.phase === "hin" ? "→ " : f.phase === "halten" ? "◎ " : "← ") + "</span>" +
        "<span class=\"flug-ziel\">" + kt(f.ziel) + (f.zielName ? " " + esc(f.zielName) : "") + "</span></div>" +
        "<div class=\"flug-info\">" + F.zahl(f.anzahl) + " Schiffe · " + (f.phase === "hin" ? "Hinflug" : f.phase === "halten" ? "hält (" + (f.halten || 1) + " h)" : "Rückflug") + " · <span data-live=\"flug-rest:" + f.id + "\">" + uhr(st.rest) + "</span> (" + Math.floor(st.prozent) + "&nbsp;%)</div>" +
        "<div class=\"flug-balken\"><span data-live=\"flug-proz:" + f.id + "\" style=\"width:" + st.prozent.toFixed(1) + "%\"></span></div>" +
        (!kurz && SS.kern.bergung && SS.kern.bergung.kannRueckruf(f) ? "<div class=\"knopf-reihe\"><button type=\"button\" class=\"knopf klein\" data-aktion=\"flotte-rueckruf\" data-id=\"" + f.id + "\" title=\"Flotte sofort umkehren – keine Zusatzkosten, Rohöl für die ungeflogene Strecke zurück\">↩ Rückruf (+" + F.zahl(SS.kern.bergung.erstattung(f, t)) + " Rohöl)</button></div>" : "") +
        (kurz ? "" : (f.bericht ? "<div class=\"hinweis\">" + esc(f.bericht) + "</div>" : "")) + "</li>";
    }

    // ---------- Flottenfenster ----------
    function seite() {
      var zz = z(), pp = p(), sb = FL.startbahnen(zz, pp), t = Date.now();
      var flyHangar = Object.keys(pp.schiffe || {}).some(function (id) { return pp.schiffe[id] > 0 && FL.fliegt(D.schiffNachId(id)); });
      var eigene = zz.flotten.filter(function (f) { return f.herkunft === pp.id; });
      var presetSel = "<label class=\"preset-wahl\">Preset Startbahnen <select id=\"flotte-preset\" data-preset>" + FL.PRESETS.map(function (x) {
        return "<option value=\"" + x.id + "\"" + (x.id === sb.preset ? " selected" : "") + ">" + x.name + "</option>"; }).join("") + "</select></label>";
      var pr = FL.presetNachId(sb.preset);
      var kopf = "<dl class=\"werte\" id=\"flotte-plaetze\"><dt>Startplatz-Kapazität</dt><dd id=\"fl-kap\">" + F.zahl(sb.kapazitaet) + "</dd>" +
        "<dt>Belegt durch Flotten unterwegs</dt><dd id=\"fl-unterwegs\">" + F.zahl(sb.unterwegs) + "</dd>" +
        "<dt>Freie Startplätze</dt><dd id=\"fl-frei\">" + F.zahl(sb.frei) + "</dd>" +
        "<dt>Schiffe auf den Startbahnen</dt><dd id=\"fl-startbahn\">" + F.zahl(sb.aufStartbahn) + "</dd></dl>";
      var verteid = sb.kapazitaet === 0 ? "<p class=\"forschung-fehlt\" id=\"fl-hinweis\">Keine Startplätze – im <a href=\"#anlagen/raumflughafen\">Raumflughafen</a> Startplätze ausbauen.</p>" :
        sb.verteidigt ? "<p class=\"hinweis gut\" id=\"fl-verteidigung\">Die Schiffe auf den Startbahnen starten bei einem Angriff als Verteidigungsflotte.</p>" :
        "<p class=\"forschung-fehlt\" id=\"fl-verteidigung\"><b>Keine Verteidigungsflotte:</b> eine eigene Flotte belegt Startplätze. Bei einem Angriff kämpft im Orbit nur die Orbitalverteidigungsplattform, danach die Bodenverteidigung.</p>";
      var startb = h.box("Startplatz", kopf + presetSel + "<p class=\"hinweis\">" + esc(pr.text) + " (Tausch mit dem Hangar geschieht automatisch).</p>" + verteid +
        schiffListe(sb.startplatz, "Keine Schiffe auf den Startbahnen.", " id=\"liste-startbahn\""),
        "<a class=\"knopf primaer\" href=\"#flotte/senden\" id=\"knopf-senden\"" + (sb.frei > 0 && flyHangar ? "" : " aria-disabled=\"true\"") + ">Flotte senden ↓</a>", " id=\"box-startbahnen\"");
      var hangar = h.box("Hangar", "<p class=\"hinweis\">Alle übrigen Schiffe – geschützt bei Angriffen.</p>" + schiffListe(sb.hangar, "Hangar leer.", " id=\"liste-hangar\"") +
        (pp.solarsatelliten ? "<p class=\"hinweis\">Solarsatelliten im Orbit: " + F.zahl(pp.solarsatelliten) + " (fliegen nicht).</p>" : ""), "", " id=\"box-hangar\"");
      var unterwegs = h.box("Unterwegs von diesem Planeten", eigene.length ? "<ul class=\"flug-liste\" id=\"liste-unterwegs\">" + eigene.map(function (f) { return flugZeile(f, t, false); }).join("") + "</ul>" :
        "<p class=\"hinweis\" id=\"liste-unterwegs\">Keine Flotte unterwegs – alle " + F.zahl(sb.kapazitaet) + " Startplätze stehen zur Verfügung.</p>", "", " id=\"box-unterwegs\"");
      // 0.13.1 (Sandro t30u): OGame-artig – Tabs „Startplatz“ und „Hangar“ als große, zuklappbare Dropdowns; Senden im Flottenfenster.
      var tab = function (id, titel, zahl, inhalt) { return "<details class=\"flotte-tab\" id=\"tab-" + id + "\" open><summary>" + titel + " <span class=\"tab-zahl\">" + F.zahl(zahl) + "</span></summary>" + inhalt + "</details>"; };
      return testphaseBox() + "<div class=\"flotte-tabs\">" + tab("startplatz", "Startplatz", sb.aufStartbahn, startb) + tab("hangar", "Hangar", FL.summe(sb.hangar), hangar) + "</div>" + bergungBox() + sendefenster() + unterwegs + expeditionBox() + berichteBox();
    }

    // ---------- Bergung (0.19.0, Sandro t52u): zwei Symbole wie OGame → Sendefenster mit Mission + eigenen Koordinaten ----------
    function bergungBox() {
      var zz = z(), pp = p(), k = kt(FL.herkunftKoord(zz, pp)), tr = pp.truemmer || { orbit: {}, boden: {} };
      var o = (tr.orbit.metall || 0) + (tr.orbit.silizium || 0), b = (tr.boden.metall || 0) + (tr.boden.silizium || 0);
      var ws = (pp.schiffe.wracksammler || 0), bs = (pp.schiffe.bodensammler || 0);
      return h.box("Bergung", "<div class=\"bergung-wahl\" id=\"bergung-wahl\">" +
        "<a class=\"bergung-knopf\" id=\"bergung-wrack\" href=\"#flotte/senden/sammeln/" + k + "\"><img src=\"assets/icons/wracksammlung.svg\" alt=\"\" width=\"32\" height=\"32\"><span><b>Wracksammlung</b><small>Orbit-Trümmer hier: " + F.zahl(o) + " · Wracksammler: " + F.zahl(ws) + "</small></span></a>" +
        "<a class=\"bergung-knopf\" id=\"bergung-boden\" href=\"#flotte/senden/bodensammlung/" + k + "\"><img src=\"assets/icons/bodensammlung.svg\" alt=\"\" width=\"32\" height=\"32\"><span><b>Bodensammlung</b><small>Boden-Schrott hier: " + F.zahl(b) + " · Bodensammler: " + F.zahl(bs) + "</small></span></a></div>" +
        "<p class=\"hinweis\">Klick füllt das Sendefenster: eigene Koordinaten, Mission und nur die passenden Sammler. Andere Koordinaten (eigene Planeten / Trümmerfelder) im Feld „Koordinaten“ eingeben.</p>", "", " id=\"box-bergung\"");
    }
    // ---------- Testphase (0.14.1, Sandro t32u) ----------
    function testphaseBox() {
      var zz = z(), gg = zz.gegner || [];
      var liste = gg.length ? "<ul class=\"flug-liste\" id=\"liste-gegner\">" + gg.map(function (x) {
        var n = FL.summe(x.schiffe) + FL.summe(x.verteidigung);
        return "<li data-gegner=\"" + esc(x.id) + "\"><b>" + esc(x.name) + "</b> [" + kt(x) + "] · " + F.zahl(FL.summe(x.schiffe)) + " Schiffe · " + F.zahl(FL.summe(x.verteidigung)) + " Verteidigung" + (n ? "" : " · <i>vernichtet</i>") + "</li>"; }).join("") + "</ul>" : "";
      return h.box("Testphase", "<p class=\"hinweis\">Lädt einen Test-Seed: <b>Master-Modus an</b> (Bau/Flug sofort, Rohstoffe frei), starke Flotte + etwas Verteidigung am Hauptplaneten, " +
        "Zweitplanet „Testkolonie“ und zwei schwache Testgegner (je ≤ 5 Einheiten) im Heimatsystem. <b>Überschreibt</b> Flotte, Verteidigung und Flüge des Hauptplaneten. <span class=\"annahme-marke\">Annahme: Test-Seed</span></p>" + liste,
        "<button type=\"button\" class=\"knopf\" data-aktion=\"testphase-laden\" id=\"knopf-testphase\">Testphase laden</button>", " id=\"box-testphase\"");
    }
    function berichteBox() {
      var zz = z(), out = "", s = zz.letzterSpionagebericht, b = zz.letzterKampfbericht;
      var namen = function (o, art) { var ids = Object.keys(o || {}); return ids.length ? ids.map(function (id) { var d = art === "s" ? D.schiffNachId(id) : D.verteidigungNachId(id); return esc(d ? d.name : id) + " " + F.zahl(o[id]); }).join(", ") : "keine"; };
      if (s) out += h.box("Letzter Spionagebericht – " + esc(s.name) + " [" + kt(s.koordinaten) + "]", "<p id=\"spionage-bericht\">Schiffe (Startplätze): " + namen(s.schiffe, "s") + "<br>Verteidigung: " + namen(s.verteidigung, "v") +
        "<br>Trümmer Orbit: " + F.zahl(s.truemmer.orbit.metall) + " Metall · " + F.zahl(s.truemmer.orbit.silizium) + " Silizium" +
        (s.hinweis ? "<br><span id=\"spionage-hinweis\" class=\"spionage-hinweis\">» " + esc(s.hinweis) + "</span>" : "") + "</p>", "", " id=\"box-spionage\"");
      var titel = function (x) { return esc(x.ziel ? x.ziel.name + " [" + kt(x.ziel) + "]" : "") + (x.zeit ? " · " + F.uhrzeit(x.zeit) : ""); };
      if (b) out += h.box("Letzter Kampfbericht – " + titel(b), SS.ui.kampfbericht.html(b), "", " id=\"box-kampfbericht\"");
      var alt = (zz.kampfberichte || []).filter(function (x) { return x !== b; }); // 0.15.1: ältere Berichte (inkl. Piraten) aufklappbar
      if (alt.length) out += h.box("Ältere Kampfberichte (" + alt.length + ")", alt.map(function (x, i) {
        return "<details class=\"kb-alt\" data-kb=\"" + i + "\"><summary>" + (x.expedition ? "☠ " : "⚔ ") + titel(x) + "</summary>" + SS.ui.kampfbericht.html(x).replace(/ id=\"[^"]*\"/g, "") + "</details>"; }).join(""), "", " id=\"box-kampfberichte\"");
      return out;
    }

    // ---------- Expedition (0.15.0) ----------
    function halteFeld(zz) {
      var EX = SS.kern.expedition;
      if (!EX.freigeschaltet(zz)) return "<span class=\"hinweis\" id=\"send-halten-info\">Expedition: Astrophysik nötig</span>";
      var o = ""; for (var i = 1; i <= EX.maxHalten(zz); i++) o += "<option value=\"" + i + "\">" + i + " h (Fund " + Math.round(EX.fundChance(i) * 100) + " %)</option>";
      return "<label>Haltezeit <select id=\"send-halten\">" + o + "</select></label> <span class=\"hinweis\" id=\"send-halten-info\">Expeditionen " + EX.aktive(zz) + " / " + EX.maxParallel(zz) + " · Ziel S:SYS:" + SS.BALANCE.EXPEDITION.POSITION + "</span>";
    }
    function expeditionBox() {
      var l = z().letzteExpeditionen || []; if (!l.length) return "";
      return h.box("Letzte Expeditionen", "<ul class=\"flug-liste\" id=\"liste-expeditionen\">" + l.map(function (e) { return "<li data-art=\"" + e.art + "\">[" + kt(e.ziel) + "] " + e.halten + " h · " + esc(e.text) + "</li>"; }).join("") + "</ul>", "", " id=\"box-expeditionen\"");
    }

    // 0.18.0 (Sandro t49u): Schnellwahl eigene Planeten (OGame-Shortcuts)
    function schnellwahl(zz, pp) {
      var andere = FL.eigenePlaneten(zz).filter(function (e) { return e.id !== pp.id; });
      if (!andere.length) return "";
      return "<div class=\"send-planeten\" id=\"send-planeten\"><span class=\"hinweis\">Eigene Planeten:</span>" + andere.map(function (e) {
        return "<button type=\"button\" class=\"knopf klein\" data-aktion=\"send-planet\" data-koord=\"" + kt(e) + "\">🪐 " + esc(e.name) + " [" + kt(e) + "]</button>"; }).join("") + "</div>";
    }
    // ---------- Sendefenster ----------
    function sendefenster() {
      var zz = z(), pp = p(), frei = FL.frei(zz, pp);
      var ids = D.schiffIds.filter(function (id) { return (pp.schiffe[id] || 0) > 0 && FL.fliegt(D.schiffNachId(id)); });
      var zeilen = ids.map(function (id) {
        var s = D.schiffNachId(id), n = pp.schiffe[id];
        return "<tr data-schiff=\"" + id + "\"><td><img src=\"" + D.schiffBild(s, n) + "\" alt=\"\" width=\"32\" height=\"32\"> " + esc(s.name) + "</td><td class=\"zahl\">" + F.zahl(n) + "</td>" +
          "<td><input type=\"number\" min=\"0\" max=\"" + n + "\" value=\"0\" inputmode=\"numeric\" data-send-menge=\"" + id + "\" aria-label=\"Anzahl " + esc(s.name) + "\"> " +
          "<button type=\"button\" class=\"knopf klein\" data-aktion=\"send-max\" data-id=\"" + id + "\">max</button></td></tr>";
      }).join("");
      var ladung = "<details class=\"send-ladung\" id=\"send-ladung\"><summary>Ladung (Transport / Stationieren / Kolonisieren)</summary><div class=\"send-ziel\">" + D.rohstoffe.filter(function (r) { return r.id !== "strom" && (zz.rohstoffe[r.id] || 0) > 0; }).map(function (r) {
        return "<label>" + esc(r.name) + " <input type=\"number\" min=\"0\" value=\"0\" inputmode=\"numeric\" size=\"8\" data-send-ladung=\"" + r.id + "\"></label>"; }).join("") + "</div></details>";
      var opts = "<option value=\"\">Koordinaten eingeben …</option><optgroup label=\"Eigene Planeten\">" + FL.eigenePlaneten(zz).map(function (e) {
        return "<option value=\"" + kt(e) + "\">" + esc(e.name) + " [" + kt(e) + "]</option>"; }).join("") + "</optgroup>" +
        ((zz.gegner || []).length ? "<optgroup label=\"Gegner\">" + zz.gegner.map(function (x) { return "<option value=\"" + kt(x) + "\">⚔ " + esc(x.name) + " [" + kt(x) + "]</option>"; }).join("") + "</optgroup>" : "") +
        (zz.favoriten.length ? "<optgroup label=\"Favoriten\">" + zz.favoriten.map(function (f) { return "<option value=\"" + kt(f) + "\">★ " + esc(f.name) + " [" + kt(f) + "]</option>"; }).join("") + "</optgroup>" : "");
      var mis = FL.MISSIONEN.map(function (m) { return "<option value=\"" + m.id + "\">" + m.name + "</option>"; }).join("");
      var inhalt = (ids.length ? "<table class=\"tabelle send-tabelle\"><thead><tr><th>Schiff</th><th>am Planeten</th><th>senden</th></tr></thead><tbody>" + zeilen + "</tbody></table>" +
        "<p><button type=\"button\" class=\"knopf\" data-aktion=\"send-alle\">Alle (bis Kapazität)</button> <button type=\"button\" class=\"knopf\" data-aktion=\"send-keine\">Keine</button> " +
        "<span id=\"send-summe\" class=\"send-summe\">0 / " + F.zahl(frei) + " Startplätze</span></p>" :
        "<p class=\"forschung-fehlt\">Keine flugfähigen Schiffe am Planeten.</p>") +
        schnellwahl(zz, pp) + "<div class=\"send-ziel\"><label>Ziel <select id=\"send-ziel\">" + opts + "</select></label>" +
        "<label>Koordinaten <input id=\"send-koord\" type=\"text\" placeholder=\"S:SYS:P\" autocomplete=\"off\" size=\"10\"></label>" +
        "<button type=\"button\" class=\"knopf\" data-aktion=\"send-favorit\">☆ Als Favorit</button></div>" +
        "<div class=\"send-ziel\"><label>Mission <select id=\"send-mission\">" + mis + "</select></label>" + halteFeld(zz) + "</div>" + ladung +
        "<dl class=\"werte\" id=\"send-vorschau\"></dl><p id=\"send-grund\" class=\"grund\"></p>" +
        "<p><button type=\"button\" class=\"knopf primaer\" data-aktion=\"send-los\" id=\"knopf-lossenden\" disabled>Lossenden</button> <button type=\"button\" class=\"knopf\" data-aktion=\"send-keine\" id=\"knopf-send-zu\">Zurücksetzen</button></p>";
      return "<div class=\"send-fenster\" id=\"senden\">" + h.box("Flotte senden", inhalt, "", " id=\"send-box\"") + "</div>";
    }
    /** Formular lesen (zur Laufzeit, im Browser). */
    function formular(doc) {
      var schiffe = {};
      Array.prototype.forEach.call(doc.querySelectorAll("input[data-send-menge]"), function (i) { var n = Math.floor(Number(i.value) || 0); if (n > 0) schiffe[i.getAttribute("data-send-menge")] = n; });
      var ladung = {};
      Array.prototype.forEach.call(doc.querySelectorAll("input[data-send-ladung]"), function (i) { var n = Math.floor(Number(i.value) || 0); if (n > 0) ladung[i.getAttribute("data-send-ladung")] = n; });
      var k = doc.getElementById("send-koord"), m = doc.getElementById("send-mission"), hz = doc.getElementById("send-halten"), kv = k ? k.value : "";
      return { schiffe: schiffe, ladung: ladung, ziel: W().leseKoordinaten(kv) || SS.kern.expedition.leseZiel(kv), mission: m ? m.value : "", koordText: kv, halten: hz ? Number(hz.value) : 1 };
    }
    /** Vorschau + Knopfzustand aktualisieren. */
    function aktualisiereSenden(doc) {
      if (!doc.getElementById("send-box")) return;
      var zz = z(), pp = p(), a = formular(doc), r = FL.pruefe(zz, pp, a);
      var s = doc.getElementById("send-summe");
      if (s) { s.textContent = F.zahl(r.anzahl) + " / " + F.zahl(r.frei) + " Startplätze"; s.classList.toggle("negativ", r.anzahl > r.frei); }
      var v = doc.getElementById("send-vorschau");
      v.innerHTML = r.dauer ? "<dt>Entfernung</dt><dd>" + F.zahl(r.entfernung) + "</dd><dt>Tempo (langsamstes Schiff)</dt><dd>" + F.zahl(r.tempo) + "</dd>" +
        "<dt>Flugzeit (einfach)</dt><dd id=\"send-dauer\">" + F.dauer(r.dauer) + "</dd><dt>Ankunft</dt><dd>" + F.uhrzeit(Date.now() + r.dauer) + "</dd>" +
        "<dt>Ladekapazität</dt><dd id=\"send-kapazitaet\">" + F.zahl(r.ladungSumme || 0) + " / " + F.zahl(r.kapazitaet || 0) + "</dd>" +
        "<dt>Rohöl" + (a.mission === "stationieren" ? " (nur Hinflug)" : " (Hin + Rück)") + "</dt><dd id=\"send-rohoel\">" + F.zahl(r.rohoel) + "</dd>" : "";
      doc.getElementById("send-grund").textContent = r.ok ? "" : r.grund;
      doc.getElementById("knopf-lossenden").disabled = !r.ok;
      return r;
    }

    // ---------- Seitenleiste ----------
    function leiste() {
      var zz = z(), t = Date.now(), fl = zz.flotten || [];
      return "<div class=\"leiste-kopf\">Flotten unterwegs <span class=\"leiste-zahl\" id=\"leiste-zahl\">" + fl.length + "</span></div>" +
        (fl.length ? "<ul class=\"flug-liste\">" + fl.map(function (f) { return flugZeile(f, t, true); }).join("") + "</ul>" : "<p class=\"hinweis\" id=\"leiste-leer\">Keine Flotte unterwegs.</p>");
    }
    function live(el, art, id, t) {
      var f = (z().flotten || []).filter(function (x) { return x.id === id; })[0];
      if (!f) return null;
      var st = FL.status(f, t);
      if (art === "flug-rest") return uhr(st.rest);
      if (art === "flug-proz") { var w = st.prozent.toFixed(1) + "%"; if (el.style.width !== w) el.style.width = w; return null; }
      return null;
    }
    return { seite: seite, leiste: leiste, live: live, formular: formular, aktualisiereSenden: aktualisiereSenden };
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
