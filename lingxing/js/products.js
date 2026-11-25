/**
 * 文件用途：产品与工艺页的渲染
 * 职责：拉取产品列表 → 生成顶部锚点导航 → 生成八个产品长条区块
 */

(function () {
  'use strict';

  const { api, esc, initReveal } = window.LX;

  /** 顶部锚点导航 */
  function renderTabs(list) {
    const host = document.getElementById('product-tabs');
    if (!host) return;
    host.innerHTML = list
      .map(
        (p) =>
          `<a href="#${esc(p.slug)}" class="filter" data-slug="${esc(p.slug)}"
              style="flex:none;border:0;border-bottom:2px solid transparent;padding:14px 16px;white-space:nowrap">${esc(p.name)}</a>`
      )
      .join('');
  }

  /** 单个产品区块 */
  function productBlock(p, index) {
    const specs = (p.specs || '').split('\n').filter(Boolean);
    const uses = (p.use_cases || '').split('\n').filter(Boolean);
    const alt = index % 2 === 1 ? ' product-block--alt' : '';
    return `
      <article class="product-block${alt}" id="${esc(p.slug)}">
        <div class="reveal">
          <div class="product-block__no">${String(index + 1).padStart(2, '0')} / ${p.slug.toUpperCase()}</div>
          <h2>${esc(p.name)}</h2>
          <div class="product-block__tagline">${esc(p.tagline || '')}</div>
          <p class="product-block__desc">${esc(p.summary || '')}</p>
          <ul class="product-specs">
            ${specs.map((s) => `<li>${esc(s)}</li>`).join('')}
          </ul>
          <div class="product-use">
            ${uses.map((u) => `<span class="tag">${esc(u)}</span>`).join('')}
          </div>
        </div>
        <div class="product-block__media reveal">
          <img src="${esc(p.cover || '/assets/img/labels-range.jpg')}" alt="${esc(p.name)}" loading="lazy">
        </div>
      </article>`;
  }

  async function main() {
    const host = document.getElementById('product-list');
    if (!host) return;
    host.innerHTML = '<div class="skeleton" style="height:280px"></div>';

    try {
      const list = await api('/api/products');
      renderTabs(list);
      host.innerHTML = list.map(productBlock).join('');
      initReveal();

      // 页面如果带着 #slug 打开（比如从首页卡片点进来），滚到对应位置
      if (location.hash) {
        const target = document.querySelector(location.hash);
        if (target) setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
      }

      // 点击顶部导航时高亮当前项
      document.querySelectorAll('#product-tabs a').forEach((a) => {
        a.addEventListener('click', () => {
          document.querySelectorAll('#product-tabs a').forEach((x) => {
            x.style.borderBottomColor = 'transparent';
            x.style.color = '';
          });
          a.style.borderBottomColor = 'var(--lime)';
          a.style.color = 'var(--ink)';
        });
      });
    } catch (err) {
      host.innerHTML = `<div class="empty-state">产品数据加载失败：${esc(err.message)}</div>`;
    }
  }

  main();
})();
