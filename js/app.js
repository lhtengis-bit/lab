/* =================================================================
   Wooting 80HE — app.js
   Hand-written JavaScript. No frameworks / libraries.
   Contains: AJAX page-transition engine, custom TAB, SLIDE (slideshow)
   and CAROUSEL components, animated counters, scroll-reveal,
   mobile nav, Laboratory dropdown menu and form validation.
   ================================================================= */
(function () {
  "use strict";

  /* -----------------------------------------------------------------
     Small helpers
  ----------------------------------------------------------------- */
  var $  = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* =================================================================
     1) AJAX PAGE TRANSITIONS  (2 points)
     Internal links are loaded with XMLHttpRequest and only the
     #app region is swapped in — no full page reload. Falls back to
     a normal browser navigation if the request fails (e.g. file://).
  ================================================================= */
  var loadbar = null;

  function startLoadbar() {
    if (!loadbar) return;
    loadbar.classList.add("is-active");
    loadbar.style.width = "20%";
    setTimeout(function () { loadbar.style.width = "65%"; }, 120);
  }
  function endLoadbar() {
    if (!loadbar) return;
    loadbar.style.width = "100%";
    setTimeout(function () {
      loadbar.classList.remove("is-active");
      loadbar.style.width = "0";
    }, 250);
  }

  function loadPage(url, push) {
    var app = $("#app");
    if (!app) { window.location.href = url; return; }

    startLoadbar();
    app.classList.add("is-swapping");

    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);

    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;

      if (xhr.status >= 200 && xhr.status < 400) {
        try {
          var doc = new DOMParser().parseFromString(xhr.responseText, "text/html");
          var newApp = doc.getElementById("app");
          if (!newApp) { window.location.href = url; return; }

          app.innerHTML = newApp.innerHTML;
          app.setAttribute("data-page", newApp.getAttribute("data-page") || "");
          if (doc.title) document.title = doc.title;

          if (push) { try { history.pushState({ url: url }, "", url); } catch (err) { /* file:// may reject pushState; content is still swapped */ } }
          window.scrollTo({ top: 0, behavior: "auto" });

          app.classList.remove("is-swapping");
          // restart entry animation
          app.style.animation = "none";
          /* eslint-disable no-unused-expressions */
          app.offsetHeight;
          app.style.animation = "";

          setActiveNav();
          closeMobileNav();
          initPage();      // wire up the components on the new page
          endLoadbar();
        } catch (e) {
          window.location.href = url;
        }
      } else {
        window.location.href = url; // graceful fallback
      }
    };

    xhr.onerror = function () { window.location.href = url; };
    xhr.send();
  }

  // Intercept clicks on internal navigation links
  document.addEventListener("click", function (e) {
    var a = e.target.closest ? e.target.closest("a") : null;
    if (!a) return;
    var href = a.getAttribute("href");
    if (!href) return;
    if (a.target === "_blank" || a.hasAttribute("download")) return;
    if (href.charAt(0) === "#") return;
    if (a.hostname !== window.location.hostname) return;     // external
    if (!/\.html$/.test(a.pathname)) return;                  // only our pages
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;

    e.preventDefault();
    if (a.pathname === window.location.pathname) { closeMobileNav(); return; }
    loadPage(a.href, true);
  });

  window.addEventListener("popstate", function () {
    loadPage(window.location.href, false);
  });

  /* =================================================================
     2) TAB COMPONENT  (2 points)  — features page
  ================================================================= */
  function initTabs() {
    $$(".tabs").forEach(function (tabs) {
      var buttons = $$(".tab", tabs);
      var panels  = $$(".tabpanel", tabs);
      if (!buttons.length) return;

      function select(i) {
        buttons.forEach(function (b, j) {
          var on = i === j;
          b.setAttribute("aria-selected", on ? "true" : "false");
          b.tabIndex = on ? 0 : -1;
        });
        panels.forEach(function (p, j) { p.classList.toggle("is-active", i === j); });
      }

      buttons.forEach(function (b, i) {
        b.addEventListener("click", function () { select(i); });
        b.addEventListener("keydown", function (e) {
          var ni = null;
          if (e.key === "ArrowRight") ni = (i + 1) % buttons.length;
          if (e.key === "ArrowLeft")  ni = (i - 1 + buttons.length) % buttons.length;
          if (ni !== null) { select(ni); buttons[ni].focus(); e.preventDefault(); }
        });
      });
      select(0);
    });
  }

  /* =================================================================
     3) SLIDE COMPONENT  (2 points)  — specs/gallery slideshow
     One slide visible at a time, prev/next + dots + autoplay.
  ================================================================= */
  function initSliders() {
    $$(".slider").forEach(function (slider) {
      var track = $(".slider-track", slider);
      var slides = $$(".slide", slider);
      var prev = $(".slider-btn.prev", slider);
      var next = $(".slider-btn.next", slider);
      var dotsWrap = $(".slider-dots", slider);
      if (!track || slides.length === 0) return;

      var index = 0, timer = null;
      var delay = parseInt(slider.getAttribute("data-autoplay"), 10) || 0;

      // build dots
      dotsWrap.innerHTML = "";
      slides.forEach(function (_, i) {
        var d = document.createElement("button");
        d.type = "button";
        d.setAttribute("aria-label", "Go to slide " + (i + 1));
        d.addEventListener("click", function () { go(i); });
        dotsWrap.appendChild(d);
      });
      var dots = $$("button", dotsWrap);

      function render() {
        track.style.transform = "translateX(" + (-index * 100) + "%)";
        dots.forEach(function (d, i) { d.classList.toggle("is-active", i === index); });
      }
      function go(i) { index = (i + slides.length) % slides.length; render(); }
      function nextSlide() { go(index + 1); }
      function prevSlide() { go(index - 1); }

      if (next) next.addEventListener("click", function () { nextSlide(); restart(); });
      if (prev) prev.addEventListener("click", function () { prevSlide(); restart(); });

      function start() { if (delay > 0) timer = setInterval(nextSlide, delay); }
      function stop()  { if (timer) { clearInterval(timer); timer = null; } }
      function restart() { stop(); start(); }

      slider.addEventListener("mouseenter", stop);
      slider.addEventListener("mouseleave", start);

      // keyboard arrows when focused
      slider.tabIndex = 0;
      slider.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight") { nextSlide(); restart(); }
        if (e.key === "ArrowLeft")  { prevSlide(); restart(); }
      });

      render();
      start();
    });
  }

  /* =================================================================
     4) CAROUSEL COMPONENT  (2 points)  — reviews (multi-item, loop)
     Shows several cards, advances by one card, responsive count.
  ================================================================= */
  function initCarousels() {
    $$(".carousel").forEach(function (car) {
      var track = $(".carousel-track", car);
      var items = $$(".review", track);
      var prev = $(".carousel-controls .prev", car);
      var next = $(".carousel-controls .next", car);
      if (!track || items.length === 0) return;

      var index = 0, timer = null;

      function perView() {
        var w = window.innerWidth;
        if (w <= 720) return 1;
        if (w <= 940) return 2;
        return 3;
      }
      function maxIndex() { return Math.max(0, items.length - perView()); }

      function render() {
        if (index > maxIndex()) index = maxIndex();
        var item = items[0];
        var style = window.getComputedStyle(track);
        var gap = parseFloat(style.columnGap || style.gap || "22") || 22;
        var step = item.getBoundingClientRect().width + gap;
        track.style.transform = "translateX(" + (-index * step) + "px)";
      }
      function go(i) {
        var m = maxIndex();
        if (i < 0) i = m;             // loop to end
        else if (i > m) i = 0;        // loop to start
        index = i; render();
      }

      if (next) next.addEventListener("click", function () { go(index + 1); restart(); });
      if (prev) prev.addEventListener("click", function () { go(index - 1); restart(); });

      function start() { timer = setInterval(function () { go(index + 1); }, 4500); }
      function stop()  { if (timer) { clearInterval(timer); timer = null; } }
      function restart() { stop(); start(); }

      car.addEventListener("mouseenter", stop);
      car.addEventListener("mouseleave", start);
      window.addEventListener("resize", render);

      render();
      start();
    });
  }

  /* =================================================================
     5) Animated number counters (JavaScript)
  ================================================================= */
  function animateCounter(el) {
    var target = parseFloat(el.getAttribute("data-target"));
    var decimals = parseInt(el.getAttribute("data-decimals"), 10) || 0;
    var dur = 1400, start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = (target * eased).toFixed(decimals);
      el.textContent = Number(val).toLocaleString("en-US", {
        minimumFractionDigits: decimals, maximumFractionDigits: decimals
      });
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* =================================================================
     6) Scroll reveal + counters via IntersectionObserver
  ================================================================= */
  var io = null;
  function initReveal() {
    if (io) io.disconnect();
    var targets = $$(".reveal, .counter");
    if (!("IntersectionObserver" in window)) {
      targets.forEach(function (el) {
        el.classList.add("in");
        if (el.classList.contains("counter")) animateCounter(el);
      });
      return;
    }
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        el.classList.add("in");
        if (el.classList.contains("counter") && !el.dataset.done) {
          el.dataset.done = "1";
          animateCounter(el);
        }
        io.unobserve(el);
      });
    }, { threshold: 0.18 });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* =================================================================
     7) Contact form validation (JavaScript)
  ================================================================= */
  function initForm() {
    var form = $("#contact-form");
    if (!form) return;
    var success = $(".form-success", form);

    function setError(field, msg) {
      var wrap = field.closest(".field");
      wrap.classList.add("has-error");
      var e = $(".error", wrap);
      if (e) e.textContent = msg;
    }
    function clearError(field) {
      var wrap = field.closest(".field");
      wrap.classList.remove("has-error");
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      var name = form.elements["name"];
      var email = form.elements["email"];
      var message = form.elements["message"];

      [name, email, message].forEach(clearError);

      if (!name.value.trim()) { setError(name, "Please enter your name."); ok = false; }
      var reEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!reEmail.test(email.value.trim())) { setError(email, "Please enter a valid email address."); ok = false; }
      if (message.value.trim().length < 10) { setError(message, "Message should be at least 10 characters."); ok = false; }

      if (ok) {
        form.reset();
        if (success) {
          success.classList.add("show");
          setTimeout(function () { success.classList.remove("show"); }, 6000);
        }
      }
    });

    // clear error as the user types
    $$("input, textarea", form).forEach(function (input) {
      input.addEventListener("input", function () { clearError(input); });
    });
  }

  /* =================================================================
     8) Shell: mobile nav, Laboratory dropdown, active link, top button
        (header/footer persist across AJAX swaps, so wired up once)
  ================================================================= */
  function setActiveNav() {
    var appEl = document.getElementById("app");
    var page = appEl ? (appEl.getAttribute("data-page") || "") : "";
    $$(".nav-links a").forEach(function (a) {
      a.classList.toggle("is-active", a.getAttribute("data-nav") === page);
    });
    // highlight the Laboratory parent when on any lab page
    var labToggle = $(".dropdown-toggle");
    if (labToggle) labToggle.classList.toggle("is-active", page.indexOf("lab") === 0);
  }
  function closeMobileNav() {
    var links = $(".nav-links"), toggle = $(".nav-toggle");
    if (links) links.classList.remove("is-open");
    if (toggle) toggle.classList.remove("is-open");
    $$(".nav-item.open").forEach(function (item) { item.classList.remove("open"); });
  }
  function initShell() {
    loadbar = $(".loadbar");

    var toggle = $(".nav-toggle"), links = $(".nav-links");
    if (toggle && links) {
      toggle.addEventListener("click", function () {
        var open = links.classList.toggle("is-open");
        toggle.classList.toggle("is-open", open);
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
      });
    }

    // Laboratory dropdown: click to toggle (also opens on hover via CSS)
    $$(".dropdown-toggle").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        var item = btn.closest(".nav-item");
        if (item) item.classList.toggle("open");
      });
    });
    // close the dropdown when clicking anywhere outside it
    document.addEventListener("click", function (e) {
      $$(".nav-item.open").forEach(function (item) {
        if (!item.contains(e.target)) item.classList.remove("open");
      });
    });

    var toTop = $(".to-top");
    if (toTop) {
      toTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
      window.addEventListener("scroll", function () {
        toTop.classList.toggle("show", window.scrollY > 600);
      });
    }
  }

  /* =================================================================
     initPage() — run after every load / AJAX swap
  ================================================================= */
  function initPage() {
    initTabs();
    initSliders();
    initCarousels();
    initForm();
    initReveal();
    setActiveNav();
  }

  /* boot */
  document.addEventListener("DOMContentLoaded", function () {
    initShell();
    initPage();
  });

})();
