/* Mobiler Raum: Navigation, Filter, Galerie, Anfrage */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // Mobile Navigation
  var burger = $(".burger"), mnav = $("#mnav");
  if (burger && mnav) {
    burger.addEventListener("click", function () {
      var open = burger.getAttribute("aria-expanded") === "true";
      burger.setAttribute("aria-expanded", String(!open));
      burger.setAttribute("aria-label", open ? "Menü öffnen" : "Menü schließen");
      mnav.hidden = open;
      document.body.style.overflow = open ? "" : "hidden";
    });
    $$("a", mnav).forEach(function (a) {
      a.addEventListener("click", function () {
        burger.setAttribute("aria-expanded", "false");
        mnav.hidden = true;
        document.body.style.overflow = "";
      });
    });
  }

  // Produkt-Rail
  var rail = $("[data-rail]");
  if (rail) {
    $$(".rail-b").forEach(function (b) {
      b.addEventListener("click", function () {
        var card = rail.firstElementChild;
        var step = card ? card.getBoundingClientRect().width + 16 : 300;
        rail.scrollBy({ left: step * Number(b.dataset.dir), behavior: "smooth" });
      });
    });
  }

  // Sortiment: Filter + Suche
  var grid = $("[data-grid]");
  if (grid) {
    var cards = $$(".pcard", grid), chips = $$(".chip[data-f]"), search = $("[data-search]");
    var count = $("[data-count]"), empty = $("[data-empty]");
    var state = { f: "", q: "" };
    var norm = function (s) { return s.toLowerCase().replace(/[′'´]/g, "'").replace(/\s+/g, " ").trim(); };
    var apply = function () {
      var n = 0, q = norm(state.q);
      cards.forEach(function (c) {
        var ok = (!state.f || c.dataset.cat === state.f) && (!q || norm(c.dataset.q.replace(/′/g, "'")).indexOf(q) > -1);
        c.hidden = !ok;
        if (ok) n++;
      });
      count.textContent = n + (n === 1 ? " Modell" : " Modelle");
      empty.hidden = n > 0;
      chips.forEach(function (ch) { ch.classList.toggle("is-on", ch.dataset.f === state.f); });
    };
    chips.forEach(function (ch) {
      ch.addEventListener("click", function () {
        state.f = ch.dataset.f;
        history.replaceState(null, "", state.f ? "#" + state.f : location.pathname);
        apply();
      });
    });
    if (search) search.addEventListener("input", function () { state.q = search.value; apply(); });
    if (location.hash) state.f = location.hash.slice(1);
    apply();
  }

  // Produktgalerie
  var main = $("[data-main]");
  if (main) {
    $$(".gal-th button").forEach(function (b) {
      b.addEventListener("click", function () {
        $$(".gal-th button").forEach(function (x) { x.classList.remove("is-on"); });
        b.classList.add("is-on");
        main.style.opacity = 0;
        var img = new Image();
        img.onload = function () { main.src = b.dataset.src; main.style.opacity = 1; };
        img.src = b.dataset.src;
      });
    });
  }

  // Anfrageformular: baut eine E-Mail, kein Server noetig
  var form = $("[data-form]");
  if (form) {
    var params = new URLSearchParams(location.search);
    if (params.get("produkt")) form.produkt.value = params.get("produkt");
    if (params.get("betreff")) {
      $$("option", form.betreff).forEach(function (o) { if (o.value === params.get("betreff")) form.betreff.value = o.value; });
    }
    var note = $("[data-note]");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var bad = [];
      ["nachname", "email"].forEach(function (n) {
        var el = form[n], ok = el.value.trim() && (n !== "email" || /.+@.+\..+/.test(el.value));
        el.classList.toggle("bad", !ok);
        if (!ok) bad.push(el);
      });
      if (!form.ds.checked) bad.push(form.ds);
      if (bad.length) {
        note.textContent = "Bitte Nachname, eine gültige E-Mail-Adresse und die Einwilligung zum Datenschutz angeben.";
        note.className = "form-note err";
        bad[0].focus();
        return;
      }
      var v = function (n) { return (form[n] && form[n].value || "").trim(); };
      var art = (form.querySelector("input[name=art]:checked") || {}).value || "";
      var body = [
        "Anfrage über mobiler-raum.de", "",
        "Art: " + art,
        "Produkt/Kategorie: " + v("produkt"),
        "Einsatzort: " + v("ort"),
        "Zeitraum: " + v("zeitraum"), "",
        v("nachricht"), "",
        "Name: " + (v("vorname") + " " + v("nachname")).trim(),
        "Firma: " + v("firma"),
        "Telefon: " + v("telefon"),
        "E-Mail: " + v("email")
      ].join("\n");
      var subject = v("betreff") + (v("produkt") ? ": " + v("produkt") : "");
      location.href = "mailto:mail@mobiler-raum.de?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      note.textContent = "Ihr E-Mail-Programm wurde geöffnet. Bitte senden Sie die vorbereitete Nachricht ab.";
      note.className = "form-note ok";
    });
  }

  // Sanftes Einblenden
  if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var els = $$(".ccard, .pgrid .pcard, .svc-list li, .ecard, .partner-card, .pblock, .feat-img, .feat-copy");
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) {
        if (x.isIntersecting) {
          var t = x.target;
          t.classList.add("in");
          io.unobserve(t);
          setTimeout(function () { t.classList.remove("rv", "in"); t.style.transitionDelay = ""; }, 1100);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (el, i) {
      if (el.getBoundingClientRect().top < innerHeight) return;
      el.classList.add("rv");
      el.style.transitionDelay = (i % 3) * 70 + "ms";
      io.observe(el);
    });
  }
})();
