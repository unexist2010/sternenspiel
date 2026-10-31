/*
 * Sternenspiel – Seite „Werft“ (Kapitel 4). Reine HTML-Erzeugung; app.js übergibt die gemeinsamen Helfer (h).
 * Beim Laden DOM-frei (wird auch in den Node-Tests geladen).
 */
(function (g) {
  "use strict";
  var SS = (g.SS = g.SS || {});
  SS.ui = SS.ui || {};

  SS.ui.werft = function (h) {
    var D = SS.DATEN, WF = SS.kern.werft, F = SS.format, esc = h.esc;
    var ANTRIEB = { verbrennung: "Verbrennung", impuls: "Impuls", hyperraumantrieb: "Hyperraum" };
    function z() { return h.zustand(); }
    function p() { return h.hp(); }
    function zahl(n) { return F.zahl(Math.round(n)); }

    function marken(s) {
      var hu = D.huellentypNachId(s.huelle);
      var w = Object.keys(s.waffen).map(function (id) {
        var wt = D.waffentypNachId(id);
        return "<span class=\"waffe-marke\" style=\"border-color:" + wt.farbe + ";color:" + wt.farbe + "\">" + wt.name + (s.waffen[id] < 1 ? " " + Math.round(s.waffen[id] * 100) + " %" : "") + "</span>";
      }).join("");
      return "<p class=\"schiff-marken\"><span class=\"huelle-marke " + s.huelle + "\">" + hu.name + "</span>" + (w || "<span class=\"waffe-marke leer\">unbewaffnet</span>") +
        "<span class=\"antrieb-marke\">" + (s.antrieb ? ANTRIEB[s.antrieb] : "kein Antrieb") + "</span>" + (s.stationaer ? "<span class=\"antrieb-marke\">stationär</span>" : "") + "</p>";
    }
    function vorListe(s) {
      return "<p class=\"vor-liste\"><span class=\"vor-titel\">Voraussetzungen:</span> " + WF.voraussetzungen(z(), p(), s).map(function (x) {
        return "<span class=\"vor " + (x.ok ? "ok" : "fehlt") + "\" title=\"aktuell Stufe " + x.ist + "\">" + (x.ok ? "✔ " : "✘ ") + esc(x.name) + " " + x.stufe + "</span>";
      }).join(" ") + "</p>";
    }
    function wertMitBonus(v, grund) {
      return zahl(v) + (Math.abs(v - grund) > 1e-6 ? " <small class=\"plus\">(" + zahl(grund) + " +" + Math.round((v / Math.max(1e-9, grund) - 1) * 100) + " %)</small>" : "");
    }

    function kachel(s) {
      var zz = z(), pp = p(), master = WF.istMaster(zz), n = WF.anzahl(pp, s.id), w = WF.werte(zz, s), vorOk = WF.voraussetzungenOk(zz, pp, s);
      var laeuft = (pp.werftauftraege || []).some(function (a) { return a.id === s.id; });
      return "<article class=\"schiff-zeile schiff-kachel" + (laeuft ? " im-bau" : "") + (!vorOk ? " gesperrt" : "") + "\" data-schiff=\"" + s.id + "\">" +
        "<div class=\"schiff-bildspalte\"><img class=\"anlage-bild schiff-bild\" src=\"" + D.schiffBild(s, n) + "\" alt=\"" + esc(s.name) + "\" width=\"200\" height=\"200\"></div><div class=\"schiff-inhalt\"><div class=\"anlage-kopf schiff-kopf\"><div class=\"anlage-titel\"><h3>" + s.name + " " + h.infoKnopf("schiff", s.id, s.name) + "</h3>" +
        "<span class=\"stufe\">Anzahl <b data-schiff-anzahl=\"" + s.id + "\">" + F.zahl(n) + "</b></span>" +
        (!vorOk ? "<span class=\"sperr-marke\">🔒 Voraussetzung fehlt" + (master ? " (Master)" : "") + "</span>" : "") + "</div></div>" +
        marken(s) + "<p class=\"beschreibung\">" + esc(s.beschreibung) + "</p>" + vorListe(s) +
        "<dl class=\"anlage-werte\"><dt>Kosten je Stück</dt><dd>" + h.kostenHtml(s.kosten) + (master ? " <span class=\"master-marke\">kostenlos</span>" : "") + "</dd>" +
        "<dt>Bauzeit je Stück</dt><dd>" + (master ? "sofort <span class=\"master-marke\">Master</span>" : WF.werftStufe(pp) > 0 ? F.dauer(WF.stueckMs(zz, pp, s)) : "–") + "</dd>" +
        "<dt>Angriff / Energiehülle</dt><dd>" + wertMitBonus(w.angriff, w.grund.angriff) + " / " + wertMitBonus(w.schild, w.grund.schild) + "</dd>" +
        "<dt>Metallhülle</dt><dd>" + wertMitBonus(w.huelle, w.grund.huelle) + "</dd>" +
        (s.antrieb ? "<dt>Tempo</dt><dd>" + wertMitBonus(w.tempo, w.grund.tempo) + "</dd><dt>Ladung · Rohöl</dt><dd>" + wertMitBonus(w.ladung, w.grund.ladung) + " · " + zahl(w.verbrauch) + "</dd>" : "") +
        "</dl>" +
        "<div class=\"bau-aktion schiff-bestellung\"><label class=\"menge\"><span>Menge</span><input type=\"number\" min=\"1\" step=\"1\" value=\"1\" inputmode=\"numeric\" data-menge=\"" + s.id + "\" aria-label=\"Menge " + esc(s.name) + "\"></label>" +
        "<button class=\"knopf klein\" type=\"button\" data-aktion=\"schiff-max\" data-id=\"" + s.id + "\">max</button>" +
        "<button class=\"knopf primaer\" type=\"button\" data-aktion=\"schiff-bauen\" data-id=\"" + s.id + "\">" + (master ? "Sofort bauen" : "Bauen") + "</button><span class=\"grund hinweis\"></span></div>" +
        "</div></article>";
    }

    function auftragZeile(a, i) {
      return "<div class=\"bau-laufend werft-auftrag\" data-werft-index=\"" + i + "\"><div class=\"bau-zeile\"><b>" + F.zahl(a.menge) + "× " + esc(a.name) + "</b><span data-live=\"werft-rest:" + i + "\"></span></div>" +
        "<div class=\"balken\"><div class=\"balken-fuellung werft\" data-live=\"werft-balken:" + i + "\"></div></div>" +
        "<div class=\"knopf-reihe\"><span class=\"hinweis\" data-live=\"werft-stand:" + i + "\"></span><button class=\"knopf klein gefahr\" type=\"button\" data-aktion=\"werft-abbrechen\" data-index=\"" + i + "\">Abbrechen</button></div></div>";
    }
    /** Box „Werft-Aufträge“ (Werft-Seite und Übersicht). */
    function auftragBox(aufSeite) {
      var pp = p(), q = pp.werftauftraege || [], ohne = !(WF.werftStufe(pp) > 0);
      var inhalt = q.length ? q.map(auftragZeile).join("") :
        "<p class=\"hinweis\">" + (ohne ? "Noch keine Werft – zuerst unter Anlagen bauen." : "Keine Schiffe im Bau. Die Werft-Warteschlange läuft unabhängig von Bau und Forschung.") + "</p>";
      if (!aufSeite) inhalt += "<a class=\"knopf klein\" href=\"" + (ohne ? "#anlagen" : "#werft") + "\">" + (ohne ? "Werft bauen" : "Zur Werft") + "</a>";
      return h.box("Werft-Aufträge", inhalt, "<span class=\"box-zahl\">" + q.length + "</span>", " id=\"werft-box\"");
    }

    function seite() {
      var zz = z(), pp = p(), st = WF.werftStufe(pp), master = WF.istMaster(zz);
      if (!(st > 0)) {
        return h.box("Werft", "<p class=\"forschung-fehlt\" id=\"werft-hinweis\"><b>Werft bauen</b> – Schiffe und Solarsatelliten werden in der Werft gebaut (Stufe 1 nötig, auch im Master-Modus).</p>" +
          "<a class=\"knopf primaer\" href=\"#anlagen\" id=\"knopf-werft-bauen\">Werft bauen</a>", "", " id=\"werft-info\"");
      }
      var bestand = D.schiffe.reduce(function (s, x) { return s + (x.id === "solarsatellit" ? 0 : WF.anzahl(pp, x.id)); }, 0);
      var info = h.box("Werft", "<dl class=\"werte\"><dt>Stufe</dt><dd id=\"werft-stufe\">" + st + "</dd><dt>Bauzeit</dt><dd>÷ " + (1 + st) + " (1 + Stufe) × Roboter</dd>" +
        "<dt>Schiffe am Planeten</dt><dd id=\"werft-bestand\">" + F.zahl(bestand) + "</dd><dt>Solarsatelliten</dt><dd>" + F.zahl(pp.solarsatelliten || 0) + "</dd>" +
        "<dt>Startkapazität</dt><dd>" + F.zahl(SS.kern.bau.kapazitaet(pp)) + "</dd></dl>" +
        "<p class=\"hinweis\">Die Startplatz-Kapazität begrenzt später nur, wie viele Schiffe gleichzeitig starten – gebaut werden darf beliebig viel; der Rest steht im Hangar. " +
        "Während Schiffe gebaut werden, kann die Werft nicht ausgebaut werden.</p>" +
        (master ? "<p class=\"hinweis\">Master: sofort und kostenlos, Voraussetzungen ignoriert (Werft bleibt Pflicht).</p>" : ""), "", " id=\"werft-info\"");
      var versteckt = 0;
      var gruppen = D.schiffGruppen.map(function (gr) {
        var liste = D.schiffe.filter(function (s) { return s.gruppe === gr.id; }), sicht = liste.filter(function (s) { return WF.sichtbar(zz, s); });
        versteckt += liste.length - sicht.length;
        return h.box(gr.name, "<div class=\"schiff-liste\">" + sicht.map(kachel).join("") + "</div>", "<span class=\"box-zahl\">" + sicht.length + "</span>", " data-gruppe=\"" + gr.id + "\"");
      }).join("");
      var hinweis = versteckt ? "<p class=\"hinweis\" id=\"werft-ausgeblendet\">" + versteckt + " Schiff ist noch ausgeblendet – erscheint mit der Antimaterie-Freischaltung. <span class=\"annahme-marke\">Annahme</span></p>" : "";
      return "<div class=\"zwei-spalten\">" + auftragBox(true) + info + "</div>" + hinweis + gruppen;
    }

    function info(s) {
      var zz = z(), pp = p(), w = WF.werte(zz, s), hu = D.huellentypNachId(s.huelle);
      var zeile = function (t, grund, v, b) { return "<tr><td>" + t + "</td><td class=\"z\">" + zahl(grund) + "</td><td class=\"z\">" + zahl(v) + "</td><td class=\"z\">" + (b > 1e-9 ? "<span class=\"plus\">+" + F.rate(Math.round(b * 10) / 10) + " %</span>" : "–") + "</td></tr>"; };
      var zeilen = zeile("Angriff", w.grund.angriff, w.angriff, w.bonus.waffen) + zeile("Energiehülle", w.grund.schild, w.schild, w.bonus.schild) + zeile("Metallhülle", w.grund.huelle, w.huelle, w.bonus.panzerung) +
        (s.antrieb ? zeile("Tempo", w.grund.tempo, w.tempo, w.bonus.antrieb) + zeile("Ladung", w.grund.ladung, w.ladung, w.bonus.ladung) + "<tr><td>Rohöl je Flug</td><td class=\"z\">" + zahl(w.verbrauch) + "</td><td class=\"z\">" + zahl(w.verbrauch) + "</td><td class=\"z\">–</td></tr>" : "");
      var name = function (id) { var x = D.schiffNachId(id) || (D.verteidigungNachId && D.verteidigungNachId(id)); return x ? x.name : id; };
      var waffen = Object.keys(s.waffen).map(function (id) { return D.waffentypNachId(id).name + " " + Math.round(s.waffen[id] * 100) + " %"; }).join(", ") || "keine";
      var vor = WF.voraussetzungen(zz, pp, s).map(function (x) { return (x.ok ? "✔ " : "✘ ") + esc(x.name) + " " + x.stufe; }).join(", ");
      return { titel: s.name + " · Anzahl " + F.zahl(WF.anzahl(pp, s.id)), text: s.info,
        extra: "<p class=\"hinweis\">Hülle: <b>" + hu.name + "</b> (Struktur " + zahl(w.struktur) + ") · Waffen: <b>" + waffen + "</b> · Antrieb: <b>" + (s.antrieb ? ANTRIEB[s.antrieb] : "keiner") + "</b></p>" +
          "<p class=\"hinweis\">Voraussetzungen: " + vor + "</p>",
        kopf: "<tr><th>Wert</th><th class=\"z\">Grund</th><th class=\"z\">mit Forschung</th><th class=\"z\">Bonus</th></tr>", zeilen: zeilen,
        hinweis: "Werte ohne Kampf – Kampf, Flug und Verbrauch folgen in späteren Kapiteln. Alle Schiffswerte sind Vorschläge (Annahme).", bild: D.schiffBild(s, WF.anzahl(pp, s.id)) };
    }

    /** Live-Werte der Werft-Aufträge. → Text, oder null wenn erledigt (Balken) bzw. unbekannt (undefined) */
    function live(el, art, i, t) {
      var a = (p().werftauftraege || [])[Number(i)];
      if (art === "werft-balken") { el.style.width = a ? Math.min(100, Math.max(0, (t - a.start) / Math.max(1, a.ende - a.start) * 100)).toFixed(1) + "%" : "0%"; return null; }
      if (art === "werft-rest") return a ? (t < a.start ? "wartet · " : "noch ") + F.dauer(Math.max(0, a.ende - t)) : "";
      if (art === "werft-stand") return a ? F.zahl(Math.min(a.menge, Math.max(a.fertig, Math.floor((t - a.start) / a.stueckMs)))) + " / " + F.zahl(a.menge) + " fertig · je " + F.dauer(a.stueckMs) + " · Ende " + F.uhrzeit(a.ende) : "";
      return undefined;
    }
    return { seite: seite, auftragBox: auftragBox, info: info, live: live };
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
