/* Hero: Container-Module setzen sich beim Scrollen zu einer Anlage zusammen (GSAP ScrollTrigger, pin + scrub) */
(function () {
  "use strict";
  var svg = document.getElementById("iso");
  if (!svg) return;
  var NS = "http://www.w3.org/2000/svg";
  var S = 20, C = Math.cos(Math.PI / 6);
  function P(x, y, z) { return [(x - y) * C * S, (x + y) * 0.5 * S - z * S]; }
  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function poly(pts, attrs, parent) {
    attrs.points = pts.map(function (p) { return p[0].toFixed(2) + "," + p[1].toFixed(2); }).join(" ");
    return el("polygon", attrs, parent);
  }
  function line(a, b, attrs, parent) {
    attrs.x1 = a[0]; attrs.y1 = a[1]; attrs.x2 = b[0]; attrs.y2 = b[1];
    return el("line", attrs, parent);
  }

  var L = 6.058, W = 2.438, H = 2.8;
  var PAL = {
    blue: { long: "#24558F", end: "#1A4374", top: "#3B6CA7", rail: "#173A66", seam: "rgba(255,255,255,.10)", stroke: "rgba(10,20,45,.55)" },
    white: { long: "#F4F3EF", end: "#DADBD6", top: "#FFFFFF", rail: "#C5C8C2", seam: "rgba(20,30,50,.10)", stroke: "rgba(40,50,70,.45)" }
  };

  // Gradienten
  var defs = el("defs", {}, svg);
  var g1 = el("linearGradient", { id: "glass", x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
  el("stop", { offset: 0, "stop-color": "#C9DAEA" }, g1);
  el("stop", { offset: 1, "stop-color": "#7F9CBB" }, g1);
  var g2 = el("linearGradient", { id: "lit", x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
  el("stop", { offset: 0, "stop-color": "#FFE7B0" }, g2);
  el("stop", { offset: 1, "stop-color": "#F7B955" }, g2);
  var blur = el("filter", { id: "soft", x: "-20%", y: "-20%", width: "140%", height: "140%" }, defs);
  el("feGaussianBlur", { stdDeviation: "6" }, blur);

  var ground = el("g", {}, svg);
  var scene = el("g", {}, svg);

  // Rechteck auf einer Flaeche: f(u,v) bildet Flaechenkoordinaten (Meter) auf 2D ab
  function rect(f, u0, v0, u1, v1, attrs, parent) {
    return poly([f(u0, v0), f(u1, v0), f(u1, v1), f(u0, v1)], attrs, parent);
  }

  function box(o) {
    var x0 = o.x, y0 = o.y, z0 = o.z, l = o.l, w = o.w, h = o.h, x1 = x0 + l, y1 = y0 + w, z1 = z0 + h;
    var c = PAL[o.color];
    var g = el("g", { "class": "mod" }, scene);
    var lit = [];
    // Kranseil
    var top = P(x0 + l / 2, y0 + w / 2, z1);
    var cable = el("g", { "class": "cable" }, g);
    line([top[0], top[1] - 420], top, { stroke: "#3A4256", "stroke-width": 1.1 }, cable);
    poly([[top[0] - 4, top[1] - 10], [top[0] + 4, top[1] - 10], [top[0], top[1] - 2]], { fill: "#C4161E" }, cable);

    var fl = function (u, v) { return P(x0 + u, y1, z0 + v); };   // Laengsseite (y = y1)
    var fe = function (u, v) { return P(x1, y0 + u, z0 + v); };   // Stirnseite (x = x1)
    var ft = function (u, v) { return P(x0 + u, y0 + v, z1); };   // Dach
    var st = { stroke: c.stroke, "stroke-width": 0.8, "stroke-linejoin": "round" };

    // Laengsseite
    rect(fl, 0, 0, l, h, Object.assign({ fill: c.long }, st), g);
    for (var u = 0.6; u < l - 0.3; u += 0.62) line(fl(u, 0.22), fl(u, h - 0.26), { stroke: c.seam, "stroke-width": 1 }, g);
    rect(fl, 0, 0, l, 0.22, { fill: c.rail }, g);
    rect(fl, 0, h - 0.26, l, h, { fill: c.rail }, g);
    rect(fl, 0, 0, 0.16, h, { fill: c.rail }, g);
    rect(fl, l - 0.16, 0, l, h, { fill: c.rail }, g);
    (o.win || []).forEach(function (wu) {
      rect(fl, wu - 0.62, 0.92, wu + 0.62, 2.22, { fill: "#fff", stroke: c.stroke, "stroke-width": 0.5 }, g);
      rect(fl, wu - 0.54, 1.0, wu + 0.54, 1.98, { fill: "url(#glass)" }, g);
      lit.push(rect(fl, wu - 0.54, 1.0, wu + 0.54, 1.98, { fill: "url(#lit)", "class": "lit", opacity: 0 }, g));
      rect(fl, wu - 0.62, 1.98, wu + 0.62, 2.22, { fill: "#E4E5E1" }, g);
    });
    (o.doorL || []).forEach(function (du) {
      rect(fl, du - 0.44, 0.22, du + 0.44, 2.3, { fill: o.color === "blue" ? "#1B3F6C" : "#E6E6E1", stroke: c.stroke, "stroke-width": 0.6 }, g);
      lit.push(rect(fl, du - 0.3, 1.4, du + 0.3, 2.0, { fill: "url(#lit)", "class": "lit", opacity: 0 }, g));
    });
    rect(fl, 0, 0, l, h, { fill: "none", stroke: c.stroke, "stroke-width": 0.8 }, g);

    // Stirnseite
    rect(fe, 0, 0, w, h, Object.assign({ fill: c.end }, st), g);
    for (var e = 0.55; e < w - 0.3; e += 0.62) line(fe(e, 0.22), fe(e, h - 0.26), { stroke: c.seam, "stroke-width": 1 }, g);
    rect(fe, 0, 0, w, 0.22, { fill: c.rail }, g);
    rect(fe, 0, h - 0.26, w, h, { fill: c.rail }, g);
    rect(fe, 0, 0, 0.16, h, { fill: c.rail }, g);
    rect(fe, w - 0.16, 0, w, h, { fill: c.rail }, g);
    if (o.door) {
      rect(fe, w / 2 - 0.44, 0.22, w / 2 + 0.44, 2.32, { fill: o.color === "blue" ? "#163861" : "#D2D3CE", stroke: c.stroke, "stroke-width": 0.6 }, g);
      line(fe(w / 2 + 0.28, 1.15), fe(w / 2 + 0.36, 1.15), { stroke: "#E8E8E8", "stroke-width": 1.4 }, g);
    }
    if (o.winE) {
      rect(fe, w / 2 - 0.5, 0.95, w / 2 + 0.5, 2.2, { fill: "#fff", stroke: c.stroke, "stroke-width": 0.5 }, g);
      rect(fe, w / 2 - 0.42, 1.02, w / 2 + 0.42, 2.0, { fill: "url(#glass)" }, g);
      lit.push(rect(fe, w / 2 - 0.42, 1.02, w / 2 + 0.42, 2.0, { fill: "url(#lit)", "class": "lit", opacity: 0 }, g));
    }
    rect(fe, 0, 0, w, h, { fill: "none", stroke: c.stroke, "stroke-width": 0.8 }, g);

    // Dach
    rect(ft, 0, 0, l, w, Object.assign({ fill: c.top }, st), g);
    rect(ft, 0.18, 0.18, l - 0.18, w - 0.18, { fill: "none", stroke: c.seam, "stroke-width": 1 }, g);

    // Schatten am Boden
    var sh = null;
    if (z0 === 0) {
      sh = poly([P(x0 - 0.3, y0 - 0.3, 0), P(x1 + 0.6, y0 - 0.3, 0), P(x1 + 0.6, y1 + 0.6, 0), P(x0 - 0.3, y1 + 0.6, 0)],
        { fill: "rgba(18,26,51,.18)", filter: "url(#soft)" }, ground);
    }
    return { g: g, cable: cable, lit: lit, shadow: sh, pts: [P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1), P(x0, y1, z0), P(x1, y1, z0), P(x1, y0, z0)] };
  }

  function tower(o) {
    var x0 = o.x, y0 = o.y, l = o.l, w = o.w, hh = o.h, x1 = x0 + l, y1 = y0 + w;
    var g = el("g", { "class": "mod" }, scene);
    var steel = { stroke: "#4E5A6E", "stroke-width": 2.2, "stroke-linecap": "square" };
    var thin = { stroke: "#7C8798", "stroke-width": 1.1 };
    var top = P(x0 + l / 2, y0 + w / 2, hh);
    var cable = el("g", { "class": "cable" }, g);
    line([top[0], top[1] - 420], top, { stroke: "#3A4256", "stroke-width": 1.1 }, cable);
    poly([[top[0] - 4, top[1] - 10], [top[0] + 4, top[1] - 10], [top[0], top[1] - 2]], { fill: "#C4161E" }, cable);
    // hinterer Pfosten
    line(P(x0, y0, 0), P(x0, y0, hh), steel, g);
    // Podeste
    [H, 2 * H].forEach(function (z) {
      poly([P(x0, y0, z), P(x0 + 1.5, y0, z), P(x0 + 1.5, y1, z), P(x0, y1, z)], { fill: "#A9B1BD", stroke: "#4E5A6E", "stroke-width": 0.8 }, g);
      poly([P(x1 - 1.5, y0, z), P(x1, y0, z), P(x1, y1, z), P(x1 - 1.5, y1, z)], { fill: "#A9B1BD", stroke: "#4E5A6E", "stroke-width": 0.8 }, g);
    });
    // Treppenlaeufe mit Stufen
    function flight(za, ya, yb, dir) {
      var xa = dir > 0 ? x0 + 1.5 : x1 - 1.5, xb = dir > 0 ? x1 - 1.5 : x0 + 1.5, n = 11;
      for (var i = 0; i <= n; i++) {
        var t = i / n, x = xa + (xb - xa) * t, z = za + H * t;
        line(P(x, ya, z), P(x, yb, z), thin, g);
      }
      line(P(xa, ya, za), P(xb, ya, za + H), steel, g);
      line(P(xa, yb, za), P(xb, yb, za + H), steel, g);
      line(P(xa, yb, za + 1), P(xb, yb, za + H + 1), thin, g);
    }
    flight(0, y0 + 0.2, y0 + w / 2 - 0.1, 1);
    flight(H, y0 + w / 2 + 0.1, y1 - 0.2, -1);
    // Rahmen
    [[x1, y0], [x1, y1], [x0, y1]].forEach(function (p) { line(P(p[0], p[1], 0), P(p[0], p[1], hh), steel, g); });
    [0, H, 2 * H].forEach(function (z) {
      line(P(x0, y1, z), P(x1, y1, z), steel, g);
      line(P(x1, y0, z), P(x1, y1, z), steel, g);
      line(P(x0, y0, z), P(x1, y0, z), thin, g);
    });
    // Gelaender oben
    line(P(x0, y1, 2 * H + 1.05), P(x1, y1, 2 * H + 1.05), thin, g);
    line(P(x1, y0, 2 * H + 1.05), P(x1, y1, 2 * H + 1.05), thin, g);
    // Dach
    var r = 2 * H + 2.5;
    [[x0, y0], [x1, y0], [x1, y1], [x0, y1]].forEach(function (p) { line(P(p[0], p[1], 2 * H), P(p[0], p[1], r), thin, g); });
    poly([P(x0, y0, r), P(x1, y0, r), P(x1, y1, r), P(x0, y1, r)], { fill: "#3B6CA7", stroke: "rgba(10,20,45,.55)", "stroke-width": 0.8 }, g);
    poly([P(x0, y1, r - 0.25), P(x1, y1, r - 0.25), P(x1, y1, r), P(x0, y1, r)], { fill: "#173A66" }, g);
    poly([P(x1, y0, r - 0.25), P(x1, y1, r - 0.25), P(x1, y1, r), P(x1, y0, r)], { fill: "#1A4374" }, g);
    var sh = poly([P(x0 - 0.3, y0 - 0.3, 0), P(x1 + 0.6, y0 - 0.3, 0), P(x1 + 0.6, y1 + 0.6, 0), P(x0 - 0.3, y1 + 0.6, 0)], { fill: "rgba(18,26,51,.12)", filter: "url(#soft)" }, ground);
    return { g: g, cable: cable, lit: [], shadow: sh, pts: [P(x0, y0, r), P(x1, y0, r), P(x1, y1, r), P(x0, y1, r), P(x0, y1, 0), P(x1, y1, 0), P(x1, y0, 0)] };
  }

  // Bodenplatte (Fundamentstreifen)
  var site = poly([P(-1.2, -1.2, 0), P(L + 6.4, -1.2, 0), P(L + 6.4, 3 * W + 1.2, 0), P(-1.2, 3 * W + 1.2, 0)], { fill: "#E6E7E2", stroke: "#C6C9C4", "stroke-width": 1, "stroke-dasharray": "3 4" }, ground);

  // Reihenfolge = Zeichenreihenfolge (hinten nach vorn, unten nach oben)
  var M = {};
  M.g0 = box({ x: 0, y: 0, z: 0, l: L, w: W, h: H, color: "blue", door: true });
  M.g1 = box({ x: 0, y: W, z: 0, l: L, w: W, h: H, color: "blue", winE: true });
  M.g2 = box({ x: 0, y: 2 * W, z: 0, l: L, w: W, h: H, color: "blue", win: [1.3, 3.0, 4.7], winE: true });
  M.u0 = box({ x: 0, y: 0, z: H, l: L, w: W, h: H, color: "white", winE: true });
  M.u1 = box({ x: 0, y: W, z: H, l: L, w: W, h: H, color: "white", door: true });
  M.u2 = box({ x: 0, y: 2 * W, z: H, l: L, w: W, h: H, color: "white", win: [1.3, 3.0, 4.7], winE: true });
  M.tw = tower({ x: L + 0.15, y: 0, l: 4.885, w: W, h: 2 * H });
  M.sa = box({ x: L + 0.15, y: 2 * W, z: 0, l: 2.991, w: W, h: H, color: "white", door: true });

  function bounds(keys, pad) {
    var xs = [], ys = [];
    keys.forEach(function (k) { M[k].pts.forEach(function (p) { xs.push(p[0]); ys.push(p[1]); }); });
    var minx = Math.min.apply(0, xs) - pad, maxx = Math.max.apply(0, xs) + pad;
    var miny = Math.min.apply(0, ys) - pad, maxy = Math.max.apply(0, ys) + pad;
    var w = maxx - minx, h = maxy - miny, cx = (minx + maxx) / 2, cy = (miny + maxy) / 2;
    if (w / h > 4 / 3) h = w * 3 / 4; else w = h * 4 / 3;
    return [cx - w / 2, cy - h / 2, w, h].map(function (n) { return n.toFixed(1); }).join(" ");
  }
  var VB = [
    bounds(["g2"], 46),
    bounds(["g0", "g1", "g2"], 34),
    bounds(["g0", "g1", "g2", "u0", "u1", "u2"], 26),
    bounds(["g0", "g1", "g2", "u0", "u1", "u2", "tw", "sa"], 22)
  ];

  var STEPS = [
    { at: 0, mod: "01", qm: "15", gs: "1" },
    { at: 1.0, mod: "03", qm: "44", gs: "1" },
    { at: 3.4, mod: "06", qm: "89", gs: "2" },
    { at: 6.0, mod: "07", qm: "96", gs: "2" },
    { at: 8.0, mod: "07", qm: "96", gs: "2" }
  ];
  var stepEls = Array.prototype.slice.call(document.querySelectorAll(".hstep"));
  var rMod = document.getElementById("r-mod"), rQm = document.getElementById("r-qm"), rGs = document.getElementById("r-gs");
  var bar = document.querySelector(".hero-bar i");
  var cur = -1;
  function setStep(i) {
    if (i === cur) return;
    cur = i;
    stepEls.forEach(function (s, k) { s.classList.toggle("is-on", k === i); });
    rMod.textContent = STEPS[i].mod; rQm.textContent = STEPS[i].qm; rGs.textContent = STEPS[i].gs;
  }

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!window.gsap || !window.ScrollTrigger || reduce) {
    // Endzustand ohne Animation
    svg.setAttribute("viewBox", VB[3]);
    Object.keys(M).forEach(function (k) { M[k].cable.style.opacity = 0; });
    document.querySelectorAll("#iso .lit").forEach(function (l) { l.setAttribute("opacity", 0.9); });
    setStep(4);
    if (bar) bar.style.transform = "scaleX(1)";
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  svg.setAttribute("viewBox", VB[0]);
  setStep(0);

  // Startzustand: nur das erste Modul steht
  ["g0", "g1", "u0", "u1", "u2", "tw", "sa"].forEach(function (k) {
    gsap.set(M[k].g, { y: -260, opacity: 0 });
    if (M[k].shadow) gsap.set(M[k].shadow, { opacity: 0 });
  });
  gsap.set(M.g2.cable, { opacity: 0 });

  var tl = gsap.timeline({ paused: true, defaults: { ease: "none" } });
  function drop(k, at, dur) {
    var m = M[k];
    tl.fromTo(m.g, { y: -260 }, { y: 0, duration: dur, ease: "power3.out" }, at);
    tl.fromTo(m.g, { opacity: 0 }, { opacity: 1, duration: dur * 0.3 }, at);
    if (m.shadow) tl.fromTo(m.shadow, { opacity: 0 }, { opacity: 1, duration: dur * 0.5 }, at + dur * 0.5);
    tl.fromTo(m.cable, { opacity: 1 }, { opacity: 0, duration: 0.3 }, at + dur);
  }
  // 1: Dreieranlage
  tl.to(svg, { attr: { viewBox: VB[1] }, duration: 1.4, ease: "power1.inOut" }, 1.0);
  drop("g1", 1.1, 0.8);
  drop("g0", 1.7, 0.8);
  // 2: Obergeschoss
  tl.to(svg, { attr: { viewBox: VB[2] }, duration: 1.4, ease: "power1.inOut" }, 3.4);
  drop("u0", 3.5, 0.7);
  drop("u1", 4.0, 0.7);
  drop("u2", 4.5, 0.7);
  // 3: Treppenturm + Sanitaer
  tl.to(svg, { attr: { viewBox: VB[3] }, duration: 1.3, ease: "power1.inOut" }, 6.0);
  drop("tw", 6.1, 0.8);
  drop("sa", 6.7, 0.7);
  // 4: Licht an
  tl.to("#iso .lit", { attr: { opacity: 0.92 }, duration: 0.7, stagger: 0.04 }, 8.0);
  tl.to({}, { duration: 1.6 }, 8.9); // Endbild stehen lassen
  var total = tl.duration();

  var hdr = document.querySelector(".hdr");
  ScrollTrigger.create({
    trigger: ".hero",
    start: function () { return "top " + (hdr ? hdr.offsetHeight : 0) + "px"; },
    end: function () { return "+=" + Math.round(window.innerHeight * 4.2); },
    pin: true,
    scrub: 0.7,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    animation: tl,
    onUpdate: function (self) {
      var t = self.progress * total, i = 0;
      for (var k = 0; k < STEPS.length; k++) if (t >= STEPS[k].at - 0.05) i = k;
      setStep(i);
      if (bar) bar.style.transform = "scaleX(" + self.progress.toFixed(4) + ")";
    }
  });
})();
