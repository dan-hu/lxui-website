/**
 * 文件用途：新闻列表页
 * 职责：分页加载新闻，渲染成带日期与分类的条目
 */

(function () {
  'use strict';

  const { api, esc, formatDate, initReveal } = window.LX;

  const state = { page: 1, pageSize: 8, totalPages: 1 };
  const host = document.getElementById('news-list');
  const moreBtn = document.getElementById('load-more');

  function newsRow(n) {
    return `
      <a class="news-item reveal" href="news-detail.html?id=${n.id}">
        <time datetime="${esc(n.published_at)}">${esc(formatDate(n.published_at))}</time>
        <div>
          <h3>${esc(n.title)}</h3>
          <p>${esc(n.summary || '')}</p>
        </div>
        <span class="news-item__cat">${esc(n.category || '动态')}</span>
      </a>`;
  }

  async function load({ append = false } = {}) {
    if (!host) return;
    if (!append) host.innerHTML = '<div class="skeleton" style="height:120px"></div>';
    try {
      const data = await api(`/api/news?page=${state.page}&pageSize=${state.pageSize}`);
      state.totalPages = data.totalPages;
      const html = data.items.map(newsRow).join('');
      if (append) host.insertAdjacentHTML('beforeend', html);
      else host.innerHTML = html || '<div class="empty-state">暂时还没有发布新闻</div>';
      if (moreBtn) moreBtn.style.display = state.page < state.totalPages ? 'inline-flex' : 'none';
      initReveal();
    } catch (err) {
      host.innerHTML = `<div class="empty-state">新闻加载失败：${esc(err.message)}</div>`;
    }
  }

  moreBtn?.addEventListener('click', () => {
    state.page += 1;
    load({ append: true });
  });

  load();
})();
