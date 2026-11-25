/**
 * 文件用途：客户案例页
 * 职责：行业筛选、案例列表渲染、分页加载
 */

(function () {
  'use strict';

  const { api, esc, initReveal } = window.LX;

  const state = { industry: 'all', page: 1, pageSize: 6, totalPages: 1 };
  const host = document.getElementById('case-list');
  const moreBtn = document.getElementById('load-more');

  /** 单个案例卡片 */
  function caseCard(c) {
    return `
      <a class="case-card reveal" href="case-detail.html?id=${c.id}">
        <div class="case-card__media">
          <img src="${esc(c.cover || '/assets/img/labels-range.jpg')}" alt="${esc(c.title)}" loading="lazy">
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

  /** 行业筛选按钮 */
  async function renderFilters() {
    const wrap = document.getElementById('case-filters');
    if (!wrap) return;
    try {
      const industries = await api('/api/cases/industries');
      industries.forEach((item) => {
        const btn = document.createElement('button');
        btn.className = 'filter';
        btn.dataset.industry = item.industry;
        btn.textContent = `${item.industry}（${item.n}）`;
        wrap.appendChild(btn);
      });
    } catch {
      /* 筛选加载失败不影响主列表 */
    }
  }

  /** 加载案例；append=true 表示追加（点"加载更多"） */
  async function loadCases({ append = false } = {}) {
    if (!host) return;
    if (!append) host.innerHTML = Array.from({ length: 3 }, () => '<div class="case-card skeleton" style="border:0"></div>').join('');

    try {
      const query = new URLSearchParams({ page: state.page, pageSize: state.pageSize });
      if (state.industry !== 'all') query.set('industry', state.industry);
      const data = await api(`/api/cases?${query}`);

      state.totalPages = data.totalPages;
      const html = data.items.map(caseCard).join('');
      if (append) host.insertAdjacentHTML('beforeend', html);
      else host.innerHTML = html || '<div class="empty-state" style="grid-column:1/-1">该行业下暂时没有案例</div>';

      // 还有下一页才显示"加载更多"
      if (moreBtn) moreBtn.style.display = state.page < state.totalPages ? 'inline-flex' : 'none';
      initReveal();
    } catch (err) {
      host.innerHTML = `<div class="empty-state" style="grid-column:1/-1">案例加载失败：${esc(err.message)}</div>`;
    }
  }

  /** 切换行业 */
  function bindFilters() {
    document.getElementById('case-filters')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter');
      if (!btn) return;
      document.querySelectorAll('#case-filters .filter').forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      state.industry = btn.dataset.industry;
      state.page = 1;
      loadCases();
    });
  }

  moreBtn?.addEventListener('click', () => {
    state.page += 1;
    loadCases({ append: true });
  });

  renderFilters();
  bindFilters();
  loadCases();
})();
