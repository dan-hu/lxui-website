/* 上海芝诚包装 · 站点交互脚本 */
(function () {
  "use strict";

  /* ---------- 移动端导航 ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.style.overflow = open ? "hidden" : "";
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        links.classList.remove("open");
        document.body.style.overflow = "";
      });
    });
  }

  /* ---------- 当前导航高亮 ---------- */
  var path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach(function (a) {
    var href = a.getAttribute("href");
    if (href === path) a.classList.add("active");
  });

  /* ---------- 滚动显现 ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add("visible");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });

  /* ---------- 返回顶部 ---------- */
  var backTop = document.querySelector(".back-top");
  if (backTop) {
    window.addEventListener("scroll", function () {
      backTop.classList.toggle("show", window.scrollY > 480);
    }, { passive: true });
    backTop.addEventListener("click", function (ev) {
      ev.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ---------- 产品筛选 ---------- */
  var filterBar = document.querySelector(".filter-bar");
  if (filterBar) {
    var cards = document.querySelectorAll("[data-cat]");
    filterBar.addEventListener("click", function (ev) {
      var btn = ev.target.closest(".filter-btn");
      if (!btn) return;
      filterBar.querySelectorAll(".filter-btn").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      var cat = btn.getAttribute("data-filter");
      cards.forEach(function (c) {
        var show = cat === "all" || c.getAttribute("data-cat") === cat;
        c.style.display = show ? "" : "none";
      });
    });
  }

  /* ---------- 数字滚动 ---------- */
  var counters = document.querySelectorAll("[data-count]");
  if (counters.length) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        var target = parseInt(el.getAttribute("data-count"), 10);
        var suffix = el.getAttribute("data-suffix") || "";
        var start = performance.now();
        var dur = 1400;
        function tick(now) {
          var p = Math.min((now - start) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        cio.unobserve(el);
      });
    }, { threshold: 0.4 });
    counters.forEach(function (c) { cio.observe(c); });
  }

  /* ---------- 询价表单校验 ---------- */
  var form = document.getElementById("inquiry-form");
  if (form) {
    var success = document.getElementById("form-success");
    var rules = {
      name: function (v) { return v.trim().length >= 2 || "请填写您的姓名"; },
      phone: function (v) { return /^1[3-9]\d{9}$/.test(v.trim()) || /^0\d{2,3}-?\d{7,8}$/.test(v.trim()) || "请填写有效的联系电话"; },
      need: function (v) { return v.trim().length >= 5 || "请简单描述您的需求（不少于 5 个字）"; }
    };
    function validateField(input) {
      var rule = rules[input.name];
      var wrap = input.closest(".form-field");
      if (!rule) { wrap.classList.remove("invalid"); return true; }
      var res = rule(input.value);
      if (res === true) { wrap.classList.remove("invalid"); return true; }
      wrap.querySelector(".err").textContent = res;
      wrap.classList.add("invalid");
      return false;
    }
    form.querySelectorAll("input,textarea").forEach(function (input) {
      input.addEventListener("blur", function () { validateField(input); });
    });
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var ok = true;
      form.querySelectorAll("input,textarea").forEach(function (input) {
        if (!validateField(input)) ok = false;
      });
      if (!ok) return;

      /* 静态站没有后端：把填写内容整理成一封预填好的询价邮件，交给本机邮件客户端发送 */
      var val = function (n) {
        var el = form.elements[n];
        return el && el.value ? el.value.trim() : "";
      };
      var subject = "官网询价｜" + (val("company") || val("name") || "新客户") + "｜" + (val("type") || "包装需求");
      var body = [
        "姓名：" + val("name"),
        "电话：" + val("phone"),
        "公司：" + val("company"),
        "需求类型：" + val("type"),
        "",
        "需求描述：",
        val("need"),
        "",
        "（本邮件由芝诚包装官网询价表单生成，来源页面：" + location.href + "）"
      ].join("\n");

      window.location.href = "mailto:shang0707@vip.163.com"
        + "?subject=" + encodeURIComponent(subject)
        + "&body=" + encodeURIComponent(body);

      success.style.display = "block";
      success.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  /* ---------- 首页主题图轮播 ---------- */
  var slidesWrap = document.querySelector("[data-hero-slider]");
  if (slidesWrap) {
    var slides = Array.prototype.slice.call(slidesWrap.querySelectorAll(".hero-slide"));
    var dotsBox = document.querySelector(".hero-dots");
    var dots = dotsBox ? Array.prototype.slice.call(dotsBox.querySelectorAll("button")) : [];
    var caption = document.querySelector("[data-hero-caption]");
    var heroSec = document.querySelector(".hero");
    var INTERVAL = 6500;
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var idx = 0, timer = null;

    function show(n) {
      idx = (n + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle("is-active", k === idx); });
      dots.forEach(function (d, k) {
        d.classList.remove("is-active");
        if (k === idx) { void d.offsetWidth; d.classList.add("is-active"); } /* 重置进度条动画 */
      });
      if (caption) caption.textContent = slides[idx].getAttribute("data-theme") || "";
    }
    function play() { if (reduced) return; stop(); timer = setInterval(function () { show(idx + 1); }, INTERVAL); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }

    dots.forEach(function (d, k) {
      d.addEventListener("click", function () { show(k); play(); });
    });
    if (heroSec) {
      heroSec.addEventListener("mouseenter", stop);
      heroSec.addEventListener("mouseleave", play);
    }
    document.addEventListener("visibilitychange", function () {
      document.hidden ? stop() : play();
    });
    play();
  }

  /* ---------- 年份 ---------- */
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();
