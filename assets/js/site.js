/* Greyrock Finance: one-page site behaviour. No libraries, no build step. */
(function () {
  "use strict";

  var doc = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- intro curtain, then the hero entrance ---------- */
  function ready() {
    requestAnimationFrame(function () { requestAnimationFrame(function () { doc.classList.add("is-ready"); }); });
  }
  var curtain = $(".curtain");
  if (doc.classList.contains("js-intro") && curtain) {
    try { sessionStorage.setItem("grf-intro", "1"); } catch (e) {}
    setTimeout(function () {
      curtain.classList.add("out");
      ready();
      setTimeout(function () { doc.classList.remove("js-intro"); }, 1000);
    }, 1800);
  } else {
    ready();
  }

  /* ---------- mobile menu ---------- */
  var menuBtn = $(".menu-btn"), mnav = $("#mnav");
  function setMenu(open) {
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.classList.toggle("menu-open", open);
    if (open) {
      mnav.hidden = false;
      requestAnimationFrame(function () { mnav.classList.add("open"); });
    } else {
      mnav.classList.remove("open");
      setTimeout(function () { if (!mnav.classList.contains("open")) mnav.hidden = true; }, 450);
    }
  }
  if (menuBtn && mnav) {
    menuBtn.addEventListener("click", function () { setMenu(menuBtn.getAttribute("aria-expanded") !== "true"); });
    $$("a", mnav).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menuBtn.getAttribute("aria-expanded") === "true") { setMenu(false); menuBtn.focus(); }
    });
    window.matchMedia("(min-width: 901px)").addEventListener("change", function (m) { if (m.matches) setMenu(false); });
  }

  /* ---------- scroll reveals ---------- */
  var rvs = $$(".rv");
  if ("IntersectionObserver" in window) {
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); rio.unobserve(en.target); }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -6% 0px" });
    rvs.forEach(function (el) { rio.observe(el); });

    /* active nav link: every section is watched, so sections without a link (hero, letter, statement) clear it */
    var links = $$(".nav a");
    var nio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle("active", !!en.target.id && a.getAttribute("href") === "#" + en.target.id); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    $$("main > section").forEach(function (s) { nio.observe(s); });
  } else {
    rvs.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- mandate cards: light follows the pointer ---------- */
  $$(".md").forEach(function (card) {
    card.addEventListener("pointermove", function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty("--mx", (e.clientX - r.left) + "px");
      card.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
  });

  /* ---------- guilloché: engraved spirograph lines, like banknotes and metal cards ---------- */
  // Hypotrochoid layers drawn once into each <svg data-guilloche>. R and r are coprime, so each curve closes.
  var GUILLOCHE = {
    card: { R: 60, r: 13, ds: [9, 15, 21], width: .35 },
    rosette: { R: 80, r: 21, ds: [12, 22, 32, 42], width: .22 }
  };
  $$("[data-guilloche]").forEach(function (svg) {
    var g = GUILLOCHE[svg.getAttribute("data-guilloche")];
    if (!g) return;
    var k = g.R - g.r, maxR = k + g.ds[g.ds.length - 1], s = 96 / maxR, turns = g.r, steps = turns * 150;
    var html = "";
    g.ds.forEach(function (d, li) {
      var pts = [];
      for (var j = 0; j <= steps; j++) {
        var t = (j / steps) * Math.PI * 2 * turns;
        var x = k * Math.cos(t) + d * Math.cos((k / g.r) * t);
        var y = k * Math.sin(t) - d * Math.sin((k / g.r) * t);
        pts.push((x * s).toFixed(2) + " " + (y * s).toFixed(2));
      }
      html += '<path d="M' + pts.join("L") + 'Z" stroke-opacity="' + (1 - li * 0.15).toFixed(2) + '"/>';
    });
    svg.setAttribute("viewBox", "-100 -100 200 200");
    svg.innerHTML = '<g fill="none" stroke="url(#metal)" stroke-width="' + g.width + '">' + html + "</g>";
  });

  /* ---------- scroll-linked: header, approach line, statement rosette ---------- */
  var hdr = $(".hdr"), steps = $(".steps"), stepEls = $$(".step"), mark = $(".statement-rosette");
  var wide = window.matchMedia("(min-width: 1001px)");
  var ticking = false;
  function frame() {
    ticking = false;
    var vh = window.innerHeight;
    hdr.classList.toggle("scrolled", window.scrollY > 24);
    if (steps) {
      var r = steps.getBoundingClientRect();
      // Wide: the gold line fills left to right over ~half a screen of scrolling. Narrow: steps light up as they pass 70% height.
      if (wide.matches) {
        var p = Math.min(1, Math.max(0, (vh * 0.82 - r.top) / (vh * 0.5)));
        steps.style.setProperty("--p", p.toFixed(3));
        stepEls.forEach(function (el, i) { el.classList.toggle("lit", p >= i / stepEls.length + 0.02); });
      } else {
        stepEls.forEach(function (el) { el.classList.toggle("lit", el.getBoundingClientRect().top < vh * 0.7); });
      }
    }
    if (mark && !reduce) {
      var s = mark.parentNode.getBoundingClientRect();
      if (s.bottom > 0 && s.top < vh) {
        var off = s.top + s.height / 2 - vh / 2;
        mark.style.setProperty("--py", (off * -0.12).toFixed(1) + "px");
        mark.style.setProperty("--rot", (off * 0.03).toFixed(2) + "deg");
      }
    }
  }
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
  window.addEventListener("resize", frame);
  frame();

  /* ---------- hero: silk light ribbon + the black card that tilts toward the pointer ---------- */
  var cv = $(".silk"), card = $(".bcard");
  if (cv && cv.getContext) {
    var ctx = cv.getContext("2d");
    var W = 0, H = 0, dpr = 1, mx = 0.5, my = 0.5, tx = 0.5, ty = 0.5;
    var running = false, onScreen = true, raf = 0;
    var lastMove = -1e9, rx = 6, ry = -14;

    var size = function () {
      var r = cv.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    var draw = function (t) {
      ctx.clearRect(0, 0, W, H);
      mx += (tx - mx) * 0.03; my += (ty - my) * 0.03;
      var narrow = W < 700;
      var n = narrow ? 34 : 56, step = narrow ? 9 : 7;
      // A twisted silk ribbon: every thread sits at offset u across the ribbon width, and the width is scaled by
      // cos(twist). Where the twist turns edge-on the threads bunch up, and additive blending makes those folds glow.
      ctx.globalCompositeOperation = "lighter";
      ctx.lineWidth = 1;
      for (var i = 0; i < n; i++) {
        var u = i / (n - 1) - 0.5;
        ctx.beginPath();
        for (var x = -40; x <= W + 40; x += step) {
          var X = x / W;
          var twist = X * 3.6 + t * 0.00016 + (mx - 0.5) * 0.9;
          var centre = H * (narrow ? 0.62 - 0.2 * X : 0.78 - 0.5 * X) + Math.sin(X * 4.2 + t * 0.0001) * H * 0.09 + (my - 0.5) * H * 0.05;
          var width = H * (narrow ? 0.2 : 0.3) * (0.75 + 0.25 * Math.sin(X * 2.3 - t * 0.00007));
          var y = centre + u * width * Math.cos(twist) + Math.sin(X * 11 + i * 0.4 + t * 0.0003) * 1.5;
          if (x === -40) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        var edge = Math.abs(u) > 0.47;
        var a = edge ? 0.22 : 0.035 + 0.05 * (1 - Math.abs(u) * 2);
        ctx.strokeStyle = i % 6 === 0 ? "rgba(234,220,194," + (a * 1.8).toFixed(3) + ")" : "rgba(255,255,255," + a.toFixed(3) + ")";
        ctx.stroke();
      }
      ctx.globalCompositeOperation = "source-over";
    };

    // Card tilt: follows the pointer while it moves, otherwise sways slowly on its own.
    var tiltCard = function (t) {
      if (!card) return;
      var trx, tryy;
      if (t - lastMove < 2500) {
        var r = card.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        var px = Math.max(-1, Math.min(1, (tx * window.innerWidth - cx) / (window.innerWidth / 2)));
        var py = Math.max(-1, Math.min(1, (ty * window.innerHeight - cy) / (window.innerHeight / 2)));
        tryy = px * 18; trx = -py * 12;
      } else {
        tryy = -12 + Math.sin(t * 0.00045) * 10; trx = 5 + Math.cos(t * 0.00038) * 4;
      }
      rx += (trx - rx) * 0.06; ry += (tryy - ry) * 0.06;
      card.style.setProperty("--rx", rx.toFixed(2) + "deg");
      card.style.setProperty("--ry", ry.toFixed(2) + "deg");
      card.style.setProperty("--sx", (50 - ry * 2.6 - rx * 1.2).toFixed(1) + "%");
    };

    var loop = function (t) { draw(t); tiltCard(t); if (running) raf = requestAnimationFrame(loop); };
    var start = function () {
      if (running || reduce || !onScreen || document.hidden) return;
      running = true; raf = requestAnimationFrame(loop);
    };
    var stop = function () { running = false; cancelAnimationFrame(raf); };

    size();
    draw(reduce ? 0 : performance.now());
    if (!reduce) {
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (es) { onScreen = es[0].isIntersecting; if (onScreen) start(); else stop(); }).observe(cv);
      } else start();
      document.addEventListener("visibilitychange", function () { if (document.hidden) stop(); else start(); });
      window.addEventListener("pointermove", function (e) {
        if (e.pointerType !== "mouse") return; // touch: keep the idle sway instead of jumping to the finger
        tx = e.clientX / window.innerWidth; ty = e.clientY / window.innerHeight; lastMove = performance.now();
      }, { passive: true });
    }
    var lastW = 0;
    window.addEventListener("resize", function () {
      // Phones fire resize when the address bar hides; only redraw for real width changes.
      if (Math.abs(window.innerWidth - lastW) < 2 && running) return;
      lastW = window.innerWidth;
      size(); if (!running) draw(reduce ? 0 : performance.now());
    });
    lastW = window.innerWidth;
  }

  /* ---------- calculator: a working desk calculator with finance keys ---------- */
  // Arithmetic works like a pocket calculator: each operator applies to the running total (no precedence).
  // Finance keys (n, i%, PV, FV): type a number and press a key to store it; press a key without typing a number
  // to solve it from the other three, using FV = PV × (1 + i)^n.
  // GR sets the rate to Greyrock's illustration rate (owner's figure for this private friends-and-family site; the
  // copy and fine print beside the calculator must change with it).
  var GR_RATE = 34;
  var dev = $(".device");
  if (dev) {
    var mainEl = $("#lcd-main"), metaEl = $("#lcd-meta"), calcField = $("#f-calc");
    var MAX_DIGITS = 12;
    var cur = "0", acc = null, op = null, fresh = true, entered = false, lastOp = null, lastVal = null, error = false;
    var reg = { n: null, i: null, pv: null, fv: null };
    var note = "", rollT = 0, playing = false;
    var OPS = { "+": "+", "-": "−", "*": "×", "/": "÷" };
    var LABEL = { n: "n", i: "i", pv: "PV", fv: "FV" }; // display names; the rate gets its "%" after the number

    // 10 significant digits removes float noise (0.1 + 0.2 → 0.3).
    var tidy = function (x) { return isFinite(x) ? parseFloat(x.toPrecision(10)) : NaN; };
    var toStr = function (x) {
      x = tidy(x);
      if (isNaN(x)) return "Error";
      if (Math.abs(x) >= 1e15 || (x !== 0 && Math.abs(x) < 1e-6)) return x.toExponential(5);
      return String(x);
    };
    // Lakh/crore grouping (1,00,00,000) on the integer part; keeps exactly what was typed after the point.
    var fmt = function (s) {
      if (/e/.test(s)) return s.replace("-", "−");
      var neg = s.charAt(0) === "-";
      if (neg) s = s.slice(1);
      var parts = s.split(".");
      return (neg ? "−" : "") + Number(parts[0]).toLocaleString("en-IN") + (parts.length > 1 ? "." + parts[1] : "");
    };
    var regText = function (k) { return LABEL[k] + " " + fmt(toStr(Math.round(reg[k] * 100) / 100)) + (k === "i" ? "%" : ""); };

    var paint = function () {
      var shown = error ? "Error" : fmt(cur);
      mainEl.textContent = shown;
      mainEl.classList.toggle("err", error);
      var len = shown.replace(/[^0-9]/g, "").length;
      mainEl.classList.toggle("s1", len > 9 && len <= 12);
      mainEl.classList.toggle("s2", len > 12);
      var meta = note;
      if (!meta) {
        var bits = [];
        ["n", "i", "pv", "fv"].forEach(function (k) { if (reg[k] !== null) bits.push(regText(k)); });
        if (acc !== null && op) bits.push(fmt(toStr(acc)) + " " + OPS[op]);
        meta = bits.join("  ·  ");
      }
      metaEl.textContent = meta;
      $$(".k-op", dev).forEach(function (b) { b.classList.toggle("on", !!op && fresh && b.getAttribute("data-k") === op); });
      $$(".k-fin", dev).forEach(function (b) { b.classList.toggle("set", reg[b.getAttribute("data-k")] !== null); });
      $(".k-gr", dev).classList.toggle("set", reg.i === GR_RATE);
      var ac = $('[data-k="ac"]', dev), typing = !fresh && cur !== "0";
      ac.textContent = typing ? "C" : "AC";
      ac.setAttribute("aria-label", typing ? "Clear entry" : "All clear");
    };

    // Result digits spin briefly before settling, like a mechanical counter (skipped with reduced motion).
    var roll = function () {
      paint();
      if (reduce) return;
      var final = mainEl.textContent, start = performance.now();
      cancelAnimationFrame(rollT);
      mainEl.setAttribute("aria-busy", "true");
      var step = function (now) {
        var p = Math.min(1, (now - start) / 560), out = "";
        for (var j = 0; j < final.length; j++) {
          var ch = final.charAt(j);
          out += /\d/.test(ch) && j / final.length >= p ? String(Math.floor(Math.random() * 10)) : ch;
        }
        mainEl.textContent = out;
        if (p < 1) rollT = requestAnimationFrame(step);
        else { mainEl.textContent = final; mainEl.removeAttribute("aria-busy"); }
      };
      rollT = requestAnimationFrame(step);
    };

    var apply = function (a, o, b) { return o === "+" ? a + b : o === "-" ? a - b : o === "*" ? a * b : b === 0 ? NaN : a / b; };
    var setResult = function (x) {
      var s = toStr(x);
      if (s === "Error") { error = true; cur = "0"; } else cur = s;
      fresh = true;
    };
    var solve = function (k) {
      var n = reg.n, i = reg.i === null ? null : reg.i / 100, pv = reg.pv, fv = reg.fv;
      var need = { n: [i, pv, fv], i: [n, pv, fv], pv: [n, i, fv], fv: [n, i, pv] }[k];
      if (need.some(function (v) { return v === null; })) return null;
      if (k === "fv") return pv * Math.pow(1 + i, n);
      if (k === "pv") return fv / Math.pow(1 + i, n);
      if (k === "n") return fv / pv > 0 && i > -1 && i !== 0 ? Math.log(fv / pv) / Math.log(1 + i) : NaN;
      return fv / pv > 0 && n !== 0 ? (Math.pow(fv / pv, 1 / n) - 1) * 100 : NaN;
    };
    var summarise = function () {
      // One line travels with the enquiry, so a partner sees what the visitor worked out.
      if (!calcField) return;
      calcField.value = ["n", "i", "pv", "fv"].filter(function (k) { return reg[k] !== null; }).map(regText).join(", ");
    };

    var press = function (k) {
      if (error && k !== "ac") { error = false; cur = "0"; acc = null; op = null; fresh = true; }
      note = "";
      if (/^[0-9]$/.test(k)) {
        if (fresh) { cur = k; fresh = false; }
        else if (cur.replace(/[-.]/g, "").length < MAX_DIGITS) cur = cur === "0" ? k : cur === "-0" ? "-" + k : cur + k;
        entered = true;
      } else if (k === ".") {
        if (fresh) { cur = "0."; fresh = false; } else if (cur.indexOf(".") < 0) cur += ".";
        entered = true;
      } else if (k === "back") {
        if (!fresh) { cur = cur.slice(0, -1); if (cur === "" || cur === "-") cur = "0"; }
      } else if (k === "neg") {
        if (cur !== "0") { cur = cur.charAt(0) === "-" ? cur.slice(1) : "-" + cur; entered = true; }
      } else if (k === "pct") {
        var v = parseFloat(cur);
        setResult(acc !== null && (op === "+" || op === "-") ? acc * v / 100 : v / 100);
        entered = true;
      } else if (OPS[k]) {
        if (op !== null && acc !== null && !fresh) {
          setResult(apply(acc, op, parseFloat(cur)));
          if (error) { paint(); return; }
        }
        acc = parseFloat(cur); op = k; fresh = true; lastOp = null; entered = false;
      } else if (k === "=") {
        if (op !== null && acc !== null) {
          lastOp = op; lastVal = parseFloat(cur);
          setResult(apply(acc, op, lastVal)); acc = null; op = null;
        } else if (lastOp) setResult(apply(parseFloat(cur), lastOp, lastVal)); // repeat the last operation
        entered = true;
      } else if (k === "ac") {
        var allClear = cur === "0" && acc === null && op === null && !error;
        if (!fresh && cur !== "0") { cur = "0"; fresh = true; } // "C": clear just the entry
        else {
          cur = "0"; acc = null; op = null; lastOp = null; error = false; fresh = true;
          if (allClear && ["n", "i", "pv", "fv"].some(function (r) { return reg[r] !== null; })) {
            reg = { n: null, i: null, pv: null, fv: null }; note = "Finance keys cleared";
          }
        }
        entered = false;
      } else if (k === "gr") {
        reg.i = GR_RATE; fresh = true; entered = false; acc = null; op = null;
        cur = String(GR_RATE); note = "i " + GR_RATE + "% · Greyrock rate";
      } else if (LABEL[k]) {
        if (entered) {
          // store the number on screen
          reg[k] = parseFloat(cur); fresh = true; entered = false; acc = null; op = null;
          note = regText(k) + " stored";
        } else {
          var r = solve(k);
          if (r === null) note = "Enter the other three first";
          else if (isNaN(r)) error = true;
          else {
            reg[k] = r; setResult(Math.round(r * 100) / 100); entered = false;
            note = LABEL[k] + " = " + fmt(cur) + (k === "i" ? "%" : "");
            summarise(); roll(); return;
          }
        }
      }
      paint();
    };

    var flash = function (k) {
      var b = $('[data-k="' + k + '"]', dev);
      if (!b) return;
      b.classList.add("pressed");
      setTimeout(function () { b.classList.remove("pressed"); }, 140);
    };
    dev.addEventListener("click", function (e) {
      var b = e.target.closest("[data-k]");
      if (b && !playing) press(b.getAttribute("data-k"));
    });

    // Physical keyboard works while the pointer is over the calculator or a key has focus.
    var KEYMAP = { Enter: "=", "=": "=", Backspace: "back", Escape: "ac", Delete: "ac", "%": "pct", "+": "+", "-": "-", "*": "*", x: "*", "/": "/", ".": ".", ",": ".", g: "gr", G: "gr" };
    document.addEventListener("keydown", function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey || playing) return;
      var a = document.activeElement;
      if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return;
      if (!dev.contains(a) && !dev.matches(":hover")) return;
      var k = /^[0-9]$/.test(e.key) ? e.key : KEYMAP[e.key];
      if (!k) return;
      e.preventDefault();
      flash(k); press(k);
    });

    // Examples press the keys themselves, one by one.
    var DEMOS = {
      grow: ["ac", "1", "pv", "gr", "1", "0", "n", "fv"],
      double: ["ac", "1", "pv", "2", "fv", "gr", "n"],
      five: ["ac", "5", "pv", "gr", "5", "n", "fv"]
    };
    $$(".demo").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (playing) return;
        var seq = DEMOS[btn.getAttribute("data-demo")];
        $$(".demo").forEach(function (d) { d.setAttribute("aria-pressed", String(d === btn)); });
        // start from a clean machine
        cur = "0"; acc = null; op = null; fresh = true; entered = false; lastOp = null; error = false;
        reg = { n: null, i: null, pv: null, fv: null };
        if (reduce) { seq.forEach(press); return; }
        playing = true;
        var j = 0;
        var tick = function () {
          flash(seq[j]); press(seq[j]); j++;
          if (j < seq.length) setTimeout(tick, 240); else playing = false;
        };
        tick();
      });
    });

    paint();
  }

  /* ---------- enquiry form ---------- */
  // Apps Script web app URL (ends in /exec). Empty = enquiries stay in the visitor's browser only.
  var ENQUIRY_WEBHOOK = "https://script.google.com/macros/s/AKfycbzEfX5S-e2jdcASKQvTiYmdjZ_BN2khLr04I3iHq2X2KVrC9sZA5TxlnRhxg7AdYFRM/exec";
  var form = $(".enq-form"), done = $(".enq-done");
  if (form && done) {
    var rules = {
      name: function (v) { return v.trim().length >= 2 || "Please tell us your name."; },
      phone: function (v) {
        return /^(?:\+?880|0)1[3-9]\d{8}$/.test(v.replace(/[\s()-]/g, "")) || "Please enter a Bangladeshi mobile number, e.g. 01712 345678.";
      },
      email: function (v) { v = v.trim(); return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || "That email address doesn't look right."; },
      assets: function (v) { return !!v || "Please choose a range. It helps us prepare for the conversation."; },
      consent: function (v, el) { return el.checked || "Please confirm before sending."; }
    };
    var check = function (el) {
      var rule = rules[el.name];
      if (!rule) return true;
      var res = rule(el.value, el), ok = res === true;
      var field = el.closest(".field"), msg = field && $(".err-msg", field);
      if (field) field.classList.toggle("err", !ok);
      el.setAttribute("aria-invalid", String(!ok));
      if (msg) msg.textContent = ok ? "" : res;
      return ok;
    };
    form.addEventListener("blur", function (e) {
      var el = e.target;
      if (el.name && rules[el.name] && el.type !== "checkbox" && el.value) check(el);
    }, true);
    var recheck = function (e) {
      var f = e.target.closest && e.target.closest(".field");
      if (f && f.classList.contains("err")) check(e.target);
    };
    form.addEventListener("input", recheck);
    form.addEventListener("change", recheck);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var bad = Object.keys(rules).map(function (n) { return form.elements[n]; }).filter(function (el) { return el && !check(el); });
      if (bad.length) { bad[0].focus(); return; }

      var btn = $("button[type=submit]", form);
      btn.disabled = true;
      $(".btn-label", btn).textContent = "Sending…";
      var data = { createdAt: new Date().toISOString(), page: location.pathname };
      new FormData(form).forEach(function (v, k) { data[k] = typeof v === "string" ? v.trim() : v; });
      data.consent = true;

      // Delivery: the partners' Google Sheet (Apps Script web app, see deploy/google-sheet-enquiries.gs).
      // No CORS on Apps Script, so send a "simple" no-cors request and don't read the reply.
      // If it can't be reached (or no URL is set), keep the request on this device as before.
      var keepLocal = function () {
        try {
          var all = JSON.parse(localStorage.getItem("grf-enquiries") || "[]");
          all.push(data);
          localStorage.setItem("grf-enquiries", JSON.stringify(all));
        } catch (err) {}
      };
      var send = ENQUIRY_WEBHOOK && window.fetch
        ? fetch(ENQUIRY_WEBHOOK, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(data) })
            .catch(keepLocal)
        : Promise.resolve(keepLocal());
      var minWait = new Promise(function (r) { setTimeout(r, 900); });

      Promise.all([send, minWait]).then(function () {
        $(".done-name", done).textContent = data.name.split(/\s+/)[0];
        form.hidden = true;
        done.hidden = false;
        done.focus();
      });
    });
  }

  var yr = $("#yr");
  if (yr) yr.textContent = String(new Date().getFullYear());
})();
