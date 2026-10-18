/*
 * Sternenspiel – Oberfläche (Kapitel 1: Layout-Grundgerüst).
 * Kopf mit Ressourcenleiste · linkes Menü (8 Punkte) · mittleres Inhaltsfeld.
 * Navigation über den Adress-Anker (#uebersicht, #weltraum/sektor/2, #weltraum/system/75) – funktioniert auch über file://.
 */
(function () {
  "use strict";
  var SS = window.SS;
  var B = SS.BALANCE, D = SS.DATEN, W = SS.DATEN.weltraum, P = SS.kern.produktion, S = SS.kern.speicher, Z = SS.kern.zustand, F = SS.format;

  var zustand = null;        // aktueller Spielstand (null = nicht im Spiel)
  var tickTimer = null, autoTimer = null;
  var gewaehlt = null;       // gewählter Startplatz-Buchstabe
  var sortierung = "buchstabe";
  var seite = { id: "uebersicht", teile: [] };

  function $(id) { return document.getElementById(id); }
  function jetzt() { return Date.now(); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function icon(r, cls) { return "<img class=\"" + (cls || "rs-icon") + "\" src=\"" + r.icon + "\" alt=\"\" width=\"22\" height=\"22\">"; }
  function planetBild(p, cls) { return "<img class=\"" + cls + "\" src=\"assets/planeten/" + p.typ.id + ".svg\" alt=\"" + esc(p.typ.name) + "\">"; }
  function sternBild(sys, cls) { return "<img class=\"" + (cls || "") + "\" src=\"assets/sterne/" + sys.stern.id + ".svg\" alt=\"" + esc(sys.stern.name) + "\">"; }

  // Speicher: localStorage kann bei file:// in manchen Browsern gesperrt sein → Ersatz im Arbeitsspeicher
  var speicher = (function () {
    try { var k = "__ss_test__"; localStorage.setItem(k, "1"); localStorage.removeItem(k); return localStorage; }
    catch (e) {
      var m = {}; window.__speicherFluechtig = true;
      return { getItem: function (k) { return k in m ? m[k] : null; }, setItem: function (k, v) { m[k] = String(v); }, removeItem: function (k) { delete m[k]; } };
    }
  })();

  // ---------- Allgemein ----------
  function zeige(name) {
    ["start", "neu", "spiel"].forEach(function (n) { $("bildschirm-" + n).classList.toggle("aktiv", n === name); });
    window.scrollTo(0, 0);
  }

  function meldung(text, art) {
    var el = $("meldung");
    el.textContent = text;
    el.className = "meldung sichtbar" + (art ? " " + art : "");
    clearTimeout(meldung._t);
    meldung._t = setTimeout(function () { el.className = "meldung"; }, 2800);
  }

  function dialog(titel, html, mitAbbrechen) {
    return new Promise(function (fertig) {
      $("dialog-titel").textContent = titel;
      $("dialog-text").innerHTML = html;
      $("dialog-abbrechen").hidden = !mitAbbrechen;
      $("dialog").hidden = false;
      $("dialog-ok").focus();
      function schliesse(ok) {
        $("dialog").hidden = true;
        $("dialog-ok").onclick = $("dialog-abbrechen").onclick = null;
        fertig(ok);
      }
      $("dialog-ok").onclick = function () { schliesse(true); };
      $("dialog-abbrechen").onclick = function () { schliesse(false); };
    });
  }

  // ---------- Startbildschirm ----------
  function zeigeStart() {
    stoppeSchleifen();
    zustand = null;
    schliesseMenue();
    var r = S.lade(speicher);
    var info = $("start-spielstand"), fehler = $("start-fehler");
    fehler.hidden = !r.fehler;
    fehler.textContent = r.fehler ? r.fehler + " – bitte ein neues Spiel beginnen." : "";
    if (r.zustand) {
      var z = r.zustand;
      info.hidden = false;
      info.innerHTML = "<b>" + esc(z.name) + "</b> · " + esc(z.heimat.name) + " <span class=\"koord\">[" + W.koordinatenText(z.heimat) + "]</span>" +
        "<br><span class=\"hinweis\">Startplatz " + z.startplatz.buchstabe + " (Stufe " + z.startplatz.stufe + ") · zuletzt gespeichert: " +
        (z.zeit.zuletztGespeichert ? F.uhrzeit(z.zeit.zuletztGespeichert) : "–") + "</span>";
      $("knopf-weiterspielen").hidden = false;
    } else {
      info.hidden = true;
      $("knopf-weiterspielen").hidden = true;
    }
    zeige("start");
  }

  // ---------- Neues Spiel ----------
  function zeigeNeu() {
    gewaehlt = null;
    $("knopf-starten").disabled = true;
    $("knopf-starten").textContent = "Spiel starten";
    zeichneStartplaetze();
    zeichneDetails();
    zeige("neu");
  }

  function zeichneStartplaetze() {
    var liste = D.startplaetze.slice();
    if (sortierung === "stufe") liste.sort(function (a, b) { return b.stufe - a.stufe || a.buchstabe.localeCompare(b.buchstabe); });
    $("startplatz-raster").innerHTML = liste.map(function (sp) {
      var st = Math.round((sp.stufe - 1) / 14 * 100);
      return "<button class=\"startplatz" + (sp.buchstabe === gewaehlt ? " gewaehlt" : "") + "\" role=\"option\" aria-selected=\"" + (sp.buchstabe === gewaehlt) +
        "\" data-buchstabe=\"" + sp.buchstabe + "\" style=\"--stufe:" + st + "%\">" +
        "<span class=\"sp-buchstabe\">" + sp.buchstabe + "</span>" +
        "<span class=\"sp-stufe\">Stufe " + sp.stufe + "</span>" +
        "<span class=\"sp-koord\">" + W.koordinatenText(W.heimatFuerStartplatz(sp.buchstabe)) + "</span>" +
        "<span class=\"sp-balken\"><i></i></span></button>";
    }).join("");
  }

  function zeichneDetails() {
    var el = $("startplatz-details");
    var sp = gewaehlt && D.startplatzNachBuchstabe(gewaehlt);
    if (!sp) { el.innerHTML = "<p class=\"hinweis\">Tippe auf einen Startplatz, um Details zu sehen.</p>"; return; }
    var k = W.heimatFuerStartplatz(sp.buchstabe), pl = W.planet(k.system, k.planet), sys = W.system(k.system);
    var zeilen = D.rohstoffe.filter(function (r) { return r.gruppe === "grund"; }).map(function (r) {
      var m = P.startplatzMultiplikator(sp, r.id);
      return "<li" + (r.id === sp.schwerpunkt ? " class=\"schwerpunkt\"" : "") + ">" + icon(r) + r.name + ": <b>" + F.prozent(m) + "</b>" + (r.id === sp.schwerpunkt ? " ★ Schwerpunkt" : "") + "</li>";
    }).join("");
    el.innerHTML = "<h3>" + sp.name + " · Stufe " + sp.stufe + "</h3>" +
      "<div class=\"planet-karte\">" + planetBild(pl, "planet-mini") + "<span>" + esc(pl.name) + " <span class=\"koord\">[" + pl.koordinaten + "]</span><br>" +
      "<span class=\"hinweis\">" + W.sektor(k.sektor).name + " · System " + esc(sys.name) + "</span></span></div>" +
      "<ul class=\"boni\">" + zeilen + "</ul>";
  }

  function starteNeuesSpiel() {
    if (!gewaehlt) return;
    var los = function () {
      zustand = Z.neuerSpielstand({ name: $("eingabe-name").value, planetName: $("eingabe-planet").value, startplatz: gewaehlt, jetzt: jetzt() });
      S.speichere(speicher, zustand, jetzt());
      location.hash = "#uebersicht";
      betreteSpiel();
      meldung("Willkommen auf " + zustand.heimat.name + "!", "gut");
    };
    if (S.vorhanden(speicher)) {
      dialog("Neues Spiel beginnen?", "<p>Der vorhandene Spielstand wird <b>überschrieben</b>.</p>", true).then(function (ok) { if (ok) los(); });
    } else los();
  }

  // ---------- Spiel: Rahmen ----------
  function betreteSpiel() {
    zeige("spiel");
    baueRessourcenLeiste();
    baueMenue();
    passeKopfAn();
    route();
    aktualisiereLive();
    stoppeSchleifen();
    tickTimer = setInterval(function () { P.tick(zustand, jetzt()); aktualisiereLive(); }, B.TICK_MS);
    autoTimer = setInterval(function () { speichern(true); }, B.AUTOSPEICHERN_MS);
  }

  function stoppeSchleifen() {
    clearInterval(tickTimer); clearInterval(autoTimer);
    tickTimer = autoTimer = null;
  }

  function passeKopfAn() {
    var h = document.querySelector("#bildschirm-spiel .kopf").offsetHeight;
    if (h) document.documentElement.style.setProperty("--kopf-hoehe", h + "px");
  }

  function baueRessourcenLeiste() {
    var liste = D.sichtbareRohstoffe(zustand); // Antimaterie erst nach Freischaltung
    var leiste = $("ressourcen-leiste");
    leiste.style.setProperty("--anzahl", liste.length);
    leiste.setAttribute("data-anzahl", liste.length);
    leiste.innerHTML = liste.map(function (r) {
      return "<div class=\"rs\" title=\"" + r.name + "\" data-rohstoff=\"" + r.id + "\">" + icon(r) +
        "<span class=\"rs-text\"><span class=\"rs-name\">" + r.name + "</span><span class=\"rs-wert\" data-live=\"bestand-kurz:" + r.id + "\">0</span>" +
        "<span class=\"rs-rate\" data-live=\"rate-kurz:" + r.id + "\"></span></span></div>";
    }).join("");
  }

  function baueMenue() {
    $("menue-liste").innerHTML = D.menue.map(function (m) {
      return "<li><a href=\"#" + m.id + "\" data-seite=\"" + m.id + "\">" + m.name +
        (m.platzhalter ? "<span class=\"marke\">Kap. " + m.kapitel + "</span>" : "") + "</a></li>";
    }).join("");
    var h = zustand.heimat, pl = W.planet(h.system, h.planet);
    $("menue-planet").innerHTML = planetBild(pl, "") + "<div><b>" + esc(h.name) + "</b><span>[" + W.koordinatenText(h) + "]</span></div>";
  }

  function oeffneMenue() { $("menue").classList.add("offen"); $("menue-schleier").hidden = false; $("knopf-menue-auf").setAttribute("aria-expanded", "true"); }
  function schliesseMenue() { $("menue").classList.remove("offen"); $("menue-schleier").hidden = true; $("knopf-menue-auf").setAttribute("aria-expanded", "false"); }

  // ---------- Navigation ----------
  function route() {
    if (!zustand) return;
    var teile = location.hash.replace(/^#/, "").split("/").filter(Boolean);
    var id = teile[0] && D.menuePunkt(teile[0]) ? teile[0] : "uebersicht";
    seite = { id: id, teile: teile.slice(1) };
    Array.prototype.forEach.call(document.querySelectorAll("#menue-liste a"), function (a) {
      var aktiv = a.getAttribute("data-seite") === id;
      a.classList.toggle("aktiv", aktiv);
      if (aktiv) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    var m = D.menuePunkt(id);
    var html = id === "uebersicht" ? seiteUebersicht() : id === "ressourcen" ? seiteRessourcen() : id === "weltraum" ? seiteWeltraum(seite.teile) : seitePlatzhalter(m);
    $("inhalt").innerHTML = "<h1 class=\"seiten-titel\">" + m.name + "</h1>" + html;
    $("inhalt").setAttribute("data-seite", id);
    document.title = m.name + " – Sternenspiel";
    schliesseMenue();
    aktualisiereLive();
    window.scrollTo(0, 0);
  }

  function box(titel, inhalt, rechts) {
    return "<section class=\"box\"><div class=\"box-kopf\"><span>" + titel + "</span>" + (rechts || "") + "</div><div class=\"box-inhalt\">" + inhalt + "</div></section>";
  }

  // ---------- Seiten ----------
  function seiteUebersicht() {
    var h = zustand.heimat, sp = zustand.startplatz, pl = W.planet(h.system, h.planet), sys = W.system(h.system);
    var planetBox = box("Heimatplanet",
      "<div class=\"planet-karte\">" + planetBild(pl, "planet-bild") + "<dl class=\"werte\">" +
      "<dt>Planet</dt><dd>" + esc(h.name) + "</dd>" +
      "<dt>Koordinaten</dt><dd><a class=\"koord\" href=\"#weltraum/system/" + h.system + "\" title=\"Sektor:System:Planet\">[" + W.koordinatenText(h) + "]</a></dd>" +
      "<dt>Sektor</dt><dd>" + h.sektor + " – " + W.sektor(h.sektor).name + "</dd>" +
      "<dt>System</dt><dd>" + h.system + " – " + esc(sys.name) + "</dd>" +
      "<dt>Position</dt><dd>" + h.planet + " von " + B.WELTRAUM.PLANETEN_PRO_SYSTEM + "</dd>" +
      "<dt>Startplatz</dt><dd>" + sp.buchstabe + " · Stufe " + sp.stufe + "</dd>" +
      "<dt>Schwerpunkt</dt><dd>" + D.rohstoffNachId(sp.schwerpunkt).name + "</dd>" +
      "</dl></div>");
    var kommandant = box("Kommandant",
      "<dl class=\"werte\"><dt>Name</dt><dd>" + esc(zustand.name) + "</dd>" +
      "<dt>Universum</dt><dd>" + W.universum().name + "</dd>" +
      "<dt>Spiel seit</dt><dd>" + F.uhrzeit(zustand.erstelltAm) + "</dd>" +
      "<dt>Offline erhalten</dt><dd data-live=\"offline\"></dd></dl>");
    var spielstand = box("Spielstand",
      "<p class=\"hinweis\" data-live=\"speicherinfo\"></p><div class=\"knopf-reihe\">" +
      "<button class=\"knopf primaer\" data-aktion=\"speichern\">Speichern</button>" +
      "<button class=\"knopf\" data-aktion=\"laden\">Laden</button>" +
      "<button class=\"knopf gefahr\" data-aktion=\"zuruecksetzen\">Zurücksetzen</button></div>");
    return planetBox + "<div class=\"zwei-spalten\">" + kommandant + spielstand + "</div>";
  }

  function seiteRessourcen() {
    var zeilen = D.sichtbareRohstoffe(zustand).map(function (r) {
      return "<tr data-rohstoff=\"" + r.id + "\"><td><span class=\"rs-zelle\">" + icon(r) + r.name + "</span></td>" +
        "<td class=\"z\" data-live=\"bestand:" + r.id + "\"></td><td class=\"z eng-weg\" data-live=\"lager:" + r.id + "\"></td>" +
        "<td class=\"z\" data-live=\"rate:" + r.id + "\"></td><td class=\"z\" data-live=\"bonus:" + r.id + "\"></td></tr>";
    }).join("");
    return box("Rohstoffe auf " + esc(zustand.heimat.name),
      "<div class=\"tabelle-huelle\"><table class=\"tabelle\" id=\"rohstoff-tabelle\"><thead><tr><th>Rohstoff</th><th class=\"z\">Bestand</th><th class=\"z eng-weg\">Lager</th><th class=\"z\">pro Std.</th><th class=\"z\">Bonus</th></tr></thead>" +
      "<tbody>" + zeilen + "</tbody></table></div>" +
      "<p class=\"hinweis\">Vorläufige Grundproduktion (Unterbau, Werte = Annahme). Förderanlagen und Lager folgen in Kapitel 2 (Anlagen), Kunststoff-Herstellung in Kapitel 3.</p>");
  }

  function seitePlatzhalter(m) {
    var plan = { 2: "Ressourcen & Anlagen", 3: "Forschung", 4: "Werft", 5: "Verteidigung & Kampf", 6: "Flotte & Weltraum-Missionen", 7: "KI-Gegner & Feinschliff" };
    return box(m.name, "<div class=\"platzhalter\"><img class=\"platzhalter-symbol\" src=\"assets/emblem.svg\" alt=\"\">" +
      "<p class=\"gross\">Kommt in Kapitel " + m.kapitel + "</p><p>" + (plan[m.kapitel] ? "Kapitel " + m.kapitel + ": " + plan[m.kapitel] + "<br>" : "") + "</p>" +
      "<p class=\"hinweis\">" + esc(m.text || "") + "</p></div>");
  }

  function brotkrumen(teile) {
    return "<nav class=\"brotkrumen\" aria-label=\"Pfad\">" + teile.map(function (t, i) {
      return (i ? "<span class=\"trenner\">›</span>" : "") + (t.href ? "<a href=\"" + t.href + "\">" + t.text + "</a>" : "<span>" + t.text + "</span>");
    }).join("") + "</nav>";
  }

  function seiteWeltraum(teile) {
    var u = W.universum(), h = zustand.heimat;
    var art = teile[0], nr = parseInt(teile[1], 10);
    var heimatKnopf = "<a class=\"knopf klein\" href=\"#weltraum/system/" + h.system + "\">Zum Heimatsystem</a>";
    // Ebene System
    if (art === "system" && W.system(nr)) {
      var sys = W.system(nr), sek = W.sektor(sys.sektor);
      var zeilen = sys.planeten.map(function (p) {
        var heim = p.system === h.system && p.position === h.planet;
        return "<tr" + (heim ? " class=\"heimat\"" : "") + " data-position=\"" + p.position + "\"><td class=\"z\">" + p.position + "</td><td>" + planetBild(p, "planet-mini") + "</td>" +
          "<td>" + (heim ? esc(h.name) : esc(p.name)) + "</td><td class=\"eng-weg\">" + p.typ.name + "</td><td class=\"koord\">" + p.koordinaten + "</td>" +
          "<td>" + (heim ? "<span class=\"heimat-marke\">Dein Heimatplanet</span>" : "<span class=\"hinweis\">unbewohnt</span>") + "</td></tr>";
      }).join("");
      var vor = nr > 1 ? nr - 1 : null, nach = nr < B.WELTRAUM.SYSTEME_GESAMT ? nr + 1 : null;
      return brotkrumen([{ text: "Universum " + u.name, href: "#weltraum" }, { text: sek.name, href: "#weltraum/sektor/" + sek.nummer }, { text: "System " + nr + " " + esc(sys.name) }]) +
        box("Sonnensystem " + nr, "<div class=\"system-kopf\">" + sternBild(sys) + "<div><b>" + esc(sys.name) + "</b><br><span class=\"hinweis\">" + sys.stern.name + " · " + sek.name + " · " + B.WELTRAUM.PLANETEN_PRO_SYSTEM + " Planeten</span></div></div>" +
          "<div class=\"system-nav\">" +
          (vor ? "<a class=\"knopf klein\" href=\"#weltraum/system/" + vor + "\" aria-label=\"Vorheriges System\">◀ " + vor + "</a>" : "") +
          "<form id=\"form-system\" class=\"system-nav\" style=\"margin:0\"><label class=\"hinweis\" for=\"eingabe-system\">System</label><input id=\"eingabe-system\" class=\"eingabe\" type=\"number\" min=\"1\" max=\"" + B.WELTRAUM.SYSTEME_GESAMT + "\" value=\"" + nr + "\" inputmode=\"numeric\"><button class=\"knopf klein\" type=\"submit\">Los</button></form>" +
          (nach ? "<a class=\"knopf klein\" href=\"#weltraum/system/" + nach + "\" aria-label=\"Nächstes System\">" + nach + " ▶</a>" : "") + heimatKnopf + "</div>" +
          "<div class=\"tabelle-huelle\"><table class=\"tabelle\" id=\"planeten-tabelle\"><thead><tr><th class=\"z\">Pos.</th><th></th><th>Planet</th><th class=\"eng-weg\">Typ</th><th>Koordinaten</th><th>Status</th></tr></thead><tbody>" + zeilen + "</tbody></table></div>" +
          "<p class=\"hinweis\">Der Planetentyp dient nur der Optik.</p>");
    }
    // Ebene Sektor
    if (art === "sektor" && W.sektor(nr)) {
      var s = W.sektor(nr), knoepfe = "";
      for (var n = s.systemVon; n <= s.systemBis; n++) {
        var sy = W.system(n);
        knoepfe += "<a class=\"system-knopf" + (n === h.system ? " heimat" : "") + "\" href=\"#weltraum/system/" + n + "\" title=\"" + esc(sy.name) + "\">" + sternBild(sy) + "<b>" + n + "</b><span>" + esc(sy.name) + "</span></a>";
      }
      return brotkrumen([{ text: "Universum " + u.name, href: "#weltraum" }, { text: s.name }]) +
        box(s.name + " · Systeme " + s.systemVon + "–" + s.systemBis, (nr === h.sektor ? "<p class=\"heimat-marke\">Dein Heimatsektor – Heimatsystem " + h.system + " ist hervorgehoben.</p>" : "") +
          "<div class=\"system-raster\" id=\"system-raster\">" + knoepfe + "</div>", heimatKnopf);
    }
    // Ebene Universum
    var karten = u.sektoren.map(function (s) {
      return "<a class=\"sektor-karte" + (s.nummer === h.sektor ? " heimat" : "") + "\" href=\"#weltraum/sektor/" + s.nummer + "\" data-sektor=\"" + s.nummer + "\"><b>" + s.name + "</b>" +
        "<span class=\"hinweis\">Sektor " + s.nummer + " · Systeme " + s.systemVon + "–" + s.systemBis + "</span>" +
        (s.nummer === h.sektor ? "<br><span class=\"heimat-marke\">★ Heimatsektor</span>" : "") + "</a>";
    }).join("");
    return brotkrumen([{ text: "Universum " + u.name }]) +
      "<div class=\"welt-kennzahlen\"><div class=\"kennzahl\"><b>1</b><span>Universum</span></div><div class=\"kennzahl\"><b>" + B.WELTRAUM.SEKTOREN + "</b><span>Sektoren</span></div>" +
      "<div class=\"kennzahl\"><b>" + B.WELTRAUM.SYSTEME_GESAMT + "</b><span>Sonnensysteme</span></div><div class=\"kennzahl\"><b>" + F.zahl(W.anzahlPlaneten()) + "</b><span>Planeten</span></div></div>" +
      box("Sektoren des Universums " + u.name, "<div class=\"sektor-raster\">" + karten + "</div>", heimatKnopf) +
      "<p class=\"hinweis\">Flüge und Missionen im Weltraum folgen in Kapitel 6.</p>";
  }

  // ---------- Live-Werte (jeder Tick) ----------
  function aktualisiereLive() {
    if (!zustand) return;
    var prod = P.produktionProStunde(zustand);
    Array.prototype.forEach.call(document.querySelectorAll("#bildschirm-spiel [data-live]"), function (el) {
      var t = el.getAttribute("data-live").split(":"), art = t[0], id = t[1];
      var wert = id ? zustand.rohstoffe[id] : 0, kap = id ? P.lagerKapazitaet(zustand, id) : 0, voll = id && wert >= kap && prod[id] > 0;
      var text;
      switch (art) {
        case "bestand-kurz": text = F.kurz(wert); el.closest(".rs").classList.toggle("voll", !!voll); break;
        case "rate-kurz": text = prod[id] > 0 ? (voll ? "Lager voll" : "+" + F.rate(prod[id]) + "/h") : "–"; break;
        case "bestand": text = F.zahl(wert); break;
        case "lager": text = F.zahl(kap); break;
        case "rate": text = F.rate(prod[id]); break;
        case "bonus": var m = P.startplatzMultiplikator(zustand.startplatz, id); text = m > 1 ? F.prozent(m) : "–"; break;
        case "offline": text = F.dauer(zustand.statistik.offlineMsGesamt); break;
        case "speicherinfo":
          text = (zustand.zeit.zuletztGespeichert ? "Zuletzt gespeichert: " + F.uhrzeit(zustand.zeit.zuletztGespeichert) : "Noch nicht gespeichert") +
            " · Autospeichern alle " + Math.round(B.AUTOSPEICHERN_MS / 1000) + " s" + (window.__speicherFluechtig ? " · ACHTUNG: Browser erlaubt kein dauerhaftes Speichern" : "");
          break;
        default: return;
      }
      if (el.textContent !== text) el.textContent = text;
    });
  }

  // ---------- Spielstand ----------
  function speichern(still) {
    if (!zustand) return;
    try {
      S.speichere(speicher, zustand, jetzt());
      aktualisiereLive();
      if (!still) meldung("Spielstand gespeichert.", "gut");
    } catch (e) {
      meldung("Speichern fehlgeschlagen: " + e.message, "schlecht");
    }
  }

  function ladeUndBetrete() {
    var r = S.lade(speicher);
    if (!r.zustand) { meldung(r.fehler || "Kein Spielstand vorhanden.", "schlecht"); zeigeStart(); return; }
    zustand = r.zustand;
    var off = P.offlineFortschritt(zustand, jetzt());
    betreteSpiel();
    if (off.angerechnetMs >= 60000) {
      var liste = D.sichtbareRohstoffe(zustand).filter(function (x) { return off.gewinne[x.id] >= 1; }).map(function (x) {
        return "<li>" + icon(x) + x.name + ": +" + F.zahl(off.gewinne[x.id]) + "</li>";
      }).join("");
      dialog("Willkommen zurück!", "<p>Du warst <b>" + F.dauer(off.abwesendMs) + "</b> weg." +
        (off.gekappt ? " Angerechnet werden höchstens " + B.OFFLINE_MAX_STUNDEN + " Std." : "") + "</p>" +
        (liste ? "<ul class=\"boni\">" + liste + "</ul>" : "<p>Deine Lager waren bereits voll.</p>"), false);
    } else {
      meldung("Spielstand geladen.", "gut");
    }
    speichern(true);
  }

  function zuruecksetzen() {
    dialog("Spielstand zurücksetzen?", "<p>Der gesamte Fortschritt wird <b>unwiderruflich gelöscht</b>.</p>", true).then(function (ok) {
      if (!ok) return;
      S.loesche(speicher);
      zeigeStart();
      meldung("Spielstand gelöscht.");
    });
  }

  // ---------- Ereignisse ----------
  $("knopf-neues-spiel").addEventListener("click", zeigeNeu);
  $("knopf-weiterspielen").addEventListener("click", ladeUndBetrete);
  $("knopf-zurueck").addEventListener("click", zeigeStart);
  $("knopf-starten").addEventListener("click", starteNeuesSpiel);
  $("knopf-menue-auf").addEventListener("click", function () { if ($("menue").classList.contains("offen")) schliesseMenue(); else oeffneMenue(); });
  $("menue-schleier").addEventListener("click", schliesseMenue);
  $("menue-liste").addEventListener("click", function (e) {
    var a = e.target.closest("a[data-seite]");
    if (a && a.getAttribute("href") === location.hash) route(); // gleiche Seite erneut gewählt → Menü trotzdem schließen
  });
  $("knopf-schnellspeichern").addEventListener("click", function () { speichern(false); });
  $("knopf-hauptmenue").addEventListener("click", function () { speichern(true); zeigeStart(); });
  $("inhalt").addEventListener("click", function (e) {
    var b = e.target.closest("[data-aktion]");
    if (!b) return;
    var a = b.getAttribute("data-aktion");
    if (a === "speichern") speichern(false);
    else if (a === "zuruecksetzen") zuruecksetzen();
    else if (a === "laden") {
      dialog("Letzten Spielstand laden?", "<p>Nicht gespeicherter Fortschritt seit dem letzten Speichern geht verloren (Offline-Produktion wird dabei angerechnet).</p>", true)
        .then(function (ok) { if (ok) ladeUndBetrete(); });
    }
  });
  $("inhalt").addEventListener("submit", function (e) {
    if (e.target.id !== "form-system") return;
    e.preventDefault();
    var n = parseInt($("eingabe-system").value, 10);
    if (W.system(n)) location.hash = "#weltraum/system/" + n;
    else meldung("Systeme gibt es von 1 bis " + B.WELTRAUM.SYSTEME_GESAMT + ".", "schlecht");
  });
  window.addEventListener("hashchange", route);
  window.addEventListener("resize", passeKopfAn);
  $("startplatz-raster").addEventListener("click", function (e) {
    var b = e.target.closest(".startplatz");
    if (!b) return;
    gewaehlt = b.getAttribute("data-buchstabe");
    $("knopf-starten").disabled = false;
    $("knopf-starten").textContent = "Spiel starten · " + gewaehlt + " (Stufe " + D.startplatzNachBuchstabe(gewaehlt).stufe + ")";
    zeichneStartplaetze();
    zeichneDetails();
  });
  $("startplatz-filter").addEventListener("click", function (e) {
    var b = e.target.closest("[data-sort]");
    if (!b) return;
    sortierung = b.getAttribute("data-sort");
    Array.prototype.forEach.call(this.querySelectorAll("[data-sort]"), function (x) { x.classList.toggle("aktiv", x === b); });
    zeichneStartplaetze();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (!$("dialog").hidden) $(!$("dialog-abbrechen").hidden ? "dialog-abbrechen" : "dialog-ok").click();
    else schliesseMenue();
  });
  // Beim Verlassen/Verstecken des Tabs speichern (Offline-Fortschritt rechnet ab diesem Zeitpunkt)
  document.addEventListener("visibilitychange", function () { if (document.hidden) speichern(true); });
  window.addEventListener("pagehide", function () { speichern(true); });

  SS.app = { get zustand() { return zustand; }, speichern: speichern, route: route }; // für Konsole/Playtest
  zeigeStart();
})();
