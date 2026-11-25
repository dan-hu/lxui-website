/**
 * 文件用途：首页的数据渲染
 * 职责：从后端接口取产品、行业方案、精选案例，渲染成卡片
 */

(function () {
  'use strict';

  const { api, esc, lines, initReveal } = window.LX;

  /* ------------------------- 主视觉轮播 ------------------------- */
  /**
   * 4 张主视觉图交替淡入淡出，间隔 7 秒；
   * 点击右上角切换条可立即跳转，标签页隐藏时暂停，系统开了「减少动态效果」则不自动播放
   */
  function initHeroSlider() {
    const host = document.querySelector('[data-hero-slider]');
    if (!host) return;

    const slides = Array.from(host.querySelectorAll('.hero__slide'));
    const dots = Array.from(document.querySelectorAll('.hero__dots button'));
    const caption = document.querySelector('[data-hero-cap]');
    const INTERVAL = 7000;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let index = 0;
    let timer = null;

    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach((s, i) => s.classList.toggle('is-active', i === index));
      dots.forEach((d, i) => {
        d.classList.remove('is-active');
        if (i === index) {
          // 重排一次让进度条动画从头播放
          void d.offsetWidth;
          d.classList.add('is-active');
          d.setAttribute('aria-current', 'true');
        } else {
          d.removeAttribute('aria-current');
        }
      });
      if (caption) caption.textContent = slides[index].dataset.cap || '';
    }

    function play() {
      if (reduced) return;
      stop();
      timer = setInterval(() => show(index + 1), INTERVAL);
    }
    function stop() {
      if (timer) { clearInterval(timer); timer = null; }
    }

    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => { show(i); play(); });
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop(); else play();
    });

    show(0);
    play();
  }

  /* ------------------------- 产品卡片 ------------------------- */
  function productCard(p, index) {
    const tags = (p.use_cases ? p.use_cases.split('\n') : []).slice(0, 2);
    return `
      <article class="card reveal">
        <div class="card__index">${String(index + 1).padStart(2, '0')}</div>
        <h3>${esc(p.name)}</h3>
        <p>${esc(p.tagline || p.summary)}</p>
        <div class="card__tags">${tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
        <a class="card__link" href="products.html#${esc(p.slug)}">查看详情 <span class="arrow">→</span></a>
      </article>`;
  }

  async function renderProducts() {
    const host = document.getElementById('product-grid');
    if (!host) return;
    host.innerHTML = Array.from({ length: 4 }, () => '<div class="card skeleton"></div>').join('');
    try {
      const list = await api('/api/products');
      // 首页只展示前 8 个品类，保持 4×2 的栅格；RFID 这类新增品类在导航与产品页露出
      host.innerHTML = list.slice(0, 8).map(productCard).join('');
    } catch (err) {
      host.innerHTML = `<div class="empty-state" style="grid-column:1/-1">产品数据加载失败：${esc(err.message)}</div>`;
    }
  }

  /* ------------------------- 行业方案（首页简版） ------------------------- */
  function solutionCard(s, index) {
    const first = lines(s.pain_points)[0] || '';
    return `
      <article class="card reveal">
        <div class="card__index">${String(index + 1).padStart(2, '0')}</div>
        <h3>${esc(s.name)}</h3>
        <p>${esc(s.summary)}</p>
        ${first ? `<div class="card__tags"><span class="tag">难点：${esc(first.replace(/^.*?[，,。]/, '').slice(0, 16))}</span></div>` : ''}
      </article>`;
  }

  async function renderSolutions() {
    const host = document.getElementById('solution-grid');
    if (!host) return;
    try {
      const list = await api('/api/solutions');
      host.innerHTML = list.slice(0, 8).map(solutionCard).join('');
    } catch (err) {
      host.innerHTML = `<div class="empty-state" style="grid-column:1/-1">行业方案加载失败</div>`;
    }
  }

  /* ------------------------- 精选案例 ------------------------- */
  function caseCard(c) {
    return `
      <a class="case-card reveal" href="case-detail.html?id=${c.id}">
        <div class="case-card__media">
          <img src="${esc(c.cover || 'assets/img/labels-range.jpg')}" alt="${esc(c.title)}" loading="lazy">
        </div>
        <div class="case-card__body">
          <div class="case-card__meta">
            <span>${esc(c.client)}</span><span class="dot"></span><span>${esc(c.industry || '')}</span>
          </div>
          <h3>${esc(c.title)}</h3>
          <p>${esc(c.summary)}</p>
        </div>
      </a>`;
  }

  async function renderCases() {
    const host = document.getElementById('case-grid');
    if (!host) return;
    try {
      const data = await api('/api/cases?featured=1&pageSize=3');
      host.innerHTML = data.items.map(caseCard).join('');
    } catch (err) {
      host.innerHTML = `<div class="empty-state" style="grid-column:1/-1">案例加载失败</div>`;
    }
  }

  initHeroSlider();

  // 三个区块并行请求，页面不用排队等
  Promise.all([renderProducts(), renderSolutions(), renderCases()]).then(() => {
    initReveal(); // 动态插入的元素也要纳入滚动动效
  });
})();
