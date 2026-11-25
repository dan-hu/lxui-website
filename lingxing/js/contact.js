/**
 * 文件用途：联系我们页
 * 职责：从接口取产品列表，填充"需求品类"下拉框（保持后台新增品类时自动同步）
 */

(function () {
  'use strict';

  const { api, esc } = window.LX;

  async function fillBizType() {
    const select = document.getElementById('f-biz');
    if (!select) return;
    try {
      const list = await api('/api/products');
      const options = list.map((p) => `<option value="${esc(p.name)}">${esc(p.name)}</option>`).join('');
      select.insertAdjacentHTML('beforeend', `${options}<option value="其他">其他 / 还不确定</option>`);
    } catch {
      /* 接口失败也不影响表单提交，保留空选项 */
    }
  }

  fillBizType();
})();
