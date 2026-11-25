/**
 * 文件用途：新闻详情页
 * 职责：按 ?id= 拉取新闻正文并渲染
 */

(function () {
  'use strict';

  const { api, esc, formatDate, param } = window.LX;

  async function main() {
    const id = param('id');
    const titleEl = document.getElementById('news-title');
    if (!id) {
      titleEl.textContent = '缺少新闻编号';
      return;
    }

    try {
      const n = await api(`/api/news/${id}`);
      document.title = `${n.title}｜灵星标签`;
      const meta = document.querySelector('meta[name="description"]');
      if (meta && n.summary) meta.setAttribute('content', n.summary);
      titleEl.textContent = n.title;
      document.getElementById('news-meta').innerHTML = `
        <span>${esc(formatDate(n.published_at))}</span><span>·</span><span>${esc(n.category || '公司动态')}</span>`;

      const cover = document.getElementById('news-cover');
      if (n.cover) {
        cover.src = n.cover;
        cover.alt = n.title;
        cover.style.display = '';
      }

      document.getElementById('news-body').innerHTML = String(n.content || '')
        .split('\n')
        .filter((s) => s.trim())
        .map((s) => `<p>${esc(s)}</p>`)
        .join('');
    } catch (err) {
      titleEl.textContent = '没有找到这条新闻';
      document.getElementById('news-body').innerHTML = `<p style="color:var(--muted)">${esc(err.message)}，请返回<a href="news.html" style="text-decoration:underline">新闻列表</a>。</p>`;
    }
  }

  main();
})();
