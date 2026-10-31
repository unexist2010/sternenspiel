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
  var fehltModul = !SS || benoetigt.some(function (k) { return !SS[k]; }) || !SS.kern.profile || !SS.kern.zustand || !SS.kern.bau || !SS.kern.geologie || !SS.kern.forschung || !SS.kern.werft || !SS.kern.verteidigung || !SS.kern.kampf || !SS.DATEN.verteidigung || !SS.DATEN.schiffe || !(SS.ui && SS.ui.werft && SS.ui.verteidigung && SS.ui.flotte && SS.ui.weltraum) || !SS.kern.flotte || !SS.DATEN.forschung || !SS.DATEN.gebaeudeGruppen || !SS.DATEN.weltraum || !SS.DATEN.menue;

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

  // 0.20.2 (Sandro pt59u): Versionsanzeige am Startbildschirm immer aus SS.VERSION
  (function () { var va = document.getElementById("version-anzeige"); if (va) va.textContent = SS.VERSION; })();

  var B = SS.BALANCE, D = SS.DATEN, W = SS.DATEN.weltraum, P = SS.kern.produktion, S = SS.kern.speicher, Z = SS.kern.zustand, PR = SS.kern.profile, F = SS.format;

  var zustand = null;        // aktueller Spielstand (null = nicht im Spiel)
  var aktivId = null;        // ID des aktiven Spielerprofils
  var tickTimer = null, autoTimer = null;
  var seite = { id: "uebersicht", teile: [] };
  var uiZustand = { fundLogOffen: false };   // reine Anzeige-Zustände (nicht gespeichert)

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
    schliesseInfo();
    aktualisiereMaster();
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
    aktualisiereMaster();
    route();
    aktualisiereLive();
    stoppeSchleifen();
    tickTimer = setInterval(function () {
      var r = P.tick(zustand, jetzt());
      var neu = meldeFertig(r.fertig); if (meldeFunde(r.funde)) neu = true;
      if (neu) { speichern(true); baueMenue(); if (seite && seite.id === "flotte" && sendeFormularBenutzt()) { baueFlottenLeiste(); aktualisiereLive(); } else route(true); } else aktualisiereLive();
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
    bauePlanetenListe();
  }
  /** 0.18.0 (Sandro t49u): Planetenliste links wie OGame – Heimat + Kolonien anklickbar, aktiver Planet markiert. */
  function bauePlanetenListe() {
    var h = aktivInfo(), pl = W.planet(h.system, h.planet), ak = hp();
    $("menue-planet").innerHTML = planetBild(pl, "") + "<div><b>" + esc(h.name) + "</b><span>[" + W.koordinatenText(h) + "]</span><small>" + esc(zustand.name) + "</small></div>";
    var liste = $("planeten-liste"); if (!liste) return;
    liste.innerHTML = "<div class=\"planeten-kopf\">Planeten <span>" + zustand.planeten.length + "</span></div><ul>" + zustand.planeten.map(function (p, i) {
      var k = planetKoord(p), bild = W.planet(k.system, k.planet);
      return "<li><a href=\"#\" data-planet=\"" + esc(p.id) + "\" class=\"" + (p === ak ? "aktiv" : "") + "\"" + (p === ak ? " aria-current=\"true\"" : "") + ">" + planetBild(bild, "") +
        "<span><b>" + esc(i === 0 ? zustand.heimat.name : p.name || "Kolonie") + schildSymbol(p) + "</b><small>[" + W.koordinatenText(k) + "]" + (i === 0 ? " · Heimat" : "") + "</small></span></a></li>";
    }).join("") + "</ul>";
  }
  function schildSymbol(p) { return SS.kern.bergung.schildStatus(p, jetzt()).aktiv ? " <img class=\"schild-symbol\" src=\"assets/icons/schild.svg\" alt=\"Schild\" title=\"Angriffsschild aktiv\" width=\"14\" height=\"14\">" : ""; }
  /** 0.20.0 (Sandro t52u): Angriffsschild je eigenem Planeten in der Übersicht. */
  function schildBox() {
    var t = jetzt(), BG = SS.kern.bergung, S = B.SCHILD;
    return box("Angriffsschild", "<p class=\"hinweis\">Bonusgegenstand (vorerst frei): wehrt " + S.DAUER_H + " Std. lang jeden Angriff auf den Planeten ohne Kampf ab (keine Verluste, keine Beute). Kosten " + F.zahl(S.KOSTEN_ROHOEL) + " Rohöl, danach " + S.ABKLING_H + " Std. Abklingzeit. Ein eigener Angriff von diesem Planeten beendet den Schild. <span class=\"annahme-marke\">Annahme</span></p>" +
      "<ul class=\"schild-liste\" id=\"schild-liste\">" + zustand.planeten.map(function (p, i) {
        var st = BG.schildStatus(p, t), pr = BG.schildPruefe(zustand, p, t), k = planetKoord(p);
        return "<li data-planet=\"" + esc(p.id) + "\"" + (st.aktiv ? " class=\"aktiv\"" : "") + ">" + planetBild(W.planet(k.system, k.planet), "") + "<span><b>" + esc(i === 0 ? zustand.heimat.name : p.name || "Kolonie") + schildSymbol(p) + "</b><small>[" + W.koordinatenText(k) + "] · " +
          (st.aktiv ? "aktiv noch " + F.dauer(st.rest) : st.abklingen ? "lädt nach: " + F.dauer(st.rest) : "aus") + "</small></span>" +
          (st.aktiv ? "" : "<button type=\"button\" class=\"knopf klein\" data-aktion=\"schild-an\" data-id=\"" + esc(p.id) + "\"" + (pr.ok ? "" : " disabled title=\"" + esc(pr.grund) + "\"") + ">🛡 Aktivieren" + (pr.kosten ? " (" + F.zahl(pr.kosten) + " Rohöl)" : "") + "</button>") + "</li>";
      }).join("") + "</ul>", "", " id=\"schild-box\"");
  }
  function planetKoord(p) { return SS.kern.flotte.herkunftKoord(zustand, p); }
  function aktivInfo() { var p = hp(), k = planetKoord(p); return { sektor: k.sektor, system: k.system, planet: k.planet, name: p === zustand.planeten[0] ? zustand.heimat.name : (p.name || "Kolonie") }; }
  function wechslePlanet(id) {
    if (!zustand.planeten.some(function (p) { return p.id === id; })) return;
    zustand.aktiverPlanet = id; speichern(true); bauePlanetenListe(); route(true);
  }

  function oeffneMenue() { $("menue").classList.add("offen"); $("menue-schleier").hidden = false; $("knopf-menue-auf").setAttribute("aria-expanded", "true"); }
  function schliesseMenue() { $("menue").classList.remove("offen"); $("menue-schleier").hidden = true; $("knopf-menue-auf").setAttribute("aria-expanded", "false"); }

  // ---------- Navigation ----------
  function route(scrollBehalten) {
    if (!zustand) return;
    var teile = location.hash.replace(/^#/, "").split("/").filter(Boolean);
    var id = teile[0] && D.menuePunkt(teile[0]) ? teile[0] : "uebersicht";
    seite = { id: id, teile: teile.slice(1) };
    bauePlanetenListe(); // 0.18.0: neue Kolonien sofort sichtbar
    Array.prototype.forEach.call(document.querySelectorAll("#menue-liste a"), function (a) {
      var aktiv = a.getAttribute("data-seite") === id;
      a.classList.toggle("aktiv", aktiv);
      if (aktiv) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    var m = D.menuePunkt(id);
    var html = id === "uebersicht" ? seiteUebersicht() : id === "ressourcen" ? seiteRessourcen() :
      id === "anlagen" ? (seite.teile[0] === "raumflughafen" ? seiteRaumflughafen() : seiteAnlagen()) :
      id === "forschung" ? seiteForschung() : id === "werft" ? WU().seite() : id === "verteidigung" ? VU().seite() : id === "flotte" ? FU().seite() : id === "weltraum" ? WRU().seite() : seitePlatzhalter(m);
    var y = window.scrollY, zu = {};
    Array.prototype.forEach.call(document.querySelectorAll("#inhalt details[id]"), function (d) { zu[d.id] = !d.open; });
    schliesseInfo();
    $("inhalt").innerHTML = "<h1 class=\"seiten-titel\">" + m.name + "</h1>" + html;
    $("inhalt").setAttribute("data-seite", id);
    $("inhalt").setAttribute("data-unterseite", seite.teile[0] || "");
    document.title = m.name + " – Sternenspiel";
    if (!scrollBehalten) schliesseMenue();
    baueFlottenLeiste();
    Object.keys(zu).forEach(function (k) { var d = $(k); if (d && zu[k]) d.open = false; });
    if (id === "flotte") { flottenDeeplink(seite.teile); FU().aktualisiereSenden(document); }
    aktualisiereLive();
    window.scrollTo(0, scrollBehalten ? y : 0);
    if (id === "flotte" && seite.teile[0] === "senden" && !scrollBehalten && $("senden") && $("senden").scrollIntoView) $("senden").scrollIntoView();
  }

  // Werft-Seite (js/ui/seite-werft.js) – bekommt die gemeinsamen Helfer
  var werftUi = null;
  function WU() {
    return werftUi || (werftUi = SS.ui.werft({ esc: esc, box: box, kostenHtml: kostenHtml, infoKnopf: infoKnopf,
      zustand: function () { return zustand; }, hp: hp }));
  }
  var flotteUi = null;
  function FU() {
    return flotteUi || (flotteUi = SS.ui.flotte({ esc: esc, box: box, zustand: function () { return zustand; }, hp: hp, teile: function () { return seite ? seite.teile : []; } }));
  }
  function baueFlottenLeiste() { var l = $("flotten-leiste"); if (l && zustand) l.innerHTML = FU().leiste(); }
  // Kapitel 6: Flotten-Aktionen
  /** Sendeformular im Flottenfenster angefasst? Dann beim Tick nicht neu aufbauen (Eingaben bleiben). */
  function sendeFormularBenutzt() {
    var k = $("send-koord"); if (k && k.value) return true;
    return Array.prototype.some.call(document.querySelectorAll("#inhalt input[data-send-menge], #inhalt input[data-send-ladung]"), function (i) { return Number(i.value) > 0; });
  }
  function sendeFeld(fn) { Array.prototype.forEach.call(document.querySelectorAll("#inhalt input[data-send-menge]"), fn); FU().aktualisiereSenden(document); }
  function sendMax(b) {
    var id = b.getAttribute("data-id"), inp = document.querySelector("#inhalt input[data-send-menge=\"" + id + "\"]"); if (!inp) return;
    var andere = 0; sendeFeld(function (i) { if (i !== inp) andere += Math.floor(Number(i.value) || 0); });
    inp.value = Math.max(0, Math.min(Number(inp.max), SS.kern.flotte.frei(zustand, hp()) - andere)); FU().aktualisiereSenden(document);
  }
  function sendAlle() {
    var rest = SS.kern.flotte.frei(zustand, hp());
    sendeFeld(function (i) { var n = Math.min(Number(i.max), rest); i.value = n; rest -= n; });
  }
  function sendFavorit() {
    var a = FU().formular(document);
    if (!a.ziel) { meldung("Erst gültige Koordinaten eingeben (S:SYS:P).", "schlecht"); return; }
    if (SS.kern.flotte.favoritHinzu(zustand, a.ziel)) { meldung("Favorit gespeichert: " + D.weltraum.koordinatenText(a.ziel), "gut"); speichern(true); var k = a.koordText, m = $("send-mission").value, werte = {};
      Array.prototype.forEach.call(document.querySelectorAll("#inhalt input[data-send-menge]"), function (i) { werte[i.getAttribute("data-send-menge")] = i.value; });
      route(true); $("send-koord").value = k; $("send-ziel").value = D.weltraum.koordinatenText(a.ziel); $("send-mission").value = m;
      Array.prototype.forEach.call(document.querySelectorAll("#inhalt input[data-send-menge]"), function (i) { i.value = werte[i.getAttribute("data-send-menge")] || 0; });
      FU().aktualisiereSenden(document);
    } else meldung("Schon als Favorit gespeichert.", "");
  }
  function sendLos() {
    P.tick(zustand, jetzt());
    var a = FU().formular(document), r = SS.kern.flotte.senden(zustand, hp(), a, jetzt());
    if (!r.ok) { meldung(r.grund, "schlecht"); FU().aktualisiereSenden(document); return; }
    meldung(F.zahl(r.anzahl) + " Schiffe unterwegs: " + r.mission.name + " → " + D.weltraum.koordinatenText(r.ziel) + (r.dauer ? " (Ankunft in " + F.dauer(r.dauer) + ")." : " (Master: Ankunft sofort)."), "gut");
    if (r.meldungen && r.meldungen.length) meldeFertig(r.meldungen);
    speichern(true); if (location.hash === "#flotte") route(false); else location.hash = "#flotte";
  }
  // 0.16.0 Weltraum (Sandro pt40u)
  var weltraumUi = null;
  function WRU() { return weltraumUi || (weltraumUi = SS.ui.weltraum({ esc: esc, box: box, zustand: function () { return zustand; }, hp: hp, teile: function () { return seite ? seite.teile : []; } })); }
  /** #flotte/senden/<mission>/<S:SYS:P>[/hinweis]: Mission + Koordinaten vorausfüllen. */
  function flottenDeeplink(t) {
    if (t[0] !== "senden" || !t[1] || !SS.kern.flotte.missionNachId(t[1])) return;
    var m = $("send-mission"), k = $("send-koord"), sel = $("send-ziel");
    if (m) m.value = t[1];
    if (k && t[2]) { k.value = decodeURIComponent(t[2]); if (sel) { sel.value = k.value; if (sel.value !== k.value) sel.value = ""; } }
    // 0.20.0: Bergung – nur passende Sammler vorauswählen (max)
    var typ = t[1] === "sammeln" ? "wracksammler" : t[1] === "bodensammlung" ? "bodensammler" : null;
    if (typ) { Array.prototype.forEach.call(document.querySelectorAll("#inhalt input[data-send-menge]"), function (i) { i.value = i.getAttribute("data-send-menge") === typ ? (hp().schiffe[typ] || 0) : 0; }); FU().aktualisiereSenden(document); }
    if (t[3] === "keine-sonde" && $("send-grund")) meldung("Keine Spionagesonde verfügbar – Mission + Ziel sind vorausgefüllt.", "schlecht");
  }
  /** Spionage aus dem Weltraum: wie OGame sofort 1 Spionagesonde losschicken; sonst Flottenfenster mit Hinweis. */
  function spionageSchnell(koord) {
    P.tick(zustand, jetzt());
    var ziel = D.weltraum.leseKoordinaten(koord), a = { schiffe: { spionagesonde: 1 }, ziel: ziel, mission: "spionieren", ladung: {} };
    var r = (hp().schiffe.spionagesonde || 0) > 0 ? SS.kern.flotte.senden(zustand, hp(), a, jetzt()) : { ok: false, grund: "keine-sonde" };
    if (!r.ok) {
      if (r.grund !== "keine-sonde") meldung(r.grund, "schlecht");
      location.hash = SS.ui.weltraum.link("spionieren", koord) + (r.grund === "keine-sonde" ? "/keine-sonde" : ""); return;
    }
    meldung("Spionagesonde unterwegs → " + koord + (r.dauer ? " (Ankunft in " + F.dauer(r.dauer) + ")." : " (Master: Ankunft sofort)."), "gut");
    if (r.meldungen && r.meldungen.length) meldeFertig(r.meldungen);
    speichern(true); location.hash = SS.ui.weltraum.link("spionieren", koord);
  }
  var vertUi = null;
  function VU() {
    return vertUi || (vertUi = SS.ui.verteidigung({ esc: esc, box: box, kostenHtml: kostenHtml, infoKnopf: infoKnopf,
      zustand: function () { return zustand; }, hp: hp }));
  }
  function box(titel, inhalt, rechts, extra) {
    return "<section class=\"box\"" + (extra || "") + "><div class=\"box-kopf\"><span>" + titel + "</span>" + (rechts || "") + "</div><div class=\"box-inhalt\">" + inhalt + "</div></section>";
  }
  function brotkrumen(teile) {
    return "<nav class=\"brotkrumen\" aria-label=\"Pfad\">" + teile.map(function (t, i) {
      return (i ? "<span class=\"trenner\">›</span>" : "") + (t.href ? "<a href=\"" + t.href + "\">" + t.text + "</a>" : "<span>" + t.text + "</span>");
    }).join("") + "</nav>";
  }
  function hp() { var a = zustand.aktiverPlanet; return (a && zustand.planeten.filter(function (p) { return p.id === a; })[0]) || zustand.planeten[0]; }
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
    var h = aktivInfo(), pl = W.planet(h.system, h.planet), sys = W.system(h.system);
    var planetBox = box(hp() === zustand.planeten[0] ? "Hauptplanet" : "Kolonie",
      "<div class=\"planet-karte\">" + planetBild(pl, "planet-bild") + "<dl class=\"werte\">" +
      "<dt>Planet</dt><dd id=\"uebersicht-planet\">" + esc(h.name) + schildSymbol(hp()) + "</dd>" +
      "<dt>Koordinaten</dt><dd><span class=\"koord\" id=\"uebersicht-koordinaten\" title=\"Sektor:System:Planet\">[" + W.koordinatenText(h) + "]</span></dd>" +
      "<dt>Sektor</dt><dd>" + W.sektor(h.sektor).name + "</dd>" +
      "<dt>System</dt><dd>" + h.system + "</dd>" +
      "<dt>Position</dt><dd>" + h.planet + " von " + B.WELTRAUM.PLANETEN_PRO_SYSTEM + "</dd>" +
      "</dl></div>");
    var kommandant = box("Kommandant",
      "<div class=\"punkte-gross\"><span>Punkte</span><b id=\"uebersicht-punkte\" data-live=\"punkte\"></b></div>" +
      "<dl class=\"werte\"><dt>Name</dt><dd>" + esc(zustand.name) + "</dd>" +
      "<dt>Universum</dt><dd>" + W.universum().name + "</dd>" +
      "<dt>Spiel seit</dt><dd>" + F.uhrzeit(zustand.erstelltAm) + "</dd>" +
      "<dt>Offline erhalten</dt><dd data-live=\"offline\"></dd></dl>");
    var spielstand = box("Spielstand",
      "<p class=\"hinweis\" data-live=\"speicherinfo\"></p><div class=\"knopf-reihe\">" +
      "<button class=\"knopf primaer\" data-aktion=\"speichern\">Speichern</button>" +
      "<button class=\"knopf\" data-aktion=\"laden\">Laden</button>" +
      "<button class=\"knopf\" data-aktion=\"wechseln\">Spieler wechseln</button>" +
      "<button class=\"knopf gefahr\" data-aktion=\"zuruecksetzen\">Zurücksetzen</button>" +
      "<button class=\"knopf gefahr\" data-aktion=\"neues-spiel-alles\">Neues Spiel (alles löschen)</button></div>" +
      "<p class=\"hinweis\">Zurücksetzen betrifft nur diesen Spieler. „Neues Spiel“ löscht alle Spieler in diesem Browser.</p>");
    var rohoel = box("Rohölvorkommen",
      "<dl class=\"werte\"><dt>Vorkommen</dt><dd><b id=\"uebersicht-vorkommen\" data-live=\"vorkommen\"></b> Rohöl</dd>" +
      "<dt>Förderung</dt><dd data-live=\"foerderung\"></dd>" +
      "<dt>Reicht noch</dt><dd data-live=\"reichweite\"></dd>" +
      "<dt>Nächster Fund in</dt><dd data-live=\"geo-countdown\"></dd></dl>" +
      "<p class=\"hinweis\">Die Bohrstation fördert aus dem Vorkommen; die Geologiestation findet alle 24 Std. ein neues Feld.</p>", "", " id=\"rohoel-box\"");
    return planetBox + "<div class=\"zwei-spalten\">" + kommandant + bauBox() + "</div><div class=\"zwei-spalten\">" + forschungBox() + WU().auftragBox(false) + "</div><div class=\"zwei-spalten\">" + VU().auftragBox(false) + rohoel + "</div>" + schildBox() + spielstand;
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
    var rohstoffe = box("Rohstoffe – Produktion auf " + esc(aktivInfo().name) + " (Lager gemeinsam)",
      "<div class=\"tabelle-huelle\"><table class=\"tabelle\" id=\"rohstoff-tabelle\"><thead><tr><th>Rohstoff</th><th class=\"z\">Bestand</th><th class=\"z eng-weg\">Produktion/h</th><th class=\"z eng-weg\">Verbrauch/h</th><th class=\"z\">Netto/h</th></tr></thead>" +
      "<tbody>" + zeilen + "</tbody></table></div>" +
      "<p class=\"hinweis\">Lager unbegrenzt (keine Speichergebäude). Grundproduktion Hauptplanet: Metall " + B.GRUNDPRODUKTION_HAUPTPLANET.metall + ", Silizium " + B.GRUNDPRODUKTION_HAUPTPLANET.silizium + " pro Std. <span class=\"annahme-marke\">Annahme</span></p>" +
      "<p class=\"hinweis\">Rohölvorkommen des Planeten: <b data-live=\"vorkommen\"></b> · Förderung <span data-live=\"foerderung\"></span></p>");
    var energie = box("Energiebilanz",
      "<dl class=\"werte\"><dt>Erzeugung</dt><dd data-live=\"strom-erzeugung\"></dd><dt>Bedarf</dt><dd data-live=\"strom-bedarf\"></dd>" +
      "<dt>Bilanz</dt><dd data-live=\"strom-bilanz\"></dd><dt>Produktionsfaktor</dt><dd data-live=\"strom-faktor\"></dd>" +
      "<dt>Energie-Technologie</dt><dd id=\"energie-technik\">Stufe " + FO.stufe(zustand, "energie") + " · +" + F.zahl(FO.bonus(zustand, "energie")) + " % Stromerzeugung</dd></dl>" +
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
    if (d.stromErzeugt) T.push("+" + zahlFein(wa(d.stromErzeugt, n) * FO.energieFaktor(zustand)) + " Strom");
    if (d.verbrauch) T.push("−" + zahlFein(wa(d.verbrauch.rohoel, n)) + " Rohöl/h");
    if (d.stromBedarf) T.push("−" + zahlFein(wa(d.stromBedarf, n)) + " Strom");
    if (d.fund) { if (n > 0) { var fb = SS.kern.geologie.fundBereich(n); T.push("Fund " + F.zahl(fb[0]) + "–" + F.zahl(fb[1]) + " Rohöl / 24 Std."); } else T.push("keine Funde"); }
    if (d.forschungszeit) T.push("Forschungszeit ×" + F.rate(Math.round(100 / (1 + n)) / 100));
    if (d.id === "raumflughafen") T.push(n > 0 ? "Startplätze verfügbar" : "keine Startplätze");
    if (d.id === "werft" || d.id === "verteidigungswerft") T.push("Bauzeit ÷ (1 + Stufe)");
    return T.join(" · ") || "–";
  }

  /** „ / 1“ bei begrenzten Gebäuden, sonst nichts (keine Obergrenze, FEST 0.8.0). */
  function maxText(max) { return isFinite(max) ? " / " + max : ""; }
  function infoKnopf(art, id, name) {
    return "<button class=\"info-knopf\" type=\"button\" data-info=\"" + art + ":" + id + "\" aria-label=\"Info zu " + esc(name) + "\" title=\"Info\">i</button>";
  }
  function fundLog(p) {
    var f = p.geologie.funde.slice().sort(function (x, y) { return y.zeit - x.zeit; }); // neuester oben
    var zeilen = f.map(function (x) {
      return "<tr><td>" + F.uhrzeit(x.zeit) + (x.test ? " <span class=\"master-marke\">Test</span>" : "") + "</td><td class=\"z\">" + x.stufe + "</td><td class=\"z\">+" + F.zahl(x.menge) + "</td></tr>";
    }).join("");
    return "<details class=\"fund-log\" id=\"fund-log\"" + (uiZustand.fundLogOffen ? " open" : "") + "><summary>Fund-Log (" + f.length + (f.length === 1 ? " Fund" : " Funde") + ")</summary>" +
      "<p class=\"hinweis\">Nächster Fund in: <b data-live=\"geo-countdown\"></b></p>" +
      (f.length ? "<div class=\"tabelle-huelle\"><table class=\"tabelle\"><thead><tr><th>Datum / Uhrzeit</th><th class=\"z\">Stufe</th><th class=\"z\">Menge</th></tr></thead><tbody>" + zeilen + "</tbody></table></div>"
        : "<p class=\"hinweis\">Noch keine Funde.</p>") + "</details>";
  }
  function anlageKachel(d) {
    var p = hp(), n = p.gebaeude[d.id] || 0, max = D.maxStufe(d), a = p.bauauftrag, Bau = SS.kern.bau, zl = Bau.ziel(zustand, p, { art: "gebaeude", id: d.id });
    var laeuft = a && a.art === "gebaeude" && a.id === d.id, master = Bau.istMaster(zustand), sperre = Bau.gebaeudeSperre(zustand, d);
    var extra = "";
    if (d.id === "geologiestation") {
      extra = "<p class=\"extra\">Rohölvorkommen: <b data-live=\"vorkommen\"></b> · nächster Fund in <b data-live=\"geo-countdown\"></b></p>" + fundLog(p) +
        (master ? "<div class=\"knopf-reihe\"><button class=\"knopf klein master-aktion\" type=\"button\" data-aktion=\"fund-test\"" + (n > 0 ? "" : " disabled title=\"Zuerst die Geologiestation bauen\"") + ">Fund sofort auslösen</button></div>" : "");
    }
    if (d.id === "raumflughafen") extra = "<p class=\"extra\">Startplätze: <b>" + p.startplaetze.filter(function (s) { return s.stufe > 0; }).length + "/" + B.STARTPLAETZE.MAX_ANZAHL + "</b> gebaut · Kapazität <b data-live=\"kapazitaet\"></b> Schiffe</p><a class=\"knopf klein\" href=\"#anlagen/raumflughafen\" id=\"knopf-startplaetze\">Startplätze verwalten</a>";
    if (d.id === "bohrstation") extra = "<p class=\"extra\">Vorkommen: <b data-live=\"vorkommen\"></b> · reicht noch <span data-live=\"reichweite\"></span></p>";
    var unten = n >= max ? "<p class=\"hinweis max\">Höchststufe erreicht.</p>" :
      "<dl class=\"anlage-werte\"><dt>Kosten Stufe " + zl.stufe + "</dt><dd>" + kostenHtml(zl.kosten) + (master ? " <span class=\"master-marke\">kostenlos</span>" : "") + "</dd>" +
      "<dt>Bauzeit</dt><dd>" + (master ? "sofort <span class=\"master-marke\">Master</span>" : F.dauer(zl.bauzeit)) + "</dd>" +
      "<dt>Aktuell</dt><dd>" + wirkungText(d, n) + "</dd>" +
      "<dt>Stufe " + zl.stufe + "</dt><dd>" + wirkungText(d, zl.stufe) + "</dd></dl>" +
      (laeuft ? bauFortschritt(a) : bauKnopf({ art: "gebaeude", id: d.id }, master ? "Sofort " + (n === 0 ? "bauen" : "auf " + zl.stufe) : (n === 0 ? "Bauen" : "Ausbauen auf " + zl.stufe)));
    return "<article class=\"anlage" + (laeuft ? " im-bau" : "") + (n === 0 ? " stufe-0" : "") + (sperre ? " gesperrt" : "") + "\" data-gebaeude=\"" + d.id + "\">" +
      "<div class=\"anlage-kopf\"><img class=\"anlage-bild\" src=\"" + d.bild + "\" alt=\"\" width=\"72\" height=\"72\"><div class=\"anlage-titel\"><h3>" + d.name + " " + infoKnopf("gebaeude", d.id, d.name) + "</h3><span class=\"stufe\">Stufe <b>" + n + "</b>" + maxText(max) + "</span>" +
      (sperre ? "<span class=\"sperr-marke\">🔒 Gesperrt</span>" : "") + "</div></div>" +
      "<p class=\"beschreibung\">" + esc(d.beschreibung) + "</p>" + extra + unten + "</article>";
  }
  function satellitKachel() {
    var s = D.solarsatellit, p = hp(), e = zahlFein(B.SOLARSATELLIT_ENERGIE * FO.energieFaktor(zustand));
    return "<article class=\"anlage\" data-gebaeude=\"solarsatellit\"><div class=\"anlage-kopf\"><img class=\"anlage-bild\" src=\"" + s.bild + "\" alt=\"\" width=\"72\" height=\"72\"><div><h3>" + s.name + "</h3><span class=\"stufe\">Anzahl <b>" + p.solarsatelliten + "</b></span></div></div>" +
      "<p class=\"beschreibung\">" + esc(s.beschreibung) + "</p>" +
      "<dl class=\"anlage-werte\"><dt>Energie je Satellit</dt><dd>" + e + " Strom <span class=\"annahme-marke\">Annahme</span></dd><dt>Gesamt</dt><dd data-live=\"gs:solarsatellit\"></dd><dt>Regler</dt><dd>" + p.regler.solarsatellit + " % (Seite Ressourcen)</dd></dl>" +
      "<p class=\"hinweis\">Gebaut wird in der <a href=\"#werft\">Werft</a> (Stufe 1, je Satellit 2.000 Silizium + 500 Rohöl).</p></article>";
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
    var p = hp(), K = B.STARTPLAETZE, Bau = SS.kern.bau, a = p.bauauftrag, master = Bau.istMaster(zustand);
    var kopf = brotkrumen([{ text: "Anlagen", href: "#anlagen" }, { text: "Raumflughafen" }]);
    if (!(p.gebaeude.raumflughafen > 0)) {
      return kopf + box("Raumflughafen", "<p>Der Raumflughafen ist noch nicht errichtet. Erst danach können Startplätze gebaut werden.</p>") +
        "<div class=\"anlagen-raster einzeln\">" + anlageKachel(D.gebaeudeNachId("raumflughafen")) + "</div>";
    }
    var regeln = D.startplatzRegeln.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("");
    var naechster = p.startplaetze.filter(function (sp) { return sp.stufe === 0; })[0];
    var naechsterText = naechster ? (function () { var st = Bau.startplatzStatus(zustand, p, naechster.buchstabe); return "Startplatz " + naechster.buchstabe + ": " + (st.frei ? "baubar" : esc(st.grund)); })() : "alle Startplätze gebaut";
    var info = box("Startplätze",
      "<div class=\"punkte-gross\"><span>Gesamtkapazität</span><b id=\"gesamtkapazitaet\" data-live=\"kapazitaet\"></b><small>Schiffe gleichzeitig</small></div>" +
      "<dl class=\"werte\"><dt>Gebaut</dt><dd>" + p.startplaetze.filter(function (s) { return s.stufe > 0; }).length + " / " + K.MAX_ANZAHL + "</dd>" +
      "<dt>Punkte</dt><dd data-live=\"punkte\"></dd><dt>Als Nächstes</dt><dd>" + naechsterText + "</dd></dl>" +
      "<details class=\"regeln-box\"><summary>Regeln</summary><ul class=\"regeln\">" + regeln + "</ul></details>", "", " id=\"startplaetze-info\"");
    var karten = p.startplaetze.map(function (sp) {
      var st = Bau.startplatzStatus(zustand, p, sp.buchstabe), zl = Bau.ziel(zustand, p, { art: "startplatz", buchstabe: sp.buchstabe });
      var laeuft = a && a.art === "startplatz" && a.buchstabe === sp.buchstabe, kap = Bau.kapazitaetBuchstabe(sp.buchstabe, sp.stufe);
      var inhalt;
      if (!st.frei && sp.stufe === 0) inhalt = "<p class=\"gesperrt\">🔒 " + esc(st.grund) + "</p>";
      else if (sp.stufe >= K.STUFE_MAX) inhalt = "<p class=\"hinweis max\">Höchststufe · " + F.zahl(kap) + " Schiffe</p>";
      else inhalt = "<dl class=\"anlage-werte\"><dt>Kosten</dt><dd>" + kostenHtml(zl.kosten) + "</dd><dt>Bauzeit</dt><dd>" + (master ? "sofort" : F.dauer(zl.bauzeit)) + "</dd>" +
        "<dt>Kapazität</dt><dd>" + F.zahl(kap) + " → " + F.zahl(Bau.kapazitaetBuchstabe(sp.buchstabe, zl.stufe)) + "</dd></dl>" +
        (laeuft ? bauFortschritt(a) : bauKnopf({ art: "startplatz", buchstabe: sp.buchstabe }, (master ? "Sofort auf " : sp.stufe === 0 ? "Bauen → " : "Ausbauen → ") + zl.stufe));
      return "<article class=\"startplatz-karte" + (st.frei ? " frei" : " gesperrt") + (sp.stufe > 0 ? " gebaut" : "") + "\" data-buchstabe=\"" + sp.buchstabe + "\">" +
        "<div class=\"startplatz-kopf\"><b class=\"buchstabe\">" + sp.buchstabe + "</b><span>Stufe <b>" + sp.stufe + "</b>/" + K.STUFE_MAX + "</span>" + infoKnopf("startplatz", sp.buchstabe, "Startplatz " + sp.buchstabe) + "</div>" + inhalt + "</article>";
    }).join("");
    return kopf + "<div class=\"zwei-spalten\">" + info + bauBox() + "</div>" + box("Startplätze A–Z", "<div class=\"startplatz-raster\">" + karten + "</div>", "", " id=\"startplatz-liste\"");
  }

  // ---------- Forschung (Kapitel 3) ----------
  var FO = SS.kern.forschung;
  function forschungFortschritt(a) {
    return "<div class=\"bau-laufend\"><div class=\"bau-zeile\"><b>" + esc(a.name) + " → Stufe " + a.stufe + "</b><span data-live=\"forschung-rest\"></span></div>" +
      "<div class=\"balken\"><div class=\"balken-fuellung forschung\" data-live=\"forschung-balken\"></div></div>" +
      "<div class=\"knopf-reihe\"><span class=\"hinweis\">Fertig: " + F.uhrzeit(a.ende) + "</span><button class=\"knopf klein gefahr\" type=\"button\" data-aktion=\"forschung-abbrechen\">Abbrechen</button></div></div>";
  }
  function forschungBox() {
    var a = zustand.forschungsauftrag, ohne = !(hp().gebaeude.forschungseinrichtung > 0);
    return box("Forschung", a ? forschungFortschritt(a) :
      "<p class=\"hinweis\">" + (ohne ? "Noch keine Forschungseinrichtung – zuerst unter Anlagen bauen." : "Keine laufende Forschung. Es läuft immer nur eine Forschung gleichzeitig – unabhängig vom Bauauftrag.") + "</p>" +
      (seite && seite.id === "forschung" ? "" : "<a class=\"knopf klein\" href=\"" + (ohne ? "#anlagen" : "#forschung") + "\">" + (ohne ? "Forschungseinrichtung bauen" : "Zur Forschung") + "</a>"), "", " id=\"forschung-box\"");
  }
  function vorListe(f) {
    var vs = FO.voraussetzungen(zustand, f);
    if (!vs.length) return "<p class=\"vor-liste\"><span class=\"vor ok\">keine Voraussetzungen</span></p>";
    return "<p class=\"vor-liste\"><span class=\"vor-titel\">Voraussetzungen:</span> " + vs.map(function (gr) {
      return "<span class=\"vor-gruppe\">" + gr.alternativen.map(function (x) {
        return "<span class=\"vor " + (x.ok ? "ok" : "fehlt") + "\" title=\"aktuell Stufe " + x.ist + "\">" + (x.ok ? "✔ " : "✘ ") + esc(x.name) + " " + x.stufe + "</span>";
      }).join(" <em>oder</em> ") + "</span>";
    }).join(" ") + "</p>";
  }
  function wirkungZeile(f, n) {
    var w = FO.wirkung(f.id, n);
    return esc(w.text) + (f.wirkung.aktiv ? " <span class=\"wirkt-marke\">wirkt jetzt</span>" : " <span class=\"spaeter-marke\">ab späterem Kapitel</span>");
  }
  function forschungKachel(f) {
    var n = FO.stufe(zustand, f.id), a = zustand.forschungsauftrag, laeuft = a && a.id === f.id, master = FO.istMaster(zustand), zl = FO.ziel(zustand, f.id);
    var vorOk = FO.voraussetzungenOk(zustand, f);
    return "<article class=\"anlage forschung-kachel" + (laeuft ? " im-bau" : "") + (n === 0 ? " stufe-0" : "") + (!vorOk ? " gesperrt" : "") + "\" data-forschung=\"" + f.id + "\">" +
      "<div class=\"anlage-kopf\"><img class=\"anlage-bild\" src=\"" + f.bild + "\" alt=\"\" width=\"72\" height=\"72\"><div class=\"anlage-titel\"><h3>" + f.name + " " + infoKnopf("forschung", f.id, f.name) + "</h3><span class=\"stufe\">Stufe <b>" + n + "</b></span>" +
      (!vorOk ? "<span class=\"sperr-marke\">🔒 Voraussetzung fehlt" + (master ? " (Master)" : "") + "</span>" : "") + "</div></div>" +
      "<p class=\"beschreibung\">" + esc(f.beschreibung) + "</p>" + vorListe(f) +
      "<dl class=\"anlage-werte\"><dt>Kosten Stufe " + zl.stufe + "</dt><dd>" + kostenHtml(zl.kosten) + (master ? " <span class=\"master-marke\">kostenlos</span>" : "") + "</dd>" +
      "<dt>Dauer</dt><dd>" + (master ? "sofort <span class=\"master-marke\">Master</span>" : F.dauer(zl.dauer)) + "</dd>" +
      "<dt>Aktuell</dt><dd>" + wirkungZeile(f, n) + "</dd>" +
      "<dt>Stufe " + zl.stufe + "</dt><dd>" + esc(FO.wirkung(f.id, zl.stufe).text) + "</dd></dl>" +
      (laeuft ? forschungFortschritt(a) : "<div class=\"bau-aktion\"><button class=\"knopf primaer\" type=\"button\" data-aktion=\"forschen\" data-id=\"" + f.id + "\">" + (master ? "Sofort erforschen → " : "Forschen → Stufe ") + zl.stufe + "</button><span class=\"grund hinweis\"></span></div>") +
      "</article>";
  }
  function seiteForschung() {
    var p = hp(), stE = p.gebaeude.forschungseinrichtung || 0, master = FO.istMaster(zustand);
    var einrichtung = box("Forschungseinrichtung", stE > 0 ?
      "<dl class=\"werte\"><dt>Stufe</dt><dd id=\"forschung-einrichtung-stufe\">" + stE + "</dd><dt>Forschungszeit</dt><dd>÷ " + (1 + FO.einrichtungStufe(zustand)) + " (1 + Stufe)</dd>" +
      "<dt>Erforschte Stufen</dt><dd>" + D.forschungIds.reduce(function (s, id) { return s + FO.stufe(zustand, id); }, 0) + "</dd><dt>Punkte</dt><dd data-live=\"punkte\"></dd></dl>" +
      "<p class=\"hinweis\">Roboterforschung verkürzt Bauzeiten, nicht die Forschung. Während einer Forschung kann die Einrichtung nicht ausgebaut werden.</p>"
      : "<p class=\"forschung-fehlt\" id=\"forschung-hinweis\"><b>Forschungseinrichtung bauen</b> – alle Forschungen finden in der Forschungseinrichtung statt (Stufe 1 nötig).</p>" +
      "<a class=\"knopf primaer\" href=\"#anlagen\" id=\"knopf-zur-einrichtung\">Zu den Anlagen</a>", "", " id=\"einrichtung-box\"");
    var ausgeblendet = 0;
    var gruppen = D.forschungGruppen.map(function (gr) {
      var liste = D.forschung.filter(function (f) { return f.gruppe === gr.id; });
      var sicht = liste.filter(function (f) { return FO.sichtbar(zustand, f); });
      ausgeblendet += liste.length - sicht.length;
      if (!sicht.length) return "";
      return box(gr.name, "<div class=\"anlagen-raster\">" + sicht.map(forschungKachel).join("") + "</div>", "<span class=\"box-zahl\">" + sicht.length + "/" + liste.length + "</span>", " data-gruppe=\"" + gr.id + "\"");
    }).join("");
    var hinweis = ausgeblendet ? "<p class=\"hinweis\" id=\"forschung-ausgeblendet\">" + ausgeblendet + " weitere Forschung" + (ausgeblendet === 1 ? " ist" : "en sind") + " noch ausgeblendet – sie erscheinen, sobald mindestens eine ihrer Voraussetzungen erfüllt ist. <span class=\"annahme-marke\">Annahme</span></p>"
      : (master ? "<p class=\"hinweis\">Master: alle Forschungen sichtbar, Voraussetzungen werden ignoriert.</p>" : "");
    return "<div class=\"zwei-spalten\">" + forschungBox() + einrichtung + "</div>" + hinweis + gruppen;
  }

  // Alle übrigen Menüseiten: nur Titel + neutraler Platzhalter (Inhalt kommt in eigenen Kapiteln)
  function seitePlatzhalter(m) {
    return box(m.name, "<div class=\"platzhalter\"><p class=\"gross\">" + esc(D.PLATZHALTER_TEXT) + "</p></div>");
  }


  // ---------- Info-Fenster (ⓘ) wie bei OGame: Beschreibung + Tabelle der nächsten Stufen ----------
  var info = { knopf: null, angeheftet: false, zu: null };
  var INFO_STUFEN = 5; // aktuelle + nächste 5 Stufen
  function kostenKurz(k) {
    return "<span class=\"kosten-kurz\">" + Object.keys(k).filter(function (id) { return k[id] > 0; }).map(function (id) {
      return "<span title=\"" + rName(id) + "\">" + icon(D.rohstoffNachId(id), "rs-icon mini") + F.kurz(k[id]) + "</span>";
    }).join(" ") + "</span>";
  }
  function diffText(neu, alt, einheit) {
    var d = neu - alt;
    return Math.abs(d) < 1e-9 ? "–" : "<span class=\"" + (d > 0 ? "plus" : "negativ") + "\">" + (d > 0 ? "+" : "−") + zahlFein(Math.abs(d)) + (einheit || "") + "</span>";
  }
  function infoGebaeude(d) {
    var p = hp(), n = p.gebaeude[d.id] || 0, max = D.maxStufe(d), wa = P.wachstum, Bau = SS.kern.bau, master = Bau.istMaster(zustand);
    var spalten = [], werte = [];
    // Spalten je Gebäudetyp: [Titel, Funktion(stufe) → Zahl | Text, Einheit für Differenz]
    if (d.erzeugt) spalten.push({ t: "Ertrag/h", f: function (s) { return wa(d.erzeugt.basis, s); }, diff: "/h" });
    if (d.werk) {
      spalten.push({ t: rName(d.werk.ausgabe) + "/h", f: function (s) { return wa(d.werk.basis, s); }, diff: "/h" });
      spalten.push({ t: "Verbrauch/h", f: function (s) { var e = wa(d.werk.basis, s); return Object.keys(d.werk.input).map(function (id) { return F.kurz(d.werk.input[id] * e) + " " + rName(id); }).join(", ") || "–"; } });
    }
    if (d.stromErzeugt) spalten.push({ t: "Strom", f: function (s) { return wa(d.stromErzeugt, s) * FO.energieFaktor(zustand); }, diff: "" });
    if (d.verbrauch) spalten.push({ t: "Rohöl/h", f: function (s) { return -wa(d.verbrauch.rohoel, s); }, diff: "/h" });
    if (d.stromBedarf) spalten.push({ t: "Strombedarf", f: function (s) { return -wa(d.stromBedarf, s); }, diff: "" });
    if (d.fund) spalten.push({ t: "Fundgröße / 24 Std.", f: function (s) { if (!s) return "–"; var b = SS.kern.geologie.fundBereich(s); return F.zahl(b[0]) + "–" + F.zahl(b[1]); } });
    if (d.forschungszeit) spalten.push({ t: "Forschungszeit", f: function (s) { return "×" + F.rate(Math.round(100 / (1 + s)) / 100); } });
    var kopf = "<tr><th class=\"z\">Stufe</th>" + spalten.map(function (c) { return "<th class=\"z\">" + c.t + "</th>" + (c.diff != null ? "<th class=\"z\">Diff.</th>" : ""); }).join("") + "<th>Kosten</th><th class=\"z\">Bauzeit</th></tr>";
    for (var s = n; s <= Math.min(max, n + INFO_STUFEN); s++) werte.push(s);
    var zeilen = werte.map(function (st) {
      var k = st > 0 ? Bau.gebaeudeKosten(d, st) : null;
      return "<tr" + (st === n ? " class=\"aktuell\"" : "") + "><td class=\"z\">" + st + (st === n ? " <small>aktuell</small>" : "") + "</td>" + spalten.map(function (c) {
        var v = c.f(st), txt = typeof v === "number" ? (v < 0 ? "−" : "") + zahlFein(Math.abs(v)) : v;
        return "<td class=\"z\">" + txt + "</td>" + (c.diff != null ? "<td class=\"z\">" + (st === n ? "–" : diffText(c.f(st), c.f(n), c.diff)) + "</td>" : "");
      }).join("") + "<td>" + (st === n || !k ? "–" : kostenKurz(k)) + "</td><td class=\"z\">" + (st === n || !k ? "–" : master ? "sofort" : F.dauer(Bau.bauzeitMs(k, zustand))) + "</td></tr>";
    }).join("");
    var hinweis = "Werte bei 100 % Leistung und ausreichend Strom; Differenz zur aktuellen Stufe.";
    if (d.fund) hinweis = "Fundgröße zufällig im Bereich der Stufe; Stufe 1–2 fest, ab Stufe 3 je Stufe ×1,25 (Annahme).";
    var sperre = Bau.gebaeudeSperre(zustand, d);
    return { titel: d.name + " · Stufe " + n + maxText(max), text: d.info || d.beschreibung, extra: sperre ? "<p class=\"gesperrt\">🔒 " + esc(sperre) + "</p>" : "", kopf: kopf, zeilen: zeilen, hinweis: hinweis, bild: d.bild };
  }
  function infoStartplatz(b) {
    var p = hp(), Bau = SS.kern.bau, K = B.STARTPLAETZE, n = Bau.startplatzStufe(p, b), master = Bau.istMaster(zustand);
    var gesamt = Bau.kapazitaet(p), alt = Bau.kapazitaetBuchstabe(b, n), st = Bau.startplatzStatus(zustand, p, b);
    var kopf = "<tr><th class=\"z\">Stufe</th><th class=\"z\">Kapazität " + b + "</th><th class=\"z\">Diff.</th><th class=\"z\">Gesamt</th><th>Kosten</th><th class=\"z\">Bauzeit</th></tr>";
    var zeilen = "";
    for (var s = n; s <= Math.min(K.STUFE_MAX, n + INFO_STUFEN); s++) {
      var kap = Bau.kapazitaetBuchstabe(b, s), k = s > 0 ? Bau.startplatzKosten(b, s) : null;
      zeilen += "<tr" + (s === n ? " class=\"aktuell\"" : "") + "><td class=\"z\">" + s + (s === n ? " <small>aktuell</small>" : "") + "</td><td class=\"z\">" + F.zahl(kap) + "</td><td class=\"z\">" + (s === n ? "–" : diffText(kap, alt, "")) +
        "</td><td class=\"z\">" + F.zahl(gesamt - alt + kap) + "</td><td>" + (s === n || !k ? "–" : kostenKurz(k)) + "</td><td class=\"z\">" + (s === n || !k ? "–" : master ? "sofort" : F.dauer(Bau.startplatzBauzeitMs(k, zustand))) + "</td></tr>";
    }
    var i = D.startplatzBuchstaben.indexOf(b);
    var vor = "Voraussetzung: " + (i > 0 ? D.startplatzBuchstaben[i - 1] + " Stufe " + K.VORGAENGER_STUFE + " und " : "") + F.zahl(K.FREISCHALT_PUNKTE[i]) + " Punkte" + (st.frei ? " ✔" : " – " + esc(st.grund || "") + (master ? " (Master ignoriert die Sperre)" : ""));
    return { titel: "Startplatz " + b + " · Stufe " + n + " / " + K.STUFE_MAX, text: "Kapazität = Anzahl Schiffe, die gleichzeitig vom Planeten starten können (Größe egal). Je Stufe +" + F.zahl(K.KAPAZITAET_JE_STUFE[i]) + " Schiffe.",
      extra: "<p class=\"hinweis\">" + vor + "</p>", kopf: kopf, zeilen: zeilen, hinweis: "Gesamt = Kapazität aller Startplätze des Planeten nach diesem Ausbau.", bild: D.gebaeudeNachId("raumflughafen").bild };
  }
  function infoForschung(f) {
    var n = FO.stufe(zustand, f.id), master = FO.istMaster(zustand), w0 = FO.wirkung(f.id, n).wert, zeilen = "";
    var kopf = "<tr><th class=\"z\">Stufe</th><th>Wirkung</th><th class=\"z\">Diff.</th><th>Kosten</th><th class=\"z\">Dauer</th></tr>";
    for (var s = n; s <= n + INFO_STUFEN; s++) {
      var w = FO.wirkung(f.id, s), k = s > 0 ? FO.kosten(f, s) : null, d = w.wert - w0, diff;
      if (s === n || Math.abs(d) < 1e-12) diff = "–";
      else if (f.wirkung.typ === "bauzeit") diff = "<span class=\"plus\">÷ " + (Math.round(w0 / w.wert * 100) / 100).toLocaleString("de-DE") + "</span>";
      else diff = "<span class=\"plus\">+" + F.zahl(d) + (f.wirkung.typ === "prozent" ? " %" : "") + "</span>";
      zeilen += "<tr" + (s === n ? " class=\"aktuell\"" : "") + "><td class=\"z\">" + s + (s === n ? " <small>aktuell</small>" : "") + "</td><td>" + esc(w.text) + "</td><td class=\"z\">" + diff + "</td><td>" +
        (s === n || !k ? "–" : kostenKurz(k)) + "</td><td class=\"z\">" + (s === n || !k ? "–" : master ? "sofort" : F.dauer(FO.dauerMs(zustand, k))) + "</td></tr>";
    }
    var vs = FO.voraussetzungen(zustand, f);
    var vor = vs.length ? "Voraussetzungen: " + vs.map(function (gr) { return gr.alternativen.map(function (x) { return (x.ok ? "✔ " : "✘ ") + esc(x.name) + " " + x.stufe; }).join(" oder "); }).join(", ") : "Keine Voraussetzungen.";
    return { titel: f.name + " · Stufe " + n, text: f.info, extra: "<p class=\"hinweis\">" + vor + (f.wirkung.aktiv ? " · <b>wirkt jetzt</b>" : " · Wirkung wird in einem späteren Kapitel angewendet") + "</p>",
      kopf: kopf, zeilen: zeilen, hinweis: "Dauer mit Forschungseinrichtung Stufe " + (hp().gebaeude.forschungseinrichtung || 0) + " (Zeit ÷ (1 + Stufe)); Roboterforschung wirkt nicht auf Forschung.", bild: f.bild };
  }
  function zeigeInfo(knopf, angeheftet) {
    var teile = (knopf.getAttribute("data-info") || "").split(":"), art = teile[0], id = teile[1], d;
    var inh = art === "startplatz" ? infoStartplatz(id) : art === "forschung" ? (D.forschungNachId(id) ? infoForschung(D.forschungNachId(id)) : null) :
      art === "schiff" ? (D.schiffNachId(id) ? WU().info(D.schiffNachId(id)) : null) : art === "verteidigung" ? (D.verteidigungNachId(id) ? VU().info(D.verteidigungNachId(id)) : null) : (d = D.gebaeudeNachId(id)) ? infoGebaeude(d) : null;
    if (!inh || !zustand) return;
    var f = $("infofenster");
    f.innerHTML = "<div class=\"info-kopf\"><img src=\"" + inh.bild + "\" alt=\"\" width=\"40\" height=\"40\"><h3>" + esc(inh.titel) + "</h3>" +
      "<button class=\"info-zu\" type=\"button\" data-aktion=\"info-zu\" aria-label=\"Schließen\">×</button></div>" +
      "<p class=\"info-text\">" + esc(inh.text) + "</p>" + inh.extra +
      "<div class=\"info-tabelle\"><table class=\"tabelle eng\"><thead>" + inh.kopf + "</thead><tbody>" + inh.zeilen + "</tbody></table></div>" +
      "<p class=\"hinweis\">" + inh.hinweis + "</p>";
    f.classList.toggle("angeheftet", !!angeheftet);
    f.hidden = false;
    if (info.knopf) info.knopf.classList.remove("offen");
    info.knopf = knopf; info.angeheftet = !!angeheftet;
    knopf.classList.add("offen");
    positioniereInfo();
  }
  function positioniereInfo() {
    var f = $("infofenster"), k = info.knopf;
    if (!k || f.hidden) return;
    if (!document.body.contains(k)) { schliesseInfo(); return; }
    var vw = document.documentElement.clientWidth, vh = window.innerHeight, rand = 8;
    f.style.maxWidth = (vw - 2 * rand) + "px";
    f.style.maxHeight = (vh - 2 * rand) + "px";
    f.style.left = "0px"; f.style.top = "0px";
    var r = k.getBoundingClientRect(), w = f.offsetWidth, h = f.offsetHeight;
    var links = Math.min(Math.max(rand, r.left + r.width / 2 - w / 2), vw - w - rand);
    var oben = r.bottom + 6;
    if (oben + h > vh - rand) oben = r.top - h - 6;          // passt nicht darunter → darüber
    if (oben < rand) { // weder darunter noch darüber → seitlich neben den Knopf, damit er frei bleibt
      oben = Math.max(rand, Math.min(vh - h - rand, r.top + r.height / 2 - h / 2));
      if (r.left - w - 6 >= rand) links = r.left - w - 6; else if (r.right + 6 + w <= vw - rand) links = r.right + 6;
    }
    f.style.left = Math.round(links) + "px"; f.style.top = Math.round(oben) + "px";
  }
  function schliesseInfo() {
    var f = $("infofenster");
    if (!f) return;
    clearTimeout(info.zu);
    f.hidden = true;
    if (info.knopf) info.knopf.classList.remove("offen");
    info.knopf = null; info.angeheftet = false;
  }

  // ---------- Live-Werte (jeder Tick) ----------
  function aktualisiereLive() {
    if (!zustand) return;
    var u = P.uebersicht(zustand, hp()), p = hp(), a = p.bauauftrag, fa = zustand.forschungsauftrag, t = jetzt(), Bau = SS.kern.bau;
    var vz = function (n) { return (n > 1e-9 ? "+" : n < -1e-9 ? "−" : "") + zahlFein(Math.abs(n)); };
    Array.prototype.forEach.call(document.querySelectorAll("#bildschirm-spiel [data-live]"), function (el) {
      var k = el.getAttribute("data-live").split(":"), art = k[0], id = k[1];
      var wert = id ? zustand.rohstoffe[id] : 0, gi = id && u.gebaeude[id];
      var text;
      if (art.indexOf("vert-") === 0) { var vl = VU().live(el, art, id, t); if (vl === null || vl === undefined) return; if (el.textContent !== vl) el.textContent = vl; return; }
      if (art.indexOf("flug-") === 0) { var fl = FU().live(el, art, id, t); if (fl === null || fl === undefined) return; if (el.textContent !== fl) el.textContent = fl; return; }
      if (art.indexOf("werft-") === 0) { var wl = WU().live(el, art, id, t); if (wl === null || wl === undefined) return; if (el.textContent !== wl) el.textContent = wl; return; }
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
        case "ge": text = id === "grund" ? leistungText(p.istHauptplanet ? B.GRUNDPRODUKTION_HAUPTPLANET : {}, "+") : (gi ? leistungText(gi.erzeugt, "+") : "–"); break;
        case "gv": text = gi ? leistungText(gi.verbraucht, "−") : "–"; break;
        case "gs": text = id === "solarsatellit" ? vz(u.satelliten.strom) : (gi && gi.strom ? vz(gi.strom) : "–"); break;
        case "gf": text = gi ? Math.round(gi.faktor * 100) + " %" : "–"; break;
        case "punkte": text = F.zahl(zustand.punkte); break;
        case "kapazitaet": text = F.zahl(Bau.kapazitaet(p)); break;
        case "vorkommen": text = F.zahl(p.rohoelVorkommen); el.classList.toggle("negativ", p.rohoelVorkommen <= 0); break;
        case "foerderung": text = (u.foerderung > 0 ? "+" + zahlFein(u.foerderung) : "0") + " Rohöl/h" + (p.gebaeude.bohrstation > 0 ? "" : " (keine Bohrstation)") + (p.rohoelVorkommen <= 0 && p.gebaeude.bohrstation > 0 ? " – Vorkommen leer" : ""); break;
        case "reichweite": text = u.foerderung > 1e-9 ? "≈ " + F.dauer(p.rohoelVorkommen / u.foerderung * P.MS_PRO_STUNDE) : "–"; break;
        case "geo-countdown":
          var nf = SS.kern.geologie.naechsterFund(p);
          text = nf != null ? F.dauer(Math.max(0, nf - t)) : "– (Geologiestation bauen)"; break;
        case "bau-rest": text = a ? "noch " + F.dauer(Math.max(0, a.ende - t)) : ""; break;
        case "forschung-rest": text = fa ? "noch " + F.dauer(Math.max(0, fa.ende - t)) : ""; break;
        case "forschung-balken": el.style.width = fa ? Math.min(100, Math.max(0, (t - fa.start) / Math.max(1, fa.ende - fa.start) * 100)).toFixed(1) + "%" : "0%"; return;
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
      el.classList.toggle("fehlt", !Bau.istMaster(zustand) && (zustand.rohstoffe[k[0]] || 0) + 1e-9 < Number(k[1]));
    });
    Array.prototype.forEach.call(document.querySelectorAll("#inhalt button[data-aktion=\"bauen\"]"), function (b) {
      var pr = Bau.pruefe(zustand, p, auftragAus(b));
      if (b.disabled !== !pr.ok) b.disabled = !pr.ok;
      var g = b.parentNode.querySelector(".grund");
      if (g && g.textContent !== pr.grund) g.textContent = pr.grund;
    });
    forschKnoepfe();
    werftKnoepfe();
    defKnoepfe();
  }
  function mengeFuer(id) {
    var inp = document.querySelector("#inhalt input[data-menge=\"" + id + "\"]");
    return inp ? Math.floor(Number(inp.value)) : 1;
  }
  function werftKnoepfe() {
    Array.prototype.forEach.call(document.querySelectorAll("#inhalt button[data-aktion=\"schiff-bauen\"]"), function (b) {
      var id = b.getAttribute("data-id"), pr = SS.kern.werft.pruefe(zustand, hp(), id, mengeFuer(id));
      if (b.disabled !== !pr.ok) b.disabled = !pr.ok;
      var g = b.parentNode.querySelector(".grund");
      if (g && g.textContent !== pr.grund) g.textContent = pr.grund;
      var n = document.querySelector("[data-schiff-anzahl=\"" + id + "\"]"), an = F.zahl(SS.kern.werft.anzahl(hp(), id));
      if (n && n.textContent !== an) n.textContent = an;
      var k = document.querySelector("article[data-schiff=\"" + id + "\"] img.schiff-bild"), sd = SS.DATEN.schiffNachId(id);
      if (k && sd) { var src = SS.DATEN.schiffBild(sd, SS.kern.werft.anzahl(hp(), id)); if (k.getAttribute("src") !== src) k.setAttribute("src", src); }
    });
  }
  function defMenge(id) {
    var inp = document.querySelector("#inhalt input[data-def-menge=\"" + id + "\"]");
    return inp ? Math.floor(Number(inp.value)) : 1;
  }
  function defKnoepfe() {
    var VT = SS.kern.verteidigung;
    Array.prototype.forEach.call(document.querySelectorAll("#inhalt button[data-aktion=\"def-bauen\"]"), function (b) {
      var id = b.getAttribute("data-id"), pr = VT.pruefe(zustand, hp(), id, defMenge(id));
      if (b.disabled !== !pr.ok) b.disabled = !pr.ok;
      var g = b.parentNode.querySelector(".grund");
      if (g && g.textContent !== pr.grund) g.textContent = pr.grund;
      var n = document.querySelector("[data-def-anzahl=\"" + id + "\"]"), an = F.zahl(VT.anzahl(hp(), id));
      if (n && n.textContent !== an) n.textContent = an;
    });
  }
  function defBauen(b) {
    var id = b.getAttribute("data-id"), menge = defMenge(id);
    P.tick(zustand, jetzt());
    var r = SS.kern.verteidigung.starte(zustand, hp(), id, menge, jetzt());
    if (!r.ok) { meldung(r.grund, "schlecht"); aktualisiereLive(); return; }
    meldung(r.sofort ? "Master: " + F.zahl(menge) + "× " + r.auftrag.name + " sofort gebaut." : F.zahl(menge) + "× " + r.auftrag.name + " in Auftrag gegeben.", "gut");
    speichern(true); route(true);
  }
  function defMax(b) {
    var id = b.getAttribute("data-id"), d = D.verteidigungNachId(id), inp = document.querySelector("#inhalt input[data-def-menge=\"" + id + "\"]"), VT = SS.kern.verteidigung;
    if (!d || !inp) return;
    var n = VT.istMaster(zustand) ? (d.max ? VT.frei(hp(), d) : 1000) : VT.maxBezahlbar(zustand, hp(), d);
    inp.value = Math.max(1, Math.min(n, isFinite(VT.frei(hp(), d)) ? VT.frei(hp(), d) : n));
    defKnoepfe();
  }
  function defAbbrechen(b) {
    var i = Number(b.getAttribute("data-index")), a = (hp().verteidigungsauftraege || [])[i];
    if (!a) return;
    dialog("Verteidigungs-Auftrag abbrechen?", "<p><b>" + F.zahl(a.menge) + "× " + esc(a.name) + "</b>: fertige Anlagen bleiben, für die übrigen bekommst du die Rohstoffe voll zurück.</p>", true).then(function (ok) {
      if (!ok) return;
      P.tick(zustand, jetzt());
      var r = SS.kern.verteidigung.abbrechen(zustand, hp(), i, jetzt());
      if (r) meldung("Abgebrochen: " + r.name + " (" + F.zahl(r.erstattet) + " Anlagen erstattet).", "gut");
      speichern(true); route(true);
    });
  }
  function simStart() {
    var aus = $("sim-ausgabe");
    if (!aus) return;
    P.tick(zustand, jetzt());
    aus.innerHTML = VU().simuliere($("sim-schiff").value, $("sim-anzahl").value, $("sim-bergung").checked);
  }
  function schiffBauen(b) {
    var id = b.getAttribute("data-id"), menge = mengeFuer(id);
    P.tick(zustand, jetzt());
    var r = SS.kern.werft.starte(zustand, hp(), id, menge, jetzt());
    if (!r.ok) { meldung(r.grund, "schlecht"); aktualisiereLive(); return; }
    meldung(r.sofort ? "Master: " + F.zahl(menge) + "× " + r.auftrag.name + " sofort gebaut." : F.zahl(menge) + "× " + r.auftrag.name + " in Auftrag gegeben.", "gut");
    speichern(true); route(true);
  }
  function schiffMax(b) {
    var id = b.getAttribute("data-id"), s = D.schiffNachId(id), inp = document.querySelector("#inhalt input[data-menge=\"" + id + "\"]");
    if (!s || !inp) return;
    inp.value = SS.kern.werft.istMaster(zustand) ? 1000 : Math.max(1, SS.kern.werft.maxBezahlbar(zustand, s));
    werftKnoepfe();
  }
  function werftAbbrechen(b) {
    var i = Number(b.getAttribute("data-index")), a = (hp().werftauftraege || [])[i];
    if (!a) return;
    dialog("Werft-Auftrag abbrechen?", "<p><b>" + F.zahl(a.menge) + "× " + esc(a.name) + "</b>: bereits fertige Einheiten bleiben, für alle übrigen bekommst du die Rohstoffe voll zurück.</p>", true).then(function (ok) {
      if (!ok) return;
      P.tick(zustand, jetzt());
      var r = SS.kern.werft.abbrechen(zustand, hp(), i, jetzt());
      if (r) meldung("Abgebrochen: " + r.name + " (" + F.zahl(r.erstattet) + " Einheiten erstattet).", "gut");
      speichern(true); route(true);
    });
  }
  function fertigText(a) {
    if (a.art === "flotte") return a.text;
    return a.art === "schiff" || a.art === "verteidigung" ? F.zahl(a.menge) + "× " + a.name : a.name + " Stufe " + a.stufe;
  }
  function forschKnoepfe() {
    Array.prototype.forEach.call(document.querySelectorAll("#inhalt button[data-aktion=\"forschen\"]"), function (b) {
      var pr = FO.pruefe(zustand, b.getAttribute("data-id"));
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
    baueMenue();
    route(true);
    if (r.sofort) meldung("Sofort fertig (Master): " + r.auftrag.name + " Stufe " + r.auftrag.stufe, "gut");
    else meldung("Bau gestartet: " + r.auftrag.name + " → Stufe " + r.auftrag.stufe + " (" + F.dauer(r.auftrag.ende - r.auftrag.start) + ")", "gut");
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
  function forschen(b) {
    meldeFertig(P.tick(zustand, jetzt()).fertig);
    var r = FO.starte(zustand, b.getAttribute("data-id"), jetzt());
    if (!r.ok) { meldung(r.grund, "schlecht"); aktualisiereLive(); return; }
    speichern(true);
    route(true);
    if (r.sofort) meldung("Sofort erforscht (Master): " + r.auftrag.name + " Stufe " + r.auftrag.stufe, "gut");
    else meldung("Forschung gestartet: " + r.auftrag.name + " → Stufe " + r.auftrag.stufe + " (" + F.dauer(r.auftrag.ende - r.auftrag.start) + ")", "gut");
  }
  function forschungAbbrechen() {
    var a = zustand.forschungsauftrag;
    if (!a) return;
    dialog("Forschung abbrechen?", "<p><b>" + esc(a.name) + " → Stufe " + a.stufe + "</b> wird abgebrochen. Du bekommst alle Rohstoffe zurück.</p>", true).then(function (ok) {
      if (!ok) return;
      P.tick(zustand, jetzt());
      FO.abbrechen(zustand);
      speichern(true); route(true);
      meldung("Forschung abgebrochen – Rohstoffe erstattet.");
    });
  }
  function meldeFunde(liste) {
    if (!liste || !liste.length) return false;
    var summe = liste.reduce(function (s, f) { return s + f.menge; }, 0);
    meldung("Geologie: " + (liste.length === 1 ? "neues Rohölfeld" : liste.length + " Rohölfelder") + " entdeckt (+" + F.zahl(summe) + " Rohöl)", "gut");
    return true;
  }

  // ---------- Master-Modus (Testmodus, je Profil gespeichert) ----------
  function aktualisiereMaster() {
    var an = !!(zustand && SS.kern.bau.istMaster(zustand));
    document.body.classList.toggle("master-an", an);
    $("knopf-master").setAttribute("aria-pressed", an ? "true" : "false");
    $("knopf-master").querySelector(".master-zustand").textContent = an ? "an" : "aus";
    $("master-hinweis").hidden = !an;
    passeKopfAn();
  }
  function masterUmschalten(an) {
    if (!zustand) return;
    meldeFertig(P.tick(zustand, jetzt()).fertig);
    var fertig = SS.kern.bau.masterSetzen(zustand, an, jetzt());
    speichern(true);
    aktualisiereMaster();
    baueMenue();
    route(true);
    meldung(an ? "MASTER aktiv – Bau-/Forschungszeiten, Kosten und Sperren werden ignoriert." + (fertig.length ? " Laufender Auftrag sofort fertig." : "") : "Master-Modus ausgeschaltet.", an ? "gut" : "");
  }
  function fundTest() {
    meldeFertig(P.tick(zustand, jetzt()).fertig);
    if (!SS.kern.bau.istMaster(zustand)) { meldung("Nur im Master-Modus.", "schlecht"); return; }
    var r = SS.kern.geologie.fundAusloesen(hp(), jetzt());
    if (!r.ok) { meldung(r.grund, "schlecht"); return; }
    speichern(true); route(true);
    meldung("Test-Fund: +" + F.zahl(r.fund.menge) + " Rohöl (Stufe " + r.fund.stufe + ")", "gut");
  }

  function meldeFertig(liste) {
    if (!liste || !liste.length) return false;
    var a = liste[liste.length - 1];
    meldung(a.art === "flotte" ? a.text : "Fertig: " + fertigText(a), "gut");
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
    if (off.angerechnetMs >= 60000 || off.fertig.length || (off.funde && off.funde.length)) {
      var liste = D.sichtbareRohstoffe(zustand).filter(function (x) { return Math.abs(off.gewinne[x.id] || 0) >= 1; }).map(function (x) {
        var gw = off.gewinne[x.id];
        return "<li>" + icon(x) + x.name + ": " + (gw > 0 ? "+" : "−") + F.zahl(Math.abs(gw)) + "</li>";
      }).join("");
      var fertigListe = off.fertig.map(function (a) { return "<li>✔ " + esc(fertigText(a)) + (a.art === "forschung" ? " erforscht" : a.art === "schiff" ? " gebaut" : " fertiggestellt") + "</li>"; }).join("") +
        (off.funde || []).map(function (f) { return "<li>🛢 Rohölfeld entdeckt (" + F.uhrzeit(f.zeit) + ", Stufe " + f.stufe + "): +" + F.zahl(f.menge) + "</li>"; }).join("");
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

  /** 0.20.1 (Sandro pt57u): „Neues Spiel“ – löscht ALLE Sternenspiel-Daten in diesem Browser (alle Spieler, Master, KI-Welt) und lädt neu. */
  function alleSternenspielSchluessel() {
    var l = [];
    try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.indexOf("sternenspiel") === 0) l.push(k); } } catch (e) { /* flüchtiger Speicher */ }
    return l;
  }
  function neuesSpielAllesLoeschen() {
    dialog("Neues Spiel – alles löschen?", "<p><b>Alle</b> Spieler und Spielstände in diesem Browser werden <b>unwiderruflich gelöscht</b>. Danach beginnst du komplett von vorn.</p>", true).then(function (ok) {
      if (!ok) return;
      stoppeSchleifen(); zustand = null; aktivId = null;
      alleSternenspielSchluessel().forEach(function (k) { try { localStorage.removeItem(k); } catch (e) { /* egal */ } });
      location.replace(location.pathname + "?neu=" + Date.now());
    });
  }
  window.SS.ui = window.SS.ui || {}; window.SS.ui.alleSternenspielSchluessel = alleSternenspielSchluessel;

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
  an("planeten-liste", "click", function (e) {
    var a = e.target.closest("a[data-planet]"); if (!a) return;
    e.preventDefault(); wechslePlanet(a.getAttribute("data-planet")); schliesseMenue();
  });
  an("knopf-schnellspeichern", "click", function () { speichern(false); });
  an("knopf-neues-spiel-alles", "click", neuesSpielAllesLoeschen);
  an("knopf-spieler-wechseln", "click", spielerWechseln);
  an("inhalt", "click", function (e) {
    var b = e.target.closest("[data-aktion]");
    if (!b) return;
    var a = b.getAttribute("data-aktion");
    if (a === "wr-spionage") { e.preventDefault(); spionageSchnell(b.getAttribute("data-koord")); return; }
    if (a === "speichern") speichern(false);
    else if (a === "wechseln") spielerWechseln();
    else if (a === "neues-spiel-alles") neuesSpielAllesLoeschen();
    else if (a === "zuruecksetzen") zuruecksetzen();
    else if (a === "bauen") bauen(b);
    else if (a === "abbrechen") bauAbbrechen();
    else if (a === "fund-test") fundTest();
    else if (a === "forschen") forschen(b);
    else if (a === "forschung-abbrechen") forschungAbbrechen();
    else if (a === "schiff-bauen") schiffBauen(b);
    else if (a === "schiff-max") schiffMax(b);
    else if (a === "werft-abbrechen") werftAbbrechen(b);
    else if (a === "def-bauen") defBauen(b);
    else if (a === "def-max") defMax(b);
    else if (a === "def-abbrechen") defAbbrechen(b);
    else if (a === "sim-start") simStart();
    else if (a === "send-max") sendMax(b);
    else if (a === "send-alle") sendAlle();
    else if (a === "send-keine") { Array.prototype.forEach.call(document.querySelectorAll("#inhalt input[data-send-ladung]"), function (i) { i.value = 0; }); sendeFeld(function (i) { i.value = 0; }); }
    else if (a === "send-favorit") sendFavorit();
    else if (a === "send-planet") { $("send-koord").value = b.getAttribute("data-koord"); $("send-ziel").value = b.getAttribute("data-koord"); if ($("send-mission").value !== "transportieren") $("send-mission").value = "stationieren"; FU().aktualisiereSenden(document); }
    else if (a === "send-expeditionsraum") { setzeExpeditionsraum(true); FU().aktualisiereSenden(document); }
    else if (a === "send-los") sendLos();
    else if (a === "flotte-rueckruf") { P.tick(zustand, jetzt()); var rr = SS.kern.bergung.rueckruf(zustand, b.getAttribute("data-id"), jetzt()); meldung(rr.ok ? "Flotte zurückgerufen – " + F.zahl(rr.erstattung) + " Rohöl erstattet, Rückkehr in " + F.dauer(rr.rueckkehr - jetzt()) + "." : rr.grund, rr.ok ? "gut" : "schlecht"); speichern(true); route(true); }
    else if (a === "schild-an") { var sp = zustand.planeten.filter(function (x) { return x.id === b.getAttribute("data-id"); })[0], sr = sp && SS.kern.bergung.schildAktivieren(zustand, sp, jetzt()); meldung(sr && sr.ok ? "Angriffsschild aktiv (" + B.SCHILD.DAUER_H + " Std.)." : (sr ? sr.grund : "Planet fehlt"), sr && sr.ok ? "gut" : "schlecht"); speichern(true); bauePlanetenListe(); route(true); }
    else if (a === "testphase-laden") {
      dialog("Testphase laden?", "<p>Master-Modus wird aktiviert. Flotte, Verteidigung und Flüge des Hauptplaneten werden durch den Test-Seed ersetzt; Testkolonie und zwei Testgegner werden angelegt.</p>", true)
        .then(function (ok) { if (!ok) return; SS.kern.testphase.legeTestphaseAn(zustand, jetzt()); speichern(true); baueMenue(); route(true); meldung("Testphase geladen – Master aktiv", "gut"); });
    }
    else if (a === "laden") {
      dialog("Letzten Spielstand laden?", "<p>Nicht gespeicherter Fortschritt seit dem letzten Speichern geht verloren (Offline-Produktion wird dabei angerechnet).</p>", true)
        .then(function (ok) { if (ok) { var id = aktivId; stoppeSchleifen(); ladeUndBetrete(id); } });
    }
  });
  an("inhalt", "input", function (e) {
    if (e.target.matches && e.target.matches("input[data-menge]") && zustand) werftKnoepfe();
    if (e.target.matches && e.target.matches("input[data-def-menge]") && zustand) defKnoepfe();
    if (e.target.matches && e.target.matches("input[data-send-menge], input[data-send-ladung], #send-koord") && zustand) FU().aktualisiereSenden(document);
  });
  /** 0.15.1: Expeditionsraum (Position 13 im System des aktuellen Planeten) ins Koordinatenfeld; erzwingen = auch wenn schon etwas drinsteht. */
  function setzeExpeditionsraum(erzwingen) {
    var k = $("send-koord"), m = $("send-mission"); if (!k) return;
    if (!erzwingen && SS.kern.expedition.leseZiel(k.value)) return;
    var h = SS.kern.flotte.herkunftKoord(zustand, hp());
    k.value = h.sektor + ":" + h.system + ":" + SS.BALANCE.EXPEDITION.POSITION; if (m) m.value = "expedition";
  }
  an("inhalt", "change", function (e) {
    if (zustand && e.target.id === "flotte-preset") { SS.kern.flotte.setzePreset(hp(), e.target.value); speichern(true); route(true); return; }
    if (zustand && e.target.id === "wr-sektor") { var sk = D.weltraum.sektor(parseInt(e.target.value, 10)); if (sk) location.hash = "#weltraum/system/" + sk.systemVon; return; }
    if (zustand && e.target.id === "wr-system") { var n = parseInt(e.target.value, 10); if (D.weltraum.system(n)) location.hash = "#weltraum/system/" + n; return; }
    if (zustand && e.target.id === "send-ziel") { if (e.target.value) $("send-koord").value = e.target.value; FU().aktualisiereSenden(document); return; }
    if (zustand && e.target.id === "send-mission" && e.target.value === "expedition") setzeExpeditionsraum(false); // 0.15.1: Ziel vorausfüllen
    if (zustand && (e.target.id === "send-mission" || e.target.id === "send-halten")) { FU().aktualisiereSenden(document); return; }
    var sel = e.target.closest("select[data-regler]");
    if (!sel || !zustand) return;
    P.tick(zustand, jetzt());
    hp().regler[sel.getAttribute("data-regler")] = Math.max(0, Math.min(100, parseInt(sel.value, 10) || 0));
    speichern(true);
    aktualisiereLive();
  });
  an("knopf-master", "click", function () { masterUmschalten(!(zustand && SS.kern.bau.istMaster(zustand))); });
  an("knopf-master-aus", "click", function () { masterUmschalten(false); });
  if ($("inhalt")) $("inhalt").addEventListener("toggle", function (e) { if (e.target && e.target.id === "fund-log") uiZustand.fundLogOffen = e.target.open; }, true); // toggle steigt nicht auf → Capture
  // Info-Fenster: Hover (Maus) bzw. Antippen/Klick (angeheftet, schließbar)
  var hoverGeraet = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  document.addEventListener("mouseover", function (e) {
    if (!hoverGeraet || info.angeheftet) return;
    var k = e.target.closest && e.target.closest(".info-knopf");
    if (k) { clearTimeout(info.zu); if (info.knopf !== k) zeigeInfo(k, false); }
    else if (info.knopf && !(e.target.closest && e.target.closest("#infofenster"))) { clearTimeout(info.zu); info.zu = setTimeout(schliesseInfo, 180); }
  });
  document.addEventListener("click", function (e) {
    var k = e.target.closest && e.target.closest(".info-knopf");
    if (k) { e.preventDefault(); if (info.angeheftet && info.knopf === k) schliesseInfo(); else zeigeInfo(k, true); return; }
    if (e.target.closest && e.target.closest("[data-aktion=\"info-zu\"]")) { schliesseInfo(); return; }
    if (info.angeheftet && !(e.target.closest && e.target.closest("#infofenster"))) schliesseInfo();
  });
  window.addEventListener("scroll", function () { if (info.knopf && !info.angeheftet) schliesseInfo(); else if (info.knopf) positioniereInfo(); }, { passive: true });
  window.addEventListener("hashchange", function () { schliesseInfo(); route(); });
  window.addEventListener("resize", function () { passeKopfAn(); if (info.knopf) positioniereInfo(); });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (!$("dialog").hidden) $(!$("dialog-abbrechen").hidden ? "dialog-abbrechen" : "dialog-ok").click();
    else if (!$("infofenster").hidden) schliesseInfo();
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
