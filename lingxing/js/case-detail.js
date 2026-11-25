/**
 * 文件用途：案例详情页
 * 职责：按 ?id= 拉取案例详情，渲染标题、三栏正文（难点 / 做法 / 结果）与同行业相关案例
 */

(function () {
  'use strict';

  const { api, esc, formatDate, param, initReveal } = window.LX;

  /** 把多行文本渲染成 <p> */
  function paragraphs(text) {
    return String(text || '')
      .split('\n')
      .filter((s) => s.trim())
      .map((s) => `<p>${esc(s)}</p>`)
      .join('');
  }

  async function main() {
    const id = param('id');
    if (!id) {
      document.getElementById('case-title').textContent = '缺少案例编号';
      return;
    }

    try {
      const c = await api(`/api/cases/${id}`);

      // 标题与摘要
      document.title = `${c.title}｜灵星标签客户案例`;
      const meta = document.querySelector('meta[name="description"]');
      if (meta && c.summary) meta.setAttribute('content', `${c.client}｜${c.summary}`);
      document.getElementById('case-title').textContent = c.title;
      document.getElementById('case-summary').textContent = c.summary || '';
      const cover = document.getElementById('case-cover');
      cover.src = c.cover || 'assets/img/labels-range.jpg';
      cover.alt = c.title;

      // 正文：三个小标题，分别对应问题、做法、结果
      document.getElementById('case-body').innerHTML = `
        <h3>客户遇到的问题</h3>
        ${paragraphs(c.challenge)}
        <h3>我们的做法</h3>
        ${paragraphs(c.solution)}
        <h3>最终结果</h3>
        ${paragraphs(c.result)}
      `;

      // 侧栏信息
      document.getElementById('case-meta').innerHTML = `
        <dt>客户</dt><dd>${esc(c.client)}</dd>
        <dt>行业</dt><dd>${esc(c.industry || '—')}</dd>
        <dt>完成时间</dt><dd>${esc(formatDate(c.published_at) || '—')}</dd>
      `;

      // 同行业相关案例（最多 3 条）
      if (c.industry) {
        const related = await api(`/api/cases?industry=${encodeURIComponent(c.industry)}&pageSize=4`);
        const others = related.items.filter((x) => x.id !== c.id).slice(0, 3);
        if (others.length) {
          document.getElementById('related-section').style.display = '';
          document.getElementById('related-list').innerHTML = others
            .map(
              (x) => `
              <a class="case-card reveal" href="case-detail.html?id=${x.id}">
                <div class="case-card__media"><img src="${esc(x.cover || 'assets/img/labels-range.jpg')}" alt="${esc(x.title)}" loading="lazy"></div>
                <div class="case-card__body">
                  <div class="case-card__meta"><span>${esc(x.client)}</span><span class="dot"></span><span>${esc(x.industry || '')}</span></div>
                  <h3>${esc(x.title)}</h3>
                  <p>${esc(x.summary)}</p>
                </div>
              </a>`
            )
            .join('');
          initReveal();
        }
      }
    } catch (err) {
      document.getElementById('case-title').textContent = '没有找到这个案例';
      document.getElementById('case-body').innerHTML = `<p style="color:var(--muted)">${esc(err.message)}，请返回<a href="cases.html" style="text-decoration:underline">案例列表</a>重新选择。</p>`;
    }
  }

  main();
})();
