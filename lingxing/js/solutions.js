/**
 * 文件用途：行业方案页的渲染
 * 职责：把每个行业的"难点"与"我们的做法"渲染成左右对照的条目
 */

(function () {
  'use strict';

  const { api, esc, initReveal } = window.LX;

  /** 单条行业 */
  function industryRow(item, index) {
    const pains = (item.pain_points || '').split('\n').filter(Boolean);
    const ours = (item.proposal || '').split('\n').filter(Boolean);
    return `
      <article class="industry reveal">
        <div>
          <div class="industry__no">${String(index + 1).padStart(2, '0')} / INDUSTRY</div>
          <h3 class="industry__name">${esc(item.name)}</h3>
          <p style="margin-top:10px;font-size:13.5px;color:var(--muted);line-height:1.75">${esc(item.summary)}</p>
        </div>
        <div class="industry__body">
          <div class="industry__col">
            <h4>常见难点</h4>
            <ul>${pains.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
          </div>
          <div class="industry__col industry__col--ours">
            <h4>对应做法</h4>
            <ul>${ours.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
          </div>
        </div>
      </article>`;
  }

  async function main() {
    const host = document.getElementById('solution-list');
    if (!host) return;
    host.innerHTML = '<div class="skeleton" style="height:220px"></div>';
    try {
      const list = await api('/api/solutions');
      host.innerHTML = list.map(industryRow).join('');
      initReveal();
    } catch (err) {
      host.innerHTML = `<div class="empty-state">行业方案加载失败：${esc(err.message)}</div>`;
    }
  }

  main();
})();
