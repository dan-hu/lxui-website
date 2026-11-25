/**
 * 文件用途：全站公用脚本
 * 包含：接口请求封装、页头页脚注入、站点配置填充、滚动动效、小工具函数
 * 说明：所有页面都引入本文件，避免重复写导航和页脚
 */

(function () {
  'use strict';

  /* ========================= 1. 接口请求封装 ========================= */

  /**
   * 请求后端接口，自动处理错误提示
   * @param {string} path 例如 '/api/products'
   * @param {object} options fetch 配置，可带 method / body
   * @returns {Promise<any>} 直接拿到 data 部分
   */
  async function api(path, options = {}) {
    const D = window.LX_DATA;
    if (!D) throw new Error('静态数据未加载');
    // POST /api/inquiries：静态站无后端，转为调起邮件客户端
    if (path === '/api/inquiries' && options.method === 'POST') {
      const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
      const mail = D.settings.email || 'shang0707@vip.163.com';
      const text = [
        '联系人：' + (body.name || ''), '公司：' + (body.company || '-'),
        '电话：' + (body.phone || ''), '邮箱：' + (body.email || '-'),
        '业务类型：' + (body.biz_type || '-'), '预估数量：' + (body.quantity || '-'),
        '', '需求描述：', body.message || '',
      ].join('\n');
      location.href = 'mailto:' + mail + '?subject=' + encodeURIComponent('灵星官网询价 - ' + (body.name || '')) + '&body=' + encodeURIComponent(text);
      return { id: 'MAIL' };
    }
    const [route, queryStr] = path.split('?');
    const q = new URLSearchParams(queryStr || '');
    const seg = route.split('/').filter(Boolean); // ['api', ...]
    const page = Math.max(1, Number(q.get('page')) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(q.get('pageSize')) || 9));

    if (route === '/api/settings') return D.settings;
    if (route === '/api/products') return D.products;
    if (seg[1] === 'products' && seg[2]) {
      const k = seg[2];
      const item = D.products.find((p) => p.slug === k || p.id === Number(k));
      if (!item) throw new Error('没有找到该产品');
      return item;
    }
    if (route === '/api/solutions') return D.solutions;
    if (route === '/api/cases/industries') return D.caseIndustries;
    if (route === '/api/cases') {
      let items = D.cases;
      if (q.get('featured') === '1') items = items.filter((c) => c.is_featured === 1);
      const industry = q.get('industry');
      if (industry && industry !== 'all') items = items.filter((c) => c.industry === industry);
      const total = items.length;
      const start = (page - 1) * pageSize;
      return { items: items.slice(start, start + pageSize), total, page, pageSize, totalPages: Math.ceil(total / pageSize) || 1 };
    }
    if (seg[1] === 'cases' && seg[2]) {
      const item = D.cases.find((c) => c.id === Number(seg[2]));
      if (!item) throw new Error('没有找到该案例');
      return item;
    }
    if (route === '/api/news') {
      let items = D.news;
      const cat = q.get('category');
      if (cat && cat !== 'all') items = items.filter((n) => n.category === cat);
      const total = items.length;
      const start = (page - 1) * pageSize;
      return { items: items.slice(start, start + pageSize), total, page, pageSize, totalPages: Math.ceil(total / pageSize) || 1 };
    }
    if (seg[1] === 'news' && seg[2]) {
      const item = D.news.find((n) => n.id === Number(seg[2]));
      if (!item) throw new Error('没有找到该新闻');
      return item;
    }
    throw new Error('接口不存在（静态站点）：' + path);
  }

  /* ========================= 2. 小工具函数 ========================= */

  /** HTML 转义，防止内容里的尖括号破坏页面结构 */
  function esc(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  /** 把换行文本变成若干行（用于规格、方案这类多行字段） */
  function lines(str) {
    return String(str || '').split('\n').map((s) => s.trim()).filter(Boolean);
  }

  /** 日期格式：2025-03-18 → 2025.03.18 */
  function formatDate(value) {
    if (!value) return '';
    return String(value).slice(0, 10).replace(/-/g, '.');
  }

  /** 取网址里的查询参数，如 ?id=3 */
  function param(name) {
    return new URLSearchParams(location.search).get(name);
  }

  /* ========================= 3. 页头 ========================= */

  /**
   * 主导航配置
   * external: true 表示站外链接，会在新标签页打开，并且地址可在后台「站点配置」里改
   *   当前指向兄弟公司「上海芝诚包装」官网
   */
  const SISTER_SITE = '/zhicheng/'; // 兄弟公司「上海芝诚包装」官网（同域名子目录）

  const NAV = [
    { href: 'products.html', label: '产品与工艺', key: 'products' },
    { href: 'rfid.html', label: 'RFID 方案', key: 'rfid' },
    { href: 'solutions.html', label: '行业方案', key: 'solutions' },
    { href: 'factory.html', label: '制造实力', key: 'factory' },
    { href: 'cases.html', label: '客户案例', key: 'cases' },
    { href: 'about.html', label: '关于我们', key: 'about' },
    { href: 'news.html', label: '新闻动态', key: 'news' },
    { href: 'contact.html', label: '联系我们', key: 'contact' },
    { href: SISTER_SITE, label: '上海芝诚包装', key: 'sister' },
  ];

  /**
   * 生成页头
   * @param {string} active 当前页面的 key，用于高亮导航
   */
  function renderHeader(active) {
    const host = document.getElementById('site-header');
    if (!host) return;
    const links = NAV.map((n) => {
      const cls = [n.key === active ? 'is-active' : '', n.external ? 'nav-ext' : ''].filter(Boolean).join(' ');
      // 站外链接：新标签页打开 + 地址由后端配置注入（data-setting-href）
      const extra = n.external ? ' target="_blank" rel="noopener" data-setting-href="sister_site_url"' : '';
      const ico = n.external ? '<span class="nav-ext__ico" aria-hidden="true">↗</span>' : '';
      const clsAttr = cls ? ` class="${cls}"` : '';
      return `<a href="${n.href}"${clsAttr}${extra}>${n.label}${ico}</a>`;
    }).join('');
    host.innerHTML = `
      <header class="site-header">
        <div class="wrap site-header__inner">
          <a class="brand" href="index.html" aria-label="灵星首页 · Sapiential Star 灵星文化科技发展有限公司">
            <img class="brand__mark" src="assets/logo/star.png" alt="" width="69" height="74">
            <span class="brand__text">
              <span class="brand__en">Sapiential Star</span>
              <span class="brand__cn">灵星文化科技发展有限公司</span>
            </span>
          </a>
          <nav class="nav" id="main-nav" aria-label="主导航">${links}</nav>
          <div class="header-actions">
            <a class="btn btn--lime" href="contact.html">获取报价</a>
            <button class="menu-toggle" id="menu-toggle" aria-label="展开菜单" aria-expanded="false"><span></span></button>
          </div>
        </div>
      </header>`;

    // 移动端菜单开关
    const toggle = document.getElementById('menu-toggle');
    toggle.addEventListener('click', () => {
      const open = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    // 点击导航项后自动收起
    document.querySelectorAll('#main-nav a').forEach((a) =>
      a.addEventListener('click', () => document.body.classList.remove('nav-open'))
    );
  }

  /* ========================= 4. 页脚 ========================= */

  function renderFooter() {
    const host = document.getElementById('site-footer');
    if (!host) return;
    const year = new Date().getFullYear();
    host.innerHTML = `
      <footer class="site-footer">
        <div class="wrap">
          <div class="footer-top">
            <div>
              <a class="brand" href="index.html" aria-label="灵星首页 · Sapiential Star 灵星文化科技发展有限公司">
                <img class="brand__mark" src="assets/logo/star.png" alt="" width="69" height="74">
                <span class="brand__text">
                  <span class="brand__en">Sapiential Star</span>
                  <span class="brand__cn">灵星文化科技发展有限公司</span>
                </span>
              </a>
              <p class="footer-desc">15 年工业标签制造经验，多条柔印、凸版与数字印刷生产线，为光电、电子、食品、医药、汽配等行业提供标签解决方案与一站式生产服务。</p>
            </div>
            <div class="footer-col">
              <h4>产品</h4>
              <ul>
                <li><a href="products.html#barcode-label">条码与物价标签</a></li>
                <li><a href="products.html#product-info">产品信息标签</a></li>
                <li><a href="products.html#security-label">防伪与安全标签</a></li>
                <li><a href="products.html#food-label">食品包装标签</a></li>
                <li><a href="products.html#blank-roll">空白标签与耗材</a></li>
                <li><a href="products.html#rfid-label">RFID 电子标签</a></li>
              </ul>
            </div>
            <div class="footer-col">
              <h4>公司</h4>
              <ul>
                <li><a href="about.html">关于灵星</a></li>
                <li><a href="rfid.html">RFID 智能方案</a></li>
                <li><a href="factory.html">制造实力</a></li>
                <li><a href="cases.html">客户案例</a></li>
                <li><a href="news.html">新闻动态</a></li>
                <li><a href="${SISTER_SITE}" target="_blank" rel="noopener" data-setting-href="sister_site_url">上海芝诚包装 ↗</a></li>
              </ul>
            </div>
            <div class="footer-col">
              <h4>联系</h4>
              <ul>
                <li>业务咨询：<a href="tel:13866710707" data-setting="mobile">13866710707</a></li>
                <li>公司总机：<a href="tel:055165320200" data-setting="phone">0551-65320200</a></li>
                <li>邮箱：<a href="mailto:shang0707@vip.163.com" data-setting="email">shang0707@vip.163.com</a></li>
                <li data-setting="address_hefei">合肥市高新区龙湖光年中心 3410 室</li>
              </ul>
            </div>
          </div>
          <div class="footer-bottom">
            <span>© ${year} 合肥灵星文化科技发展有限公司　保留所有权利</span>
            <span>合肥 · 上海　|　<a href="contact.html" style="color:inherit;text-decoration:underline">索取样品与报价</a></span>
          </div>
        </div>
      </footer>`;
  }

  /* ========================= 5. 站点配置填充 ========================= */

  // 配置只请求一次，多个地方共用同一个结果
  let settingsPromise = null;

  function loadSettings() {
    if (!settingsPromise) settingsPromise = api('/api/settings').catch(() => ({}));
    return settingsPromise;
  }

  /**
   * 把配置值填进页面：给元素加 data-setting="phone" 即可自动显示电话号码
   * 这样后台改一次，全站的联系方式都会跟着变
   */
  async function applySettings() {
    const s = await loadSettings();
    document.querySelectorAll('[data-setting]').forEach((el) => {
      const key = el.getAttribute('data-setting');
      const value = s[key];
      if (!value) return;
      // 表单控件写 value，普通元素写文字
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') el.value = value;
      else el.textContent = value;
    });
    document.querySelectorAll('[data-setting-href]').forEach((el) => {
      const key = el.getAttribute('data-setting-href');
      if (s[key]) el.setAttribute('href', s[key]);
    });
  }

  /* ========================= 6. 滚动进入动效 ========================= */

  function initReveal() {
    const items = document.querySelectorAll('.reveal');
    if (!items.length) return;
    if (!('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
    );
    items.forEach((el) => io.observe(el));
  }

  /* ========================= 7. 询价表单通用提交 ========================= */

  /**
   * 绑定询价表单：提交到 /api/inquiries，成功后显示提示并清空
   * @param {HTMLFormElement} form
   */
  function bindInquiryForm(form) {
    if (!form) return;
    const status = form.querySelector('.form-status') || document.getElementById('form-status');
    const submitBtn = form.querySelector('[type="submit"]');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const payload = Object.fromEntries(fd.entries());
      payload.source_page = location.pathname.replace('/', '') || 'index.html';

      // 前端先做一遍校验，减少无意义的请求
      if (!payload.name || !String(payload.name).trim()) return showStatus('请填写联系人姓名', true);
      if (!/^[\d\s-]{6,20}$/.test(String(payload.phone || '').trim())) return showStatus('请填写正确的联系电话', true);

      submitBtn.disabled = true;
      const originalText = submitBtn.textContent;
      submitBtn.textContent = '正在提交…';
      try {
        const data = await api('/api/inquiries', { method: 'POST', body: payload });
        showStatus('已为您调起邮件客户端，内容已自动填写，发送后业务人员会与您联系。您也可以直接致电 13866710707。', false);
        form.reset();
      } catch (err) {
        showStatus(err.message || '提交失败，请稍后再试或直接致电', true);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });

    function showStatus(text, isError) {
      if (!status) return alert(text);
      status.textContent = text;
      status.classList.add('is-visible');
      status.classList.toggle('is-error', Boolean(isError));
    }
  }

  /* ========================= 8. 初始化 ========================= */

  /**
   * 页面初始化入口，每个页面在 <body> 上写 data-page="products" 即可
   */
  function init() {
    const active = document.body.getAttribute('data-page') || '';
    renderHeader(active);
    renderFooter();
    applySettings();
    initReveal();
    document.querySelectorAll('form[data-inquiry]').forEach(bindInquiryForm);
  }

  // 对外暴露给各页面脚本使用
  window.LX = {
    api,
    esc,
    lines,
    formatDate,
    param,
    loadSettings,
    applySettings,
    initReveal,
    bindInquiryForm,
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
