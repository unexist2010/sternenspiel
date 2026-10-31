/*
 * Sternenspiel – Seite „Flotte“ (Kapitel 6) + rechte Seitenleiste „Flotten unterwegs“.
 * Flottenfenster (Startbahnen/Hangar, Preset-Dropdown), Sendefenster (#flotte/senden). Beim Laden DOM-frei (Node-Tests).
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
      return "<li class=\"flug\" data-flotte=\"" + f.id + "\"><div class=\"flug-kopf\"><b>" + esc(mName(f.mission)) + "</b> <span class=\"flug-phase\">" + (f.phase === "hin" ? "→ " : "← ") + "</span>" +
        "<span class=\"flug-ziel\">" + kt(f.ziel) + (f.zielName ? " " + esc(f.zielName) : "") + "</span></div>" +
        "<div class=\"flug-info\">" + F.zahl(f.anzahl) + " Schiffe · " + (f.phase === "hin" ? "Hinflug" : "Rückflug") + " · <span data-live=\"flug-rest:" + f.id + "\">" + uhr(st.rest) + "</span> (" + Math.floor(st.prozent) + "&nbsp;%)</div>" +
        "<div class=\"flug-balken\"><span data-live=\"flug-proz:" + f.id + "\" style=\"width:" + st.prozent.toFixed(1) + "%\"></span></div>" +
        (kurz ? "" : (f.bericht ? "<div class=\"hinweis\">" + esc(f.bericht) + "</div>" : "")) + "</li>";
    }

    // ---------- Flottenfenster ----------
    function seite() {
      if ((h.teile() || [])[0] === "senden") return sendefenster();
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
      var startb = h.box("Startbahnen", kopf + presetSel + "<p class=\"hinweis\">" + esc(pr.text) + " (Tausch mit dem Hangar geschieht automatisch).</p>" + verteid +
        schiffListe(sb.startplatz, "Keine Schiffe auf den Startbahnen.", " id=\"liste-startbahn\""),
        "<a class=\"knopf primaer\" href=\"#flotte/senden\" id=\"knopf-senden\"" + (sb.frei > 0 && flyHangar ? "" : " aria-disabled=\"true\"") + ">Flotte senden</a>", " id=\"box-startbahnen\"");
      var hangar = h.box("Hangar", "<p class=\"hinweis\">Alle übrigen Schiffe – geschützt bei Angriffen.</p>" + schiffListe(sb.hangar, "Hangar leer.", " id=\"liste-hangar\"") +
        (pp.solarsatelliten ? "<p class=\"hinweis\">Solarsatelliten im Orbit: " + F.zahl(pp.solarsatelliten) + " (fliegen nicht).</p>" : ""), "", " id=\"box-hangar\"");
      var unterwegs = h.box("Unterwegs von diesem Planeten", eigene.length ? "<ul class=\"flug-liste\" id=\"liste-unterwegs\">" + eigene.map(function (f) { return flugZeile(f, t, false); }).join("") + "</ul>" :
        "<p class=\"hinweis\" id=\"liste-unterwegs\">Keine Flotte unterwegs – alle " + F.zahl(sb.kapazitaet) + " Startplätze stehen zur Verfügung.</p>", "", " id=\"box-unterwegs\"");
      return "<div class=\"zwei-spalten\">" + startb + hangar + "</div>" + unterwegs;
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
      var opts = "<option value=\"\">Koordinaten eingeben …</option><optgroup label=\"Eigene Planeten\">" + FL.eigenePlaneten(zz).map(function (e) {
        return "<option value=\"" + kt(e) + "\">" + esc(e.name) + " [" + kt(e) + "]</option>"; }).join("") + "</optgroup>" +
        (zz.favoriten.length ? "<optgroup label=\"Favoriten\">" + zz.favoriten.map(function (f) { return "<option value=\"" + kt(f) + "\">★ " + esc(f.name) + " [" + kt(f) + "]</option>"; }).join("") + "</optgroup>" : "");
      var mis = FL.MISSIONEN.map(function (m) { return "<option value=\"" + m.id + "\">" + m.name + "</option>"; }).join("");
      var inhalt = (ids.length ? "<table class=\"tabelle send-tabelle\"><thead><tr><th>Schiff</th><th>am Planeten</th><th>senden</th></tr></thead><tbody>" + zeilen + "</tbody></table>" +
        "<p><button type=\"button\" class=\"knopf\" data-aktion=\"send-alle\">Alle (bis Kapazität)</button> <button type=\"button\" class=\"knopf\" data-aktion=\"send-keine\">Keine</button> " +
        "<span id=\"send-summe\" class=\"send-summe\">0 / " + F.zahl(frei) + " Startplätze</span></p>" :
        "<p class=\"forschung-fehlt\">Keine flugfähigen Schiffe am Planeten.</p>") +
        "<div class=\"send-ziel\"><label>Ziel <select id=\"send-ziel\">" + opts + "</select></label>" +
        "<label>Koordinaten <input id=\"send-koord\" type=\"text\" placeholder=\"S:SYS:P\" autocomplete=\"off\" size=\"10\"></label>" +
        "<button type=\"button\" class=\"knopf\" data-aktion=\"send-favorit\">☆ Als Favorit</button></div>" +
        "<div class=\"send-ziel\"><label>Mission <select id=\"send-mission\">" + mis + "</select></label></div>" +
        "<dl class=\"werte\" id=\"send-vorschau\"></dl><p id=\"send-grund\" class=\"grund\"></p>" +
        "<p><button type=\"button\" class=\"knopf primaer\" data-aktion=\"send-los\" id=\"knopf-lossenden\" disabled>Lossenden</button> <a class=\"knopf\" href=\"#flotte\" id=\"knopf-send-zu\">Schließen</a></p>";
      return "<div class=\"send-fenster\">" + h.box("Flotte senden – Auswahl", inhalt, "<a class=\"knopf\" href=\"#flotte\" aria-label=\"Schließen\">✕</a>", " id=\"send-box\"") + "</div>";
    }
    /** Formular lesen (zur Laufzeit, im Browser). */
    function formular(doc) {
      var schiffe = {};
      Array.prototype.forEach.call(doc.querySelectorAll("input[data-send-menge]"), function (i) { var n = Math.floor(Number(i.value) || 0); if (n > 0) schiffe[i.getAttribute("data-send-menge")] = n; });
      var k = doc.getElementById("send-koord"), m = doc.getElementById("send-mission");
      return { schiffe: schiffe, ziel: W().leseKoordinaten(k ? k.value : ""), mission: m ? m.value : "", koordText: k ? k.value : "" };
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
        "<dt>Rohöl" + (a.mission === "stationieren" ? "" : " (Hin + Rück)") + "</dt><dd id=\"send-rohoel\">" + F.zahl(r.rohoel) + "</dd>" : "";
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
