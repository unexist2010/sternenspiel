/*
 * Sternenspiel – Kampfbericht (Kapitel Kampfsystem / Kampfbericht, 0.14.0). Reine HTML-Erzeugung, DOM-frei (Node-Tests).
 * FEST (Sandro t31u):
 *  - Ganz oben: Sieger + kurze Zusammenfassung der Gesamtverluste beider Seiten.
 *  - Darunter Phase 1 (Orbit) und Phase 2 (Boden) getrennt.
 *  - Ohne Details: pro Runde je Schiffs-/Anlagetyp Startanzahl (normal) + Verluste der Runde farbig
 *    (grün = eigener Verlust = Verteidiger aus Spielersicht, rot = gegnerischer Verlust = Angreifer).
 *  - Pro Phase ein Dropdown (details/summary): Schadensverteilung, Hüllenstände, Waffeneinsatz.
 *  - Am Ende: Trümmerfelder – Schiffe → Orbit (Wracksammler), Verteidigung → Boden (Bodensammler); Höhe nach Baukosten.
 */
(function (g) {
  "use strict";
  var SS = (g.SS = g.SS || {});
  SS.ui = SS.ui || {};

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]; }); }
  function zahl(n) { return SS.format && SS.format.zahl ? SS.format.zahl(Math.round(n)) : String(Math.round(n)); }
  function summe(l, f) { return l.reduce(function (s, x) { return s + (x[f] || 0); }, 0); }
  function waffenName(id) { var w = SS.DATEN && SS.DATEN.waffentypNachId(id); return w ? w.name : id; }

  /** Verlust-Zelle: seite "eigen" (Verteidiger, grün) oder "gegner" (Angreifer, rot). */
  function verlust(n, seite) {
    return n > 0 ? "<span class=\"kb-verlust kb-" + seite + "\" data-verlust=\"" + seite + "\">−" + zahl(n) + "</span>" : "<span class=\"kb-null\">−0</span>";
  }

  /** Rundentabelle einer Seite: Zeilen = Typen, Spalten = Runden (Start + Verlust). */
  function rundenTabelle(titel, runden, seite, key) {
    var typen = [];
    runden.forEach(function (r) { r.gruppen[key].forEach(function (x) { if (!typen.some(function (t) { return t.id === x.id && t.art === x.art; })) typen.push({ id: x.id, art: x.art, name: x.name }); }); });
    if (!typen.length) return "<p class=\"hinweis\">" + titel + ": keine Einheiten</p>";
    var kopf = "<tr><th>" + titel + "</th>" + runden.map(function (r) { return "<th class=\"z\">Runde " + r.runde + "</th>"; }).join("") + "</tr>";
    var zeilen = typen.map(function (t) {
      return "<tr class=\"kb-runde-zeile\"><td>" + esc(t.name) + "</td>" + runden.map(function (r) {
        var x = r.gruppen[key].filter(function (y) { return y.id === t.id && y.art === t.art; })[0];
        return "<td class=\"z\">" + (x ? "<span class=\"kb-start\">" + zahl(x.start) + "</span> " + verlust(x.verloren, seite) : "<span class=\"kb-null\">–</span>") + "</td>";
      }).join("") + "</tr>";
    }).join("");
    return "<div class=\"tabelle-wrap\"><table class=\"info-tabelle kb-runden\" data-seite=\"" + key + "\"><thead>" + kopf + "</thead><tbody>" + zeilen + "</tbody></table></div>";
  }

  function details(runden) {
    if (!runden.length) return "";
    var huelle = function (x) {
      return "<tr><td>" + esc(x.name) + "</td><td class=\"z\">" + zahl(x.energie) + " / " + zahl(x.energieMax) + (x.energieGebrochen ? " <small class=\"kb-gebrochen\">gebrochen</small>" : "") +
        "</td><td class=\"z\">" + zahl(x.metall) + " / " + zahl(x.metallMax) + "</td></tr>";
    };
    var waffen = function (l) { return l.length ? l.map(function (w) { return esc(waffenName(w.id)) + " " + zahl(w.schuesse) + " Schuss (E " + zahl(w.e) + " · M " + zahl(w.m) + ")"; }).join("; ") : "–"; };
    var inhalt = runden.map(function (r) {
      return "<div class=\"kb-detail-runde\"><h5>Runde " + r.runde + "</h5>" +
        "<p class=\"hinweis\">Schaden Angreifer → Verteidiger: Energie " + zahl(r.schaden.angreifer.e) + " · Metall " + zahl(r.schaden.angreifer.m) +
        "<br>Schaden Verteidiger → Angreifer: Energie " + zahl(r.schaden.verteidiger.e) + " · Metall " + zahl(r.schaden.verteidiger.m) +
        (r.schildAbsorb > 0 ? "<br>Planetenschild fängt ab: " + zahl(r.schildAbsorb) + " (Rest " + zahl(r.schildRest) + ")" : "") + "</p>" +
        "<p class=\"hinweis\">Waffeneinsatz Angreifer: " + waffen(r.waffen.angreifer) + "<br>Waffeneinsatz Verteidiger: " + waffen(r.waffen.verteidiger) + "</p>" +
        "<div class=\"tabelle-wrap\"><table class=\"info-tabelle kb-huellen\"><thead><tr><th>Hüllen nach Runde " + r.runde + "</th><th class=\"z\">Energie</th><th class=\"z\">Metall</th></tr></thead><tbody>" +
        "<tr class=\"kb-seite\"><td colspan=\"3\">Angreifer</td></tr>" + r.gruppen.angreifer.map(huelle).join("") +
        "<tr class=\"kb-seite\"><td colspan=\"3\">Verteidiger</td></tr>" + r.gruppen.verteidiger.map(huelle).join("") + "</tbody></table></div></div>";
    }).join("");
    return "<details class=\"kb-details\"><summary>Details: Schadensverteilung, Hüllenstände, Waffeneinsatz</summary>" + inhalt + "</details>";
  }

  function phaseHtml(nr, ph, titel, b) {
    var kopf = "<h4>Phase " + nr + " – " + titel + "</h4>";
    if (!ph.stattgefunden) return "<section class=\"kb-phase\" data-phase=\"" + ph.id + "\">" + kopf + "<p class=\"hinweis\">Findet nicht statt – kein Angreifer hat Phase 1 überstanden.</p></section>";
    if (!ph.runden.length) return "<section class=\"kb-phase\" data-phase=\"" + ph.id + "\">" + kopf + "<p class=\"hinweis\">Kein Kampf – keine Gegner in dieser Phase.</p></section>";
    var ende = ph.runden[ph.runden.length - 1], grund = !ende.angreifer ? "Angreifer vernichtet" : !ende.verteidiger ? "Verteidigung dieser Phase vernichtet" : "Rundenlimit erreicht";
    return "<section class=\"kb-phase\" data-phase=\"" + ph.id + "\">" + kopf +
      (ph.nurOrbital ? "<p class=\"hinweis\">Keine Verteidigungsflotte (alle Startplätze durch Flotten unterwegs belegt) – nur Orbitalverteidigung.</p>" : "") +
      rundenTabelle("Angreifer", ph.runden, "gegner", "angreifer") + rundenTabelle("Verteidiger", ph.runden, "eigen", "verteidiger") +
      "<p class=\"hinweis\">" + ph.runden.length + " Runden · Ende: " + grund + (b.schild && ph.id === "boden" ? " · Planetenschild " + (b.schild.gefallen ? "gefallen (nach dem Angriff wieder aktiv)" : "hält (" + zahl(b.schild.rest) + " / " + zahl(b.schild.start) + ")") : "") + "</p>" +
      details(ph.runden) + "</section>";
  }

  function berichtHtml(b) {
    var sieg = b.expedition ? { angreifer: "Expedition siegt – Piraten abgewehrt", verteidiger: "Piraten gewinnen – Expedition zieht sich zurück", unentschieden: "Unentschieden – beide Seiten aufgerieben" }[b.sieger]
      : { angreifer: "Angreifer gewinnt", verteidiger: "Verteidigung hält – Verteidiger gewinnt", unentschieden: "Unentschieden" }[b.sieger];
    if (b.rettung) sieg = "Niederlage – Expeditionsflotte vernichtet, 1 " + esc((SS.DATEN.schiffNachId(b.rettung) || { name: b.rettung }).name) + " entkommt";
    var vt = b.orbit.concat(b.boden);
    var rs = function (r) { return zahl(r.metall) + " Metall · " + zahl(r.silizium) + " Silizium"; };
    var aV = summe(b.angreifer, "verloren"), aS = summe(b.angreifer, "vorher"), vV = summe(vt, "verloren"), vS = summe(vt, "vorher"), rep = summe(vt, "repariert");
    var hangar = Object.keys(b.verteilung.hangar).reduce(function (s, k) { return s + b.verteilung.hangar[k]; }, 0);
    return "<div class=\"kampf-bericht\" id=\"kampf-bericht\">" +
      "<div class=\"kb-kopf kb-sieg-" + b.sieger + "\"><b data-sieger=\"" + b.sieger + "\">" + sieg + "</b>" +
      "<p class=\"kb-summe\">Verluste Angreifer: " + verlust(aV, "gegner") + " von " + zahl(aS) + " · Verluste Verteidiger: " + verlust(vV, "eigen") + " von " + zahl(vS) +
      (rep ? " (davon " + zahl(rep) + " Anlagen repariert)" : "") + "</p>" +
      (b.rettung ? "<p class=\"hinweis kb-rettung\" id=\"kb-rettung\">Restliche Flotte vernichtet – ein Schiff entkommt (Expeditionen enden nie im Totalverlust).</p>" : "") + "</div>" +
      phaseHtml(1, b.phasen[0], "Orbit (Verteidigungsflotte + Orbitalverteidigung)", b) + phaseHtml(2, b.phasen[1], "Boden (Bodenverteidigung)", b) +
      "<section class=\"kb-truemmer\" id=\"kb-truemmer\"><h4>Trümmerfelder</h4><p class=\"hinweis\">" +
      "Orbit – Schiffstrümmer (Wracksammler, " + Math.round(b.quoten.orbit * 100) + " % der Baukosten): <b>" + rs(b.truemmerOrbit) + "</b>" +
      "<br>Boden – Verteidigungstrümmer (später Bodensammler, " + Math.round(b.quoten.schrott * 100) + " %): <b>" + rs(b.schrottBoden) + "</b>" +
      "<br>Reparatur Verteidigung: " + Math.round(b.quoten.reparatur * 100) + " % · Hangar geschützt: " + zahl(hangar) + " Schiffe · rücken nach dem Kampf nach: " + zahl(b.nachruecken) +
      " <span class=\"annahme-marke\">Annahme: Quoten</span></p>" +
      (b.geborgen ? "<p class=\"kb-geborgen\" id=\"kb-geborgen\">Orbit geborgen (Wracksammler der Angriffsflotte): <b>" + rs(b.geborgen) + "</b> · Rest im Orbit: " + rs(b.geborgen.restOrbit) + "</p>" : "") +
      (b.zivil ? "<p class=\"hinweis kb-zivil\">Zivilschiffe kämpfen nicht (fliegen hinten in der Formation)" +
        (b.zivil.angreiferVernichtet ? " – <b>Angriff total verloren: Zivilschiffe der Angriffsflotte vernichtet</b>" : "") +
        (b.zivil.verteidigerVernichtet ? " – Verteidigungs-Orbit gefallen: zivile Schiffe/Satelliten des Verteidigers vernichtet" : "") + ".</p>" : "") +
      "</section></div>";
  }

  SS.ui.kampfbericht = { html: berichtHtml };
})(typeof globalThis !== "undefined" ? globalThis : this);
