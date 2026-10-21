/* Hero: echte Bildfolge (Higgsfield/Kling), Container werden beim Scrollen aufgesetzt.
   GSAP ScrollTrigger mit pin + scrub, Abschnitt bleibt stehen, bis die Anlage fertig ist. */
(function () {
  "use strict";
  var box = document.querySelector("[data-hero]");
  if (!box) return;
  var cv = box.querySelector(".hero-cv"), poster = box.querySelector(".hero-poster");
  var cap = document.querySelector("[data-cap]"), bar = document.querySelector(".hero-bar i");
  var N = +box.dataset.n;
  var CAPS = [
    [0, "Das Erdgeschoss steht: Bürocontainer, Seite an Seite."],
    [4, "Das nächste Geschoss wird einfach aufgesetzt."],
    [22, "Bis zu drei Geschosse übereinander."],
    [30, "Dazu der Treppenturm aus verzinktem Stahl."],
    [N - 3, "Bezugsfertig übergeben."]
  ];
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var mq = window.matchMedia("(max-width: 760px)");
  var dir = function () { return mq.matches ? "m" : "d"; };
  var base = poster.getAttribute("src").replace(/poster\.jpg$/, "");

  if (reduce || !window.gsap || !window.ScrollTrigger) {
    // Ohne Animation: fertige Anlage als Standbild
    poster.src = base + (mq.matches ? "ende-m.jpg" : "ende.jpg");
    var src = box.querySelector("source");
    if (src) src.srcset = base + "ende-m.jpg";
    cap.textContent = CAPS[CAPS.length - 1][1];
    return;
  }

  var ctx = cv.getContext("2d");
  var sky = "rgb(221,225,231)", skyT = "rgba(221,225,231,0)";
  function sampleSky(im) {
    try {
      var c = document.createElement("canvas"); c.width = 1; c.height = 1;
      var x = c.getContext("2d");
      x.drawImage(im, im.naturalWidth * 0.5, 2, 1, 1, 0, 0, 1, 1);
      var d = x.getImageData(0, 0, 1, 1).data;
      sky = "rgb(" + d[0] + "," + d[1] + "," + d[2] + ")";
      skyT = "rgba(" + d[0] + "," + d[1] + "," + d[2] + ",0)";
      box.style.setProperty("--sky", sky);
    } catch (e) {}
  }
  var imgs = {}, set = null, cur = 0;
  function load(d) {
    if (imgs[d]) return imgs[d];
    var arr = [];
    for (var i = 1; i <= N; i++) {
      var im = new Image();
      im.decoding = "async";
      im.src = base + d + "/f_" + ("00" + i).slice(-3) + ".webp";
      if (i === 1) im.onload = function () { sampleSky(this); draw(cur); };
      arr.push(im);
    }
    imgs[d] = arr;
    return arr;
  }
  function size() {
    var r = cv.getBoundingClientRect(), k = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(r.width * k);
    cv.height = Math.round(r.height * k);
  }
  function nearest(i) {
    for (var o = 0; o < N; o++) {
      if (set[i - o] && set[i - o].complete && set[i - o].naturalWidth) return set[i - o];
      if (set[i + o] && set[i + o].complete && set[i + o].naturalWidth) return set[i + o];
    }
    return null;
  }
  function draw(i) {
    cur = i;
    var im = nearest(i);
    if (!im) return;
    var cw = cv.width, ch = cv.height, iw = im.naturalWidth, ih = im.naturalHeight, s, x, y;
    if (mq.matches) {
      // Handy: Ausschnitt fuellt die Flaeche
      s = Math.max(cw / iw, ch / ih);
      x = (cw - iw * s) / 2; y = (ch - ih * s) / 2;
    } else {
      // Desktop: ganze Anlage (rechte 71 % des Bildes) sichtbar, unten buendig, Himmel darueber auffuellen
      s = Math.max(Math.min(ch / ih, cw / (0.71 * iw)), cw / iw);
      x = cw - iw * s * 0.995; y = ch - ih * s;
    }
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(im, x, y, iw * s, ih * s);
    if (y > 0) {  // weicher Uebergang vom Bild in den Himmel
      var gr = ctx.createLinearGradient(0, y, 0, y + ih * s * 0.12);
      gr.addColorStop(0, sky); gr.addColorStop(1, skyT);
      ctx.fillStyle = gr;
      ctx.fillRect(0, y, cw, ih * s * 0.12);
    }
    if (!box.classList.contains("is-live")) box.classList.add("is-live");
  }
  function setCap(i) {
    var t = CAPS[0][1];
    for (var k = 0; k < CAPS.length; k++) if (i >= CAPS[k][0]) t = CAPS[k][1];
    if (cap.textContent !== t) cap.textContent = t;
  }
  function boot() {
    set = load(dir());
    size();
    draw(cur);
  }
  boot();
  window.addEventListener("resize", function () { boot(); });

  gsap.registerPlugin(ScrollTrigger);
  var hdr = document.querySelector(".hdr");
  // Ruhephase am Anfang (6 %) und lange Endphase (18 %), dazwischen die Bildfolge
  var A = 0.06, E = 0.82;
  ScrollTrigger.create({
    trigger: ".hero",
    start: function () { return "top " + (hdr ? hdr.offsetHeight : 0) + "px"; },
    end: function () { return "+=" + Math.round(window.innerHeight * 3.4); },
    pin: true,
    scrub: 0.6,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    onUpdate: function (self) {
      var p = Math.min(1, Math.max(0, (self.progress - A) / (E - A)));
      var i = Math.round(p * (N - 1));
      if (i !== cur) draw(i);
      setCap(i);
      if (bar) bar.style.transform = "scaleX(" + self.progress.toFixed(4) + ")";
    }
  });
})();
