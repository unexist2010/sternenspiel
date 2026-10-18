/*
 * Sternenspiel – Oberfläche (Kapitel 1: reine Seitenstruktur – 8 Menüseiten, Spielerprofile, Speichern).
 * Kopf mit Ressourcenleiste · linkes Menü (8 Punkte) · mittleres Inhaltsfeld.
 * Navigation über den Adress-Anker (#uebersicht, #weltraum/sektor/2, #weltraum/system/75) – funktioniert auch über file://.
 */
(function () {
  "use strict";

  var dauerHinweis = ""; // bleibt auf dem Startbildschirm stehen (z. B. Versions-Problem)

  // ---------- Notfall-Anzeige: jeder Fehler wird sichtbar gemeldet, statt dass Knöpfe still „tot“ sind ----------
  function zeigeStartFehler(html) {
    var el = document.getElementById("start-fehler");
    if (!el) return;
    el.hidden = false;
    el.innerHTML = html;
  }
  function neuLadenKnopf() {
    return " <button class=\"knopf klein\" type=\"button\" onclick=\"location.replace(location.pathname + '?neu=' + Date.now())\">Neu laden</button>";
  }
  window.addEventListener("error", function (e) {
    zeigeStartFehler("Unerwarteter Fehler: " + String((e && e.message) || e).replace(/</g, "&lt;") + "." + neuLadenKnopf());
  });

  var SS = window.SS;
  var benoetigt = ["BALANCE", "DATEN", "kern", "format"];
  var fehltModul = !SS || benoetigt.some(function (k) { return !SS[k]; }) || !SS.kern.profile || !SS.kern.zustand || !SS.kern.bau || !SS.DATEN.gebaeudeGruppen || !SS.DATEN.weltraum || !SS.DATEN.menue;

  // ---------- Versionsprüfung (Schutz gegen gemischten Browser-Cache: neues HTML + alte Skripte oder umgekehrt) ----------
  var htmlVersion = document.documentElement.getAttribute("data-version");
  if (fehltModul || !SS.VERSION || htmlVersion !== SS.VERSION) {
    var schonVersucht = false;
    try { schonVersucht = sessionStorage.getItem("sternenspiel_neuladen") === String(SS && SS.VERSION); sessionStorage.setItem("sternenspiel_neuladen", String(SS && SS.VERSION)); } catch (e) { schonVersucht = true; }
    if (!schonVersucht) { location.replace(location.pathname + "?neu=" + Date.now() + location.hash); return; } // einmal automatisch frisch laden
    dauerHinweis = ("Die Seite und die Spieldateien passen nicht zusammen (Seite " + (htmlVersion || "alt") + ", Skripte " + ((SS && SS.VERSION) || "alt") +
      "). Bitte neu laden – ggf. mit Strg+F5." + neuLadenKnopf());
    zeigeStartFehler(dauerHinweis);
    if (fehltModul) return;
  } else {
    try { sessionStorage.removeItem("sternenspiel_neuladen"); } catch (e) { /* egal */ }
  }

  var B = SS.BALANCE, D = SS.DATEN, W = SS.DATEN.weltraum, P = SS.kern.produktion, S = SS.kern.speicher, Z = SS.kern.zustand, PR = SS.kern.profile, F = SS.format;

  var zustand = null;        // aktueller Spielstand (null = nicht im Spiel)
  var aktivId = null;        // ID des aktiven Spielerprofils
  var tickTimer = null, autoTimer = null;
  var seite = { id: "uebersicht", teile: [] };

  function $(id) { return document.getElementById(id); }
  var fehlendeElemente = [];
  /** Ereignis sicher anhängen: fehlt ein Element (z. B. alte Seite im Cache), wird das gemeldet statt abzustürzen. */
  function an(id, typ, fn) {
    var el = $(id);
    if (!el) { fehlendeElemente.push(id); return; }
    el.addEventListener(typ, function (e) {
      try { fn.call(this, e); }
      catch (err) { meldung("Fehler: " + (err && err.message || err), "schlecht"); if (window.console) console.error(err); }
    });
  }
  function jetzt() { return Date.now(); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function icon(r, cls) { return "<img class=\"" + (cls || "rs-icon") + "\" src=\"" + r.icon + "\" alt=\"\" width=\"22\" height=\"22\">"; }
  function planetBild(p, cls) { return "<img class=\"" + cls + "\" src=\"assets/planeten/" + p.typ.id + ".svg\" alt=\"" + esc(p.typ.name) + "\">"; }

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
    ["start", "spiel"].forEach(function (n) { $("bildschirm-" + n).classList.toggle("aktiv", n === name); });
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

  // ---------- Startbildschirm = Spielerauswahl ----------
  var startHinweise = [];
  function zeigeStart() {
    stoppeSchleifen();
    zustand = null;
    aktivId = null;
    schliesseMenue();
    try {
      var mig = PR.migriereEinzelstand(speicher, jetzt());
      if (mig.profil) startHinweise.push("Dein bisheriger Spielstand wurde als Spieler „" + esc(mig.profil.name) + "“ übernommen.");
      if (mig.fehler) startHinweise.push(esc(mig.fehler));
    } catch (e) { startHinweise.push("Alter Spielstand konnte nicht geprüft werden: " + esc(e.message || e)); }
    var r;
    try { r = PR.liste(speicher); } catch (e) { r = { profile: [], fehler: "Spielerliste nicht lesbar: " + (e.message || e) }; }
    if (r.fehler) startHinweise.push(esc(r.fehler));
    var el = $("profil-liste");
    if (!r.profile.length) {
      el.innerHTML = "<p class=\"hinweis\">Noch keine Spieler angelegt – erschaffe unten deinen ersten Spieler.</p>";
    } else {
      el.innerHTML = r.profile.map(function (p) {
        return "<div class=\"profil\" data-profil=\"" + esc(p.id) + "\"><div class=\"profil-info\"><b>" + esc(p.name) + "</b>" +
          "<span>" + esc(p.planet) + " <span class=\"koord\">[" + esc(p.koordinaten) + "]</span></span>" +
          "<span class=\"hinweis\">Zuletzt gespielt: " + (p.zuletztGespielt ? F.uhrzeit(p.zuletztGespielt) : "–") + "</span></div>" +
          "<div class=\"profil-knoepfe\"><button class=\"knopf primaer\" type=\"button\" data-aktion=\"spielen\" data-id=\"" + esc(p.id) + "\">Spielen</button>" +
          "<button class=\"knopf klein gefahr\" type=\"button\" data-aktion=\"loeschen\" data-id=\"" + esc(p.id) + "\" aria-label=\"Spieler " + esc(p.name) + " löschen\">Löschen</button></div></div>";
      }).join("");
    }
    zeigeHinweise();
    zeige("start");
  }

  function zeigeHinweise() {
    var el = $("start-fehler");
    var alle = (dauerHinweis ? [dauerHinweis] : []).concat(startHinweise);
    if (!alle.length) { el.hidden = true; el.innerHTML = ""; return; }
    el.hidden = false;
    el.innerHTML = alle.map(function (t) { return "<p>" + t + "</p>"; }).join("");
    startHinweise = [];
  }

  function starteNeuesSpiel() {
    var r = PR.erstelle(speicher, { name: $("eingabe-name").value, planetName: $("eingabe-planet").value, jetzt: jetzt() });
    if (r.fehler) { startHinweise.push(esc(r.fehler)); zeigeHinweise(); meldung(r.fehler, "schlecht"); $("eingabe-name").focus(); return; }
    $("eingabe-name").value = ""; $("eingabe-planet").value = "";
    zustand = r.zustand;
    aktivId = r.profil.id;
    location.hash = "#uebersicht";
    betreteSpiel();
    meldung("Willkommen, " + zustand.name + ", auf " + zustand.heimat.name + " [" + W.koordinatenText(zustand.heimat) + "]!", "gut");
  }

  function loescheSpieler(id) {
    var p = PR.liste(speicher).profile.filter(function (x) { return x.id === id; })[0];
    if (!p) return;
    dialog("Spieler löschen?", "<p>Der Spieler <b>" + esc(p.name) + "</b> und sein gesamter Fortschritt werden <b>unwiderruflich gelöscht</b>.</p>", true).then(function (ok) {
      if (!ok) return;
      PR.loesche(speicher, id);
      zeigeStart();
      meldung("Spieler „" + p.name + "“ gelöscht.");
    });
  }

  function spielerWechseln() {
    speichern(true);
    clearTimeout(meldung._t);
    $("meldung").className = "meldung";
    zeigeStart();
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
    tickTimer = setInterval(function () {
      var r = P.tick(zustand, jetzt());
      if (meldeFertig(r.fertig)) { speichern(true); baueMenue(); route(true); } else aktualisiereLive();
    }, B.TICK_MS);
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
    var liste = D.sichtbareRohstoffe(zustand); // Kunststoff T1–T3 und Antimaterie erst nach Freischaltung (Flag im Spielstand)
    var leiste = $("ressourcen-leiste");
    leiste.style.setProperty("--anzahl", liste.length);
    leiste.setAttribute("data-anzahl", liste.length);
    leiste.innerHTML = liste.map(function (r) {
      var strom = r.id === "strom"; // Strom = Bilanz: verfügbar / Bedarf (ANNAHME)
      return "<div class=\"rs\" title=\"" + r.name + (strom ? " (verfügbar / Bedarf)" : "") + "\" data-rohstoff=\"" + r.id + "\">" + icon(r) +
        "<span class=\"rs-text\"><span class=\"rs-name\">" + r.name + "</span><span class=\"rs-wert\" data-live=\"" + (strom ? "strom-kurz" : "bestand-kurz:" + r.id) + "\">0</span>" +
        "<span class=\"rs-rate\" data-live=\"" + (strom ? "strom-rate" : "rate-kurz:" + r.id) + "\"></span></span></div>";
    }).join("");
  }

  function baueMenue() {
    $("menue-liste").innerHTML = D.menue.map(function (m) {
      return "<li><a href=\"#" + m.id + "\" data-seite=\"" + m.id + "\">" + m.name + "</a></li>";
    }).join("");
    var h = zustand.heimat, pl = W.planet(h.system, h.planet);
    $("menue-planet").innerHTML = planetBild(pl, "") + "<div><b>" + esc(h.name) + "</b><span>[" + W.koordinatenText(h) + "]</span><small>" + esc(zustand.name) + "</small></div>";
  }

  function oeffneMenue() { $("menue").classList.add("offen"); $("menue-schleier").hidden = false; $("knopf-menue-auf").setAttribute("aria-expanded", "true"); }
  function schliesseMenue() { $("menue").classList.remove("offen"); $("menue-schleier").hidden = true; $("knopf-menue-auf").setAttribute("aria-expanded", "false"); }

  // ---------- Navigation ----------
  function route(scrollBehalten) {
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
    var html = id === "uebersicht" ? seiteUebersicht() : id === "ressourcen" ? seiteRessourcen() :
      id === "anlagen" ? (seite.teile[0] === "raumflughafen" ? seiteRaumflughafen() : seiteAnlagen()) : seitePlatzhalter(m);
    var y = window.scrollY;
    $("inhalt").innerHTML = "<h1 class=\"seiten-titel\">" + m.name + "</h1>" + html;
    $("inhalt").setAttribute("data-seite", id);
    $("inhalt").setAttribute("data-unterseite", seite.teile[0] || "");
    document.title = m.name + " – Sternenspiel";
    if (!scrollBehalten) schliesseMenue();
    aktualisiereLive();
    window.scrollTo(0, scrollBehalten ? y : 0);
  }

  function box(titel, inhalt, rechts, extra) {
    return "<section class=\"box\"" + (extra || "") + "><div class=\"box-kopf\"><span>" + titel + "</span>" + (rechts || "") + "</div><div class=\"box-inhalt\">" + inhalt + "</div></section>";
  }
  function brotkrumen(teile) {
    return "<nav class=\"brotkrumen\" aria-label=\"Pfad\">" + teile.map(function (t, i) {
      return (i ? "<span class=\"trenner\">›</span>" : "") + (t.href ? "<a href=\"" + t.href + "\">" + t.text + "</a>" : "<span>" + t.text + "</span>");
    }).join("") + "</nav>";
  }
  function hp() { return zustand.planeten[0]; }
  function rName(id) { var r = D.rohstoffNachId(id); return r ? r.name : id; }
  function zahlFein(n) { return n > 0 && n < 10 ? F.rate(Math.round(n * 100) / 100) : F.rate(n); }
  /** Kostenliste mit Icons; fehlende Mengen werden live rot markiert. */
  function kostenHtml(kosten) {
    return "<span class=\"kosten\">" + Object.keys(kosten).filter(function (id) { return kosten[id] > 0; }).map(function (id) {
      return "<span class=\"kosten-posten\" data-kosten=\"" + id + ":" + kosten[id] + "\" title=\"" + rName(id) + "\">" + icon(D.rohstoffNachId(id), "rs-icon klein") + F.zahl(kosten[id]) + "</span>";
    }).join("") + "</span>";
  }
  function bauKnopf(auftrag, text) {
    var attr = " data-aktion=\"bauen\" data-art=\"" + auftrag.art + "\"" + (auftrag.id ? " data-id=\"" + auftrag.id + "\"" : "") + (auftrag.buchstabe ? " data-buchstabe=\"" + auftrag.buchstabe + "\"" : "");
    return "<div class=\"bau-aktion\"><button class=\"knopf primaer\" type=\"button\"" + attr + ">" + text + "</button><span class=\"grund hinweis\"></span></div>";
  }
  function bauFortschritt(a) {
    return "<div class=\"bau-laufend\"><div class=\"bau-zeile\"><b>" + esc(a.name) + " → Stufe " + a.stufe + "</b><span data-live=\"bau-rest\"></span></div>" +
      "<div class=\"balken\"><div class=\"balken-fuellung\" data-live=\"bau-balken\"></div></div>" +
      "<div class=\"knopf-reihe\"><span class=\"hinweis\">Fertig: " + F.uhrzeit(a.ende) + "</span><button class=\"knopf klein gefahr\" type=\"button\" data-aktion=\"abbrechen\">Abbrechen</button></div></div>";
  }
  function bauBox() {
    var a = hp().bauauftrag;
    return box("Bauauftrag", a ? bauFortschritt(a) : "<p class=\"hinweis\">Kein Bauauftrag. Pro Planet läuft immer ein Auftrag gleichzeitig.</p>" + (seite && seite.id === "anlagen" ? "" : "<a class=\"knopf klein\" href=\"#anlagen\">Zu den Anlagen</a>"), "", " id=\"bauauftrag-box\"");
  }

  // ---------- Seiten ----------
  function seiteUebersicht() {
    var h = zustand.heimat, pl = W.planet(h.system, h.planet), sys = W.system(h.system);
    var planetBox = box("Hauptplanet",
      "<div class=\"planet-karte\">" + planetBild(pl, "planet-bild") + "<dl class=\"werte\">" +
      "<dt>Planet</dt><dd id=\"uebersicht-planet\">" + esc(h.name) + "</dd>" +
      "<dt>Koordinaten</dt><dd><span class=\"koord\" id=\"uebersicht-koordinaten\" title=\"Sektor:System:Planet\">[" + W.koordinatenText(h) + "]</span></dd>" +
      "<dt>Sektor</dt><dd>" + h.sektor + " – " + W.sektor(h.sektor).name + "</dd>" +
      "<dt>System</dt><dd>" + h.system + " – " + esc(sys.name) + "</dd>" +
      "<dt>Position</dt><dd>" + h.planet + " von " + B.WELTRAUM.PLANETEN_PRO_SYSTEM + "</dd>" +
      "</dl></div>");
    var kommandant = box("Kommandant",
      "<dl class=\"werte\"><dt>Name</dt><dd>" + esc(zustand.name) + "</dd>" +
      "<dt>Punkte</dt><dd data-live=\"punkte\"></dd>" +
      "<dt>Universum</dt><dd>" + W.universum().name + "</dd>" +
      "<dt>Spiel seit</dt><dd>" + F.uhrzeit(zustand.erstelltAm) + "</dd>" +
      "<dt>Offline erhalten</dt><dd data-live=\"offline\"></dd></dl>");
    var spielstand = box("Spielstand",
      "<p class=\"hinweis\" data-live=\"speicherinfo\"></p><div class=\"knopf-reihe\">" +
      "<button class=\"knopf primaer\" data-aktion=\"speichern\">Speichern</button>" +
      "<button class=\"knopf\" data-aktion=\"laden\">Laden</button>" +
      "<button class=\"knopf\" data-aktion=\"wechseln\">Spieler wechseln</button>" +
      "<button class=\"knopf gefahr\" data-aktion=\"zuruecksetzen\">Zurücksetzen</button></div>" +
      "<p class=\"hinweis\">Zurücksetzen betrifft nur diesen Spieler.</p>");
    return planetBox + "<div class=\"zwei-spalten\">" + kommandant + bauBox() + "</div>" + spielstand;
  }

  function leistungText(obj, vorzeichen) {
    var teile = Object.keys(obj).filter(function (id) { return obj[id] > 1e-9; }).map(function (id) { return vorzeichen + zahlFein(obj[id]) + " " + rName(id); });
    return teile.length ? teile.join(", ") : "–";
  }
  function seiteRessourcen() {
    var rs = D.sichtbareRohstoffe(zustand).filter(function (r) { return r.id !== "strom"; });
    var zeilen = rs.map(function (r) {
      return "<tr data-rohstoff=\"" + r.id + "\"><td><span class=\"rs-zelle\">" + icon(r) + r.name + "</span></td>" +
        "<td class=\"z\" data-live=\"bestand:" + r.id + "\"></td><td class=\"z eng-weg\" data-live=\"prod:" + r.id + "\"></td>" +
        "<td class=\"z eng-weg\" data-live=\"verb:" + r.id + "\"></td><td class=\"z\" data-live=\"netto:" + r.id + "\"></td></tr>";
    }).join("");
    var rohstoffe = box("Rohstoffe auf " + esc(zustand.heimat.name),
      "<div class=\"tabelle-huelle\"><table class=\"tabelle\" id=\"rohstoff-tabelle\"><thead><tr><th>Rohstoff</th><th class=\"z\">Bestand</th><th class=\"z eng-weg\">Produktion/h</th><th class=\"z eng-weg\">Verbrauch/h</th><th class=\"z\">Netto/h</th></tr></thead>" +
      "<tbody>" + zeilen + "</tbody></table></div>" +
      "<p class=\"hinweis\">Lager unbegrenzt (keine Speichergebäude). Grundproduktion Hauptplanet: Metall " + B.GRUNDPRODUKTION_HAUPTPLANET.metall + ", Silizium " + B.GRUNDPRODUKTION_HAUPTPLANET.silizium + " pro Std. <span class=\"annahme-marke\">Annahme</span></p>");
    var energie = box("Energiebilanz",
      "<dl class=\"werte\"><dt>Erzeugung</dt><dd data-live=\"strom-erzeugung\"></dd><dt>Bedarf</dt><dd data-live=\"strom-bedarf\"></dd>" +
      "<dt>Bilanz</dt><dd data-live=\"strom-bilanz\"></dd><dt>Produktionsfaktor</dt><dd data-live=\"strom-faktor\"></dd></dl>" +
      "<div class=\"balken\"><div class=\"balken-fuellung\" data-live=\"strom-balken\"></div></div>" +
      "<p class=\"hinweis\">Strom wird nicht gelagert: Reicht die Erzeugung nicht, drosseln alle Verbraucher anteilig (OGame-Produktionsfaktor). <span class=\"annahme-marke\">Annahme</span></p>",
      "", " id=\"energie-box\"");
    var reglerSel = function (id, wert) {
      var o = ""; for (var v = 100; v >= 0; v -= 10) o += "<option value=\"" + v + "\"" + (v === wert ? " selected" : "") + ">" + v + " %</option>";
      return "<select class=\"eingabe regler\" data-regler=\"" + id + "\" aria-label=\"Produktionsregler\">" + o + "</select>";
    };
    var p = hp(), reihen = "<tr><td>Grundproduktion</td><td class=\"z\">–</td><td>–</td><td data-live=\"ge:grund\"></td><td>–</td><td class=\"z\">–</td><td class=\"z eng-weg\">100 %</td></tr>";
    D.gebaeude.forEach(function (d) {
      if (!(d.regler && (p.gebaeude[d.id] || 0) > 0)) return;
      reihen += "<tr data-gebaeude=\"" + d.id + "\"><td>" + d.name + "</td><td class=\"z\">" + p.gebaeude[d.id] + "</td><td>" + reglerSel(d.id, p.regler[d.id]) + "</td>" +
        "<td data-live=\"ge:" + d.id + "\"></td><td data-live=\"gv:" + d.id + "\"></td><td class=\"z\" data-live=\"gs:" + d.id + "\"></td><td class=\"z eng-weg\" data-live=\"gf:" + d.id + "\"></td></tr>";
    });
    reihen += "<tr data-gebaeude=\"solarsatellit\"><td>Solarsatelliten</td><td class=\"z\">" + p.solarsatelliten + "</td><td>" + reglerSel("solarsatellit", p.regler.solarsatellit) + "</td><td>–</td><td>–</td><td class=\"z\" data-live=\"gs:solarsatellit\"></td><td class=\"z eng-weg\">–</td></tr>";
    var gebaeude = box("Produktion je Gebäude",
      "<div class=\"tabelle-huelle\"><table class=\"tabelle\" id=\"gebaeude-tabelle\"><thead><tr><th>Gebäude</th><th class=\"z\">Stufe</th><th>Regler</th><th>Ertrag/h</th><th>Verbrauch/h</th><th class=\"z\">Strom</th><th class=\"z eng-weg\">Faktor</th></tr></thead><tbody>" + reihen + "</tbody></table></div>" +
      "<p class=\"hinweis\">Regler senken Ertrag und Verbrauch eines Gebäudes (z. B. Ölverbrennung drosseln, um Rohöl zu sparen). Fehlen einem Kunststoffwerk Rohstoffe, drosselt es selbst – Bestände werden nie negativ.</p>");
    return rohstoffe + "<div class=\"zwei-spalten\">" + energie + bauBox() + "</div>" + gebaeude;
  }

  /** Werte eines Gebäudes bei Stufe n (100 % Leistung) als Text. */
  function wirkungText(d, n) {
    var T = [], wa = P.wachstum;
    if (d.erzeugt) T.push("+" + zahlFein(wa(d.erzeugt.basis, n)) + " " + rName(d.erzeugt.rohstoff) + "/h");
    if (d.werk) {
      var e = wa(d.werk.basis, n);
      T.push("+" + zahlFein(e) + " " + rName(d.werk.ausgabe) + "/h");
      T.push("−" + Object.keys(d.werk.input).map(function (id) { return zahlFein(d.werk.input[id] * e) + " " + rName(id); }).join(", −") + "/h");
    }
    if (d.stromErzeugt) T.push("+" + zahlFein(wa(d.stromErzeugt, n)) + " Strom");
    if (d.verbrauch) T.push("−" + zahlFein(wa(d.verbrauch.rohoel, n)) + " Rohöl/h");
    if (d.stromBedarf) T.push("−" + zahlFein(wa(d.stromBedarf, n)) + " Strom");
    if (d.geologie) T.push("+" + zahlFein(wa(d.geologie, n)) + " Rohölfelder/h");
    if (d.forschungszeit) T.push("Forschungszeit ×" + F.rate(Math.round(100 / (1 + n)) / 100));
    if (d.id === "raumflughafen") T.push(n > 0 ? "Startplätze verfügbar" : "keine Startplätze");
    if (d.id === "werft" || d.id === "verteidigungswerft") T.push("Funktion folgt später");
    return T.join(" · ") || "–";
  }

  function anlageKachel(d) {
    var p = hp(), n = p.gebaeude[d.id] || 0, max = D.maxStufe(d), a = p.bauauftrag, zl = SS.kern.bau.ziel(zustand, p, { art: "gebaeude", id: d.id });
    var laeuft = a && a.art === "gebaeude" && a.id === d.id;
    var extra = "";
    if (d.id === "geologiestation") extra = "<p class=\"extra\">Rohölfelder gefunden: <b data-live=\"felder\"></b>" + (p.istHauptplanet ? " (am Hauptplaneten optional – Rohöl ist hier unbegrenzt)" : "") + "</p>";
    if (d.id === "raumflughafen") extra = "<p class=\"extra\">Startplätze: <b>" + p.startplaetze.filter(function (s) { return s.stufe > 0; }).length + "/" + B.STARTPLAETZE.MAX_ANZAHL + "</b> gebaut · Kapazität <b data-live=\"kapazitaet\"></b> Schiffe</p><a class=\"knopf klein\" href=\"#anlagen/raumflughafen\" id=\"knopf-startplaetze\">Startplätze verwalten</a>";
    if (d.id === "bohrstation" && !p.istHauptplanet) extra = "<p class=\"extra\">Nutzbare Stufen: " + P.nutzbareBohrStufe(p) + " (Rohölfelder)</p>";
    var unten = n >= max ? "<p class=\"hinweis max\">Höchststufe erreicht.</p>" :
      "<dl class=\"anlage-werte\"><dt>Kosten Stufe " + zl.stufe + "</dt><dd>" + kostenHtml(zl.kosten) + "</dd>" +
      "<dt>Bauzeit</dt><dd>" + F.dauer(zl.bauzeit) + "</dd>" +
      "<dt>Aktuell</dt><dd>" + wirkungText(d, n) + "</dd>" +
      "<dt>Stufe " + zl.stufe + "</dt><dd>" + wirkungText(d, zl.stufe) + "</dd></dl>" +
      (laeuft ? bauFortschritt(a) : bauKnopf({ art: "gebaeude", id: d.id }, n === 0 ? "Bauen" : "Ausbauen auf " + zl.stufe));
    return "<article class=\"anlage" + (laeuft ? " im-bau" : "") + (n === 0 ? " stufe-0" : "") + "\" data-gebaeude=\"" + d.id + "\">" +
      "<div class=\"anlage-kopf\"><img class=\"anlage-bild\" src=\"" + d.bild + "\" alt=\"\" width=\"72\" height=\"72\"><div><h3>" + d.name + "</h3><span class=\"stufe\">Stufe <b>" + n + "</b> / " + max + "</span></div></div>" +
      "<p class=\"beschreibung\">" + esc(d.beschreibung) + "</p>" + extra + unten + "</article>";
  }
  function satellitKachel() {
    var s = D.solarsatellit, p = hp(), e = B.SOLARSATELLIT_ENERGIE;
    return "<article class=\"anlage\" data-gebaeude=\"solarsatellit\"><div class=\"anlage-kopf\"><img class=\"anlage-bild\" src=\"" + s.bild + "\" alt=\"\" width=\"72\" height=\"72\"><div><h3>" + s.name + "</h3><span class=\"stufe\">Anzahl <b>" + p.solarsatelliten + "</b></span></div></div>" +
      "<p class=\"beschreibung\">" + esc(s.beschreibung) + "</p>" +
      "<dl class=\"anlage-werte\"><dt>Energie je Satellit</dt><dd>" + e + " Strom <span class=\"annahme-marke\">Annahme</span></dd><dt>Gesamt</dt><dd data-live=\"gs:solarsatellit\"></dd><dt>Regler</dt><dd>" + p.regler.solarsatellit + " % (Seite Ressourcen)</dd></dl>" +
      "<p class=\"hinweis\">Bau in der Werft (eigenes Kapitel).</p></article>";
  }
  function seiteAnlagen() {
    var p = hp();
    var kopf = "<div class=\"zwei-spalten\">" + bauBox() + box("Planet",
      "<dl class=\"werte\"><dt>Punkte</dt><dd data-live=\"punkte\"></dd><dt>Strom</dt><dd data-live=\"strom-bilanz\"></dd><dt>Produktionsfaktor</dt><dd data-live=\"strom-faktor\"></dd></dl>" +
      "<p class=\"hinweis\">1 Punkt je 1.000 verbaute Rohstoffe (Kunststoff höher gewichtet). <span class=\"annahme-marke\">Annahme</span></p>") + "</div>";
    var gruppen = D.gebaeudeGruppen.map(function (gr) {
      var k = D.gebaeude.filter(function (d) { return d.gruppe === gr.id; }).map(anlageKachel).join("");
      if (gr.id === "energie") k += satellitKachel();
      return box(gr.name, "<div class=\"anlagen-raster\">" + k + "</div>", "", " data-gruppe=\"" + gr.id + "\"");
    }).join("");
    return kopf + gruppen + (p.istHauptplanet ? "" : "");
  }

  function seiteRaumflughafen() {
    var p = hp(), K = B.STARTPLAETZE, Bau = SS.kern.bau, a = p.bauauftrag;
    var kopf = brotkrumen([{ text: "Anlagen", href: "#anlagen" }, { text: "Raumflughafen" }]);
    if (!(p.gebaeude.raumflughafen > 0)) {
      return kopf + box("Raumflughafen", "<p>Der Raumflughafen ist noch nicht errichtet. Erst danach können Startplätze gebaut werden.</p>") +
        "<div class=\"anlagen-raster einzeln\">" + anlageKachel(D.gebaeudeNachId("raumflughafen")) + "</div>";
    }
    var regeln = D.startplatzRegeln.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("");
    var info = box("Startplätze",
      "<dl class=\"werte\"><dt>Gesamtkapazität</dt><dd><b data-live=\"kapazitaet\"></b> Schiffe gleichzeitig</dd><dt>Punkte</dt><dd data-live=\"punkte\"></dd>" +
      "<dt>Kapazität je Stufe</dt><dd>" + K.KAPAZITAET_PRO_STUFE + " Schiffe <span class=\"annahme-marke\">Annahme</span></dd></dl><ul class=\"regeln\">" + regeln + "</ul>" +
      "<p class=\"hinweis\">Beschriftung " + K.BUCHSTABEN[0] + "–" + K.BUCHSTABEN[K.MAX_ANZAHL - 1] + " <span class=\"annahme-marke\">Annahme</span> (10 oder A–Z ist noch offen).</p>", "", " id=\"startplaetze-info\"");
    var karten = p.startplaetze.map(function (sp) {
      var frei = Bau.startplatzFrei(zustand, sp.buchstabe), zl = Bau.ziel(zustand, p, { art: "startplatz", buchstabe: sp.buchstabe });
      var laeuft = a && a.art === "startplatz" && a.buchstabe === sp.buchstabe;
      var inhalt;
      if (!frei) inhalt = "<p class=\"gesperrt\">🔒 Gesperrt bis <b>" + F.zahl(Bau.startplatzSchwelle(sp.buchstabe)) + "</b> Punkte</p>";
      else if (sp.stufe >= K.STUFE_MAX) inhalt = "<p class=\"hinweis max\">Höchststufe erreicht.</p>";
      else inhalt = "<dl class=\"anlage-werte\"><dt>Kosten Stufe " + zl.stufe + "</dt><dd>" + kostenHtml(zl.kosten) + "</dd><dt>Bauzeit</dt><dd>" + F.dauer(zl.bauzeit) + "</dd>" +
        "<dt>Kapazität</dt><dd>" + sp.stufe * K.KAPAZITAET_PRO_STUFE + " → " + zl.stufe * K.KAPAZITAET_PRO_STUFE + " Schiffe</dd></dl>" +
        (laeuft ? bauFortschritt(a) : bauKnopf({ art: "startplatz", buchstabe: sp.buchstabe }, sp.stufe === 0 ? "Bauen" : "Ausbauen auf " + zl.stufe));
      return "<article class=\"startplatz-karte" + (frei ? " frei" : " gesperrt") + (sp.stufe > 0 ? " gebaut" : "") + "\" data-buchstabe=\"" + sp.buchstabe + "\">" +
        "<div class=\"startplatz-kopf\"><b class=\"buchstabe\">" + sp.buchstabe + "</b><span>Stufe <b>" + sp.stufe + "</b> / " + K.STUFE_MAX + "</span></div>" + inhalt + "</article>";
    }).join("");
    return kopf + "<div class=\"zwei-spalten\">" + info + bauBox() + "</div>" + box("Startplätze A–J", "<div class=\"startplatz-raster\">" + karten + "</div>");
  }

  // Alle übrigen Menüseiten: nur Titel + neutraler Platzhalter (Inhalt kommt in eigenen Kapiteln)
  function seitePlatzhalter(m) {
    return box(m.name, "<div class=\"platzhalter\"><p class=\"gross\">" + esc(D.PLATZHALTER_TEXT) + "</p></div>");
  }

  // ---------- Live-Werte (jeder Tick) ----------
  function aktualisiereLive() {
    if (!zustand) return;
    var u = P.uebersicht(zustand), p = hp(), a = p.bauauftrag, t = jetzt(), Bau = SS.kern.bau;
    var vz = function (n) { return (n > 1e-9 ? "+" : n < -1e-9 ? "−" : "") + zahlFein(Math.abs(n)); };
    Array.prototype.forEach.call(document.querySelectorAll("#bildschirm-spiel [data-live]"), function (el) {
      var k = el.getAttribute("data-live").split(":"), art = k[0], id = k[1];
      var wert = id ? zustand.rohstoffe[id] : 0, gi = id && u.gebaeude[id];
      var text;
      switch (art) {
        case "bestand-kurz": text = F.kurz(wert); break;
        case "rate-kurz": text = Math.abs(u.netto[id]) > 1e-9 ? vz(u.netto[id]) + "/h" : "–"; el.classList.toggle("negativ", u.netto[id] < -1e-9); break;
        case "strom-kurz": text = F.kurz(u.strom.erzeugung) + " / " + F.kurz(u.strom.bedarf); el.closest(".rs").classList.toggle("mangel", u.strom.bilanz < -1e-9); break;
        case "strom-rate": text = u.strom.faktor < 1 ? "Faktor " + Math.round(u.strom.faktor * 100) + " %" : "Bilanz " + vz(u.strom.bilanz); el.classList.toggle("negativ", u.strom.faktor < 1); break;
        case "bestand": text = wert > 0 && wert < 10 ? F.rate(Math.floor(wert * 100) / 100) : F.zahl(wert); break;
        case "prod": text = zahlFein(u.produktion[id]); break;
        case "verb": text = zahlFein(u.verbrauch[id]); break;
        case "netto": text = vz(u.netto[id]); el.classList.toggle("negativ", u.netto[id] < -1e-9); break;
        case "strom-erzeugung": text = F.zahl(u.strom.erzeugung); break;
        case "strom-bedarf": text = F.zahl(u.strom.bedarf); break;
        case "strom-bilanz": text = vz(u.strom.bilanz) + " (" + F.zahl(u.strom.erzeugung) + " / " + F.zahl(u.strom.bedarf) + ")"; el.classList.toggle("negativ", u.strom.bilanz < -1e-9); break;
        case "strom-faktor": text = Math.round(u.strom.faktor * 100) + " %"; el.classList.toggle("negativ", u.strom.faktor < 1); break;
        case "strom-balken": el.style.width = Math.round(u.strom.faktor * 100) + "%"; el.classList.toggle("mangel", u.strom.faktor < 1); return;
        case "ge": text = id === "grund" ? leistungText(p.istHauptplanet ? B.GRUNDPRODUKTION_HAUPTPLANET : {}, "+") : (gi ? leistungText(gi.erzeugt, "+") + (id === "geologiestation" ? "+" + zahlFein(u.felderProStunde) + " Felder" : "") : "–"); break;
        case "gv": text = gi ? leistungText(gi.verbraucht, "−") : "–"; break;
        case "gs": text = id === "solarsatellit" ? vz(u.satelliten.strom) : (gi && gi.strom ? vz(gi.strom) : "–"); break;
        case "gf": text = gi ? Math.round(gi.faktor * 100) + " %" : "–"; break;
        case "punkte": text = F.zahl(zustand.punkte); break;
        case "kapazitaet": text = F.zahl(Bau.kapazitaet(p)); break;
        case "felder": text = F.zahl(p.rohoelfelder) + " (+" + zahlFein(u.felderProStunde) + "/h)"; break;
        case "bau-rest": text = a ? "noch " + F.dauer(Math.max(0, a.ende - t)) : ""; break;
        case "bau-balken": el.style.width = a ? Math.min(100, Math.max(0, (t - a.start) / (a.ende - a.start) * 100)).toFixed(1) + "%" : "0%"; return;
        case "offline": text = F.dauer(zustand.statistik.offlineMsGesamt); break;
        case "speicherinfo":
          text = (zustand.zeit.zuletztGespeichert ? "Zuletzt gespeichert: " + F.uhrzeit(zustand.zeit.zuletztGespeichert) : "Noch nicht gespeichert") +
            " · Autospeichern alle " + Math.round(B.AUTOSPEICHERN_MS / 1000) + " s" + (window.__speicherFluechtig ? " · ACHTUNG: Browser erlaubt kein dauerhaftes Speichern" : "");
          break;
        default: return;
      }
      if (el.textContent !== text) el.textContent = text;
    });
    // Kosten rot markieren, Bau-Knöpfe mit Grund (de)aktivieren
    Array.prototype.forEach.call(document.querySelectorAll("#inhalt [data-kosten]"), function (el) {
      var k = el.getAttribute("data-kosten").split(":");
      el.classList.toggle("fehlt", (zustand.rohstoffe[k[0]] || 0) + 1e-9 < Number(k[1]));
    });
    Array.prototype.forEach.call(document.querySelectorAll("#inhalt button[data-aktion=\"bauen\"]"), function (b) {
      var pr = Bau.pruefe(zustand, p, auftragAus(b));
      if (b.disabled !== !pr.ok) b.disabled = !pr.ok;
      var g = b.parentNode.querySelector(".grund");
      if (g && g.textContent !== pr.grund) g.textContent = pr.grund;
    });
  }
  function auftragAus(b) {
    return { art: b.getAttribute("data-art"), id: b.getAttribute("data-id"), buchstabe: b.getAttribute("data-buchstabe") };
  }

  function bauen(b) {
    var p = hp();
    meldeFertig(P.tick(zustand, jetzt()).fertig);
    var r = SS.kern.bau.starte(zustand, p, auftragAus(b), jetzt());
    if (!r.ok) { meldung(r.grund, "schlecht"); aktualisiereLive(); return; }
    speichern(true);
    route(true);
    meldung("Bau gestartet: " + r.auftrag.name + " → Stufe " + r.auftrag.stufe + " (" + F.dauer(r.auftrag.ende - r.auftrag.start) + ")", "gut");
  }
  function bauAbbrechen() {
    var a = hp().bauauftrag;
    if (!a) return;
    dialog("Bauauftrag abbrechen?", "<p><b>" + esc(a.name) + " → Stufe " + a.stufe + "</b> wird abgebrochen. Du bekommst alle Rohstoffe zurück.</p>", true).then(function (ok) {
      if (!ok) return;
      P.tick(zustand, jetzt());
      SS.kern.bau.abbrechen(zustand, hp());
      speichern(true); route(true);
      meldung("Bauauftrag abgebrochen – Rohstoffe erstattet.");
    });
  }
  function meldeFertig(liste) {
    if (!liste || !liste.length) return false;
    var a = liste[liste.length - 1];
    meldung("Fertig: " + a.name + " Stufe " + a.stufe, "gut");
    return true;
  }

  // ---------- Spielstand (immer nur der aktive Spieler) ----------
  function speichern(still) {
    if (!zustand || !aktivId) return;
    try {
      PR.speichereProfil(speicher, aktivId, zustand, jetzt());
      aktualisiereLive();
      if (!still) meldung("Spielstand gespeichert.", "gut");
    } catch (e) {
      meldung("Speichern fehlgeschlagen: " + e.message, "schlecht");
    }
  }

  function ladeUndBetrete(id) {
    var r;
    try { r = PR.ladeProfil(speicher, id); } catch (e) { r = { zustand: null, fehler: e.message || String(e) }; }
    if (!r.zustand) {
      startHinweise.push("Spieler konnte nicht geladen werden: " + esc(r.fehler || "unbekannter Fehler") + " – du kannst ihn löschen oder einen neuen Spieler erschaffen.");
      zeigeStart();
      return;
    }
    zustand = r.zustand;
    aktivId = id;
    var off = P.offlineFortschritt(zustand, jetzt());
    if (location.hash !== "#uebersicht") location.hash = "#uebersicht";
    betreteSpiel();
    if (off.angerechnetMs >= 60000 || off.fertig.length) {
      var liste = D.sichtbareRohstoffe(zustand).filter(function (x) { return Math.abs(off.gewinne[x.id] || 0) >= 1; }).map(function (x) {
        var gw = off.gewinne[x.id];
        return "<li>" + icon(x) + x.name + ": " + (gw > 0 ? "+" : "−") + F.zahl(Math.abs(gw)) + "</li>";
      }).join("");
      var fertigListe = off.fertig.map(function (a) { return "<li>✔ " + esc(a.name) + " Stufe " + a.stufe + " fertiggestellt</li>"; }).join("");
      dialog("Willkommen zurück, " + esc(zustand.name) + "!", "<p>Du warst <b>" + F.dauer(off.abwesendMs) + "</b> weg." +
        (off.gekappt ? " Produktion angerechnet: höchstens " + B.OFFLINE_MAX_STUNDEN + " Std." : "") + "</p>" +
        (fertigListe ? "<ul class=\"boni\">" + fertigListe + "</ul>" : "") +
        (liste ? "<ul class=\"boni\">" + liste + "</ul>" : "<p>Keine Veränderung der Rohstoffe.</p>"), false);
    } else {
      meldung("Spieler „" + zustand.name + "“ geladen.", "gut");
    }
    speichern(true);
  }

  function zuruecksetzen() {
    if (!aktivId) return;
    var name = zustand.name;
    dialog("Spielstand zurücksetzen?", "<p>Der Fortschritt von <b>" + esc(name) + "</b> wird <b>unwiderruflich gelöscht</b>. Name und Hauptplanet bleiben, andere Spieler sind nicht betroffen.</p>", true).then(function (ok) {
      if (!ok) return;
      var id = aktivId;
      stoppeSchleifen();
      var r = PR.zuruecksetzen(speicher, id, jetzt());
      if (r.fehler) { meldung(r.fehler, "schlecht"); return; }
      zustand = r.zustand;
      aktivId = id;
      betreteSpiel();
      meldung("Spielstand von „" + name + "“ zurückgesetzt.");
    });
  }

  // ---------- Ereignisse ----------
  an("form-neu", "submit", function (e) { e.preventDefault(); starteNeuesSpiel(); });
  an("profil-liste", "click", function (e) {
    var b = e.target.closest("[data-aktion]");
    if (!b) return;
    var id = b.getAttribute("data-id");
    if (b.getAttribute("data-aktion") === "spielen") ladeUndBetrete(id);
    else if (b.getAttribute("data-aktion") === "loeschen") loescheSpieler(id);
  });
  an("knopf-menue-auf", "click", function () { if ($("menue").classList.contains("offen")) schliesseMenue(); else oeffneMenue(); });
  an("menue-schleier", "click", schliesseMenue);
  an("menue-liste", "click", function (e) {
    var a = e.target.closest("a[data-seite]");
    if (a && a.getAttribute("href") === location.hash) route(); // gleiche Seite erneut gewählt → Menü trotzdem schließen
  });
  an("knopf-schnellspeichern", "click", function () { speichern(false); });
  an("knopf-spieler-wechseln", "click", spielerWechseln);
  an("inhalt", "click", function (e) {
    var b = e.target.closest("[data-aktion]");
    if (!b) return;
    var a = b.getAttribute("data-aktion");
    if (a === "speichern") speichern(false);
    else if (a === "wechseln") spielerWechseln();
    else if (a === "zuruecksetzen") zuruecksetzen();
    else if (a === "bauen") bauen(b);
    else if (a === "abbrechen") bauAbbrechen();
    else if (a === "laden") {
      dialog("Letzten Spielstand laden?", "<p>Nicht gespeicherter Fortschritt seit dem letzten Speichern geht verloren (Offline-Produktion wird dabei angerechnet).</p>", true)
        .then(function (ok) { if (ok) { var id = aktivId; stoppeSchleifen(); ladeUndBetrete(id); } });
    }
  });
  an("inhalt", "change", function (e) {
    var sel = e.target.closest("select[data-regler]");
    if (!sel || !zustand) return;
    P.tick(zustand, jetzt());
    hp().regler[sel.getAttribute("data-regler")] = Math.max(0, Math.min(100, parseInt(sel.value, 10) || 0));
    speichern(true);
    aktualisiereLive();
  });
  window.addEventListener("hashchange", route);
  window.addEventListener("resize", passeKopfAn);
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (!$("dialog").hidden) $(!$("dialog-abbrechen").hidden ? "dialog-abbrechen" : "dialog-ok").click();
    else schliesseMenue();
  });
  // Beim Verlassen/Verstecken des Tabs speichern (Offline-Fortschritt rechnet ab diesem Zeitpunkt)
  document.addEventListener("visibilitychange", function () { if (document.hidden) speichern(true); });
  window.addEventListener("pagehide", function () { speichern(true); });

  SS.app = { get zustand() { return zustand; }, get aktivId() { return aktivId; }, speichern: speichern, route: route, zeigeStart: zeigeStart }; // für Konsole/Playtest
  if (fehlendeElemente.length) {
    dauerHinweis += "Die Seite ist unvollständig (fehlt: " + fehlendeElemente.join(", ") + ") – vermutlich eine alte Fassung im Browser-Zwischenspeicher." + neuLadenKnopf();
  }
  try { zeigeStart(); }
  catch (e) { zeigeStartFehler("Start fehlgeschlagen: " + String(e && e.message || e).replace(/</g, "&lt;") + neuLadenKnopf()); if (window.console) console.error(e); }
})();
