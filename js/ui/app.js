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
  var fehltModul = !SS || benoetigt.some(function (k) { return !SS[k]; }) || !SS.kern.profile || !SS.kern.zustand || !SS.DATEN.weltraum || !SS.DATEN.menue;

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
    var liste = D.sichtbareRohstoffe(zustand); // Kunststoff T1–T3 und Antimaterie erst nach Freischaltung (Flag im Spielstand)
    var leiste = $("ressourcen-leiste");
    leiste.style.setProperty("--anzahl", liste.length);
    leiste.setAttribute("data-anzahl", liste.length);
    leiste.innerHTML = liste.map(function (r) {
      return "<div class=\"rs\" title=\"" + r.name + "\" data-rohstoff=\"" + r.id + "\">" + icon(r) +
        "<span class=\"rs-text\"><span class=\"rs-name\">" + r.name + "</span><span class=\"rs-wert\" data-live=\"bestand-kurz:" + r.id + "\">0</span></span></div>";
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
  function route() {
    if (!zustand) return;
    var teile = location.hash.replace(/^#/, "").split("/").filter(Boolean);
    var id = teile[0] && D.menuePunkt(teile[0]) ? teile[0] : "uebersicht";
    seite = { id: id };
    Array.prototype.forEach.call(document.querySelectorAll("#menue-liste a"), function (a) {
      var aktiv = a.getAttribute("data-seite") === id;
      a.classList.toggle("aktiv", aktiv);
      if (aktiv) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    var m = D.menuePunkt(id);
    var html = id === "uebersicht" ? seiteUebersicht() : seitePlatzhalter(m);
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
    var h = zustand.heimat, pl = W.planet(h.system, h.planet);
    return box("Hauptplanet",
      "<div class=\"planet-karte\">" + planetBild(pl, "planet-bild") + "<dl class=\"werte\">" +
      "<dt>Planet</dt><dd id=\"uebersicht-planet\">" + esc(h.name) + "</dd>" +
      "<dt>Koordinaten</dt><dd><span class=\"koord\" id=\"uebersicht-koordinaten\" title=\"Sektor:System:Planet\">[" + W.koordinatenText(h) + "]</span></dd>" +
      "</dl></div>") +
      box("Spielstand",
      "<p class=\"hinweis\" data-live=\"speicherinfo\"></p><div class=\"knopf-reihe\">" +
      "<button class=\"knopf primaer\" data-aktion=\"speichern\">Speichern</button>" +
      "<button class=\"knopf\" data-aktion=\"wechseln\">Spieler wechseln</button>" +
      "<button class=\"knopf gefahr\" data-aktion=\"zuruecksetzen\">Zurücksetzen</button></div>" +
      "<p class=\"hinweis\">Zurücksetzen betrifft nur diesen Spieler.</p>");
  }

  // Alle übrigen Menüseiten: nur Titel + neutraler Platzhalter (Inhalt kommt in eigenen Kapiteln)
  function seitePlatzhalter(m) {
    return box(m.name, "<div class=\"platzhalter\"><p class=\"gross\">" + esc(D.PLATZHALTER_TEXT) + "</p></div>");
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
        case "speicherinfo":
          text = (zustand.zeit.zuletztGespeichert ? "Zuletzt gespeichert: " + F.uhrzeit(zustand.zeit.zuletztGespeichert) : "Noch nicht gespeichert") +
            " · Autospeichern alle " + Math.round(B.AUTOSPEICHERN_MS / 1000) + " s" + (window.__speicherFluechtig ? " · ACHTUNG: Browser erlaubt kein dauerhaftes Speichern" : "");
          break;
        default: return;
      }
      if (el.textContent !== text) el.textContent = text;
    });
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
    if (off.angerechnetMs >= 60000) {
      var liste = D.sichtbareRohstoffe(zustand).filter(function (x) { return off.gewinne[x.id] >= 1; }).map(function (x) {
        return "<li>" + icon(x) + x.name + ": +" + F.zahl(off.gewinne[x.id]) + "</li>";
      }).join("");
      dialog("Willkommen zurück, " + esc(zustand.name) + "!", "<p>Du warst <b>" + F.dauer(off.abwesendMs) + "</b> weg." +
        (off.gekappt ? " Angerechnet werden höchstens " + B.OFFLINE_MAX_STUNDEN + " Std." : "") + "</p>" +
        (liste ? "<ul class=\"boni\">" + liste + "</ul>" : "<p>Deine Lager waren bereits voll.</p>"), false);
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
