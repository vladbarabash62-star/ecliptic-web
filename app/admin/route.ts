import { ADMIN_SESSION_COOKIE, getAdminSessionSecret, getAdminSessionValue, safeEqual } from "../../lib/security";

export const dynamic = "force-dynamic";

const BASE_STYLE = `
  :root { color-scheme: dark; --bg:#000; --panel:#0b0f18; --panel2:#111827; --line:rgba(255,255,255,.12); --text:#fff; --muted:rgba(255,255,255,.64); --blue:#0ea5e9; --green:#10b981; --red:#ef4444; --amber:#f59e0b; }
  * { box-sizing:border-box; }
  html,body { margin:0; min-height:100%; }
  body { min-height:100vh; background:var(--bg); color:var(--text); font-family:Inter,Segoe UI,Arial,sans-serif; }
  body:before { content:""; position:fixed; inset:0; pointer-events:none; background-image:radial-gradient(#fff 1px, transparent 1.5px); background-size:92px 92px; opacity:.24; }
  button,input,textarea { font:inherit; }
  button { cursor:pointer; border:0; }
  input,textarea { width:100%; border:1px solid var(--line); border-radius:12px; background:#07101d; color:#fff; padding:11px 12px; outline:none; }
  textarea { resize:vertical; min-height:82px; }
  input:focus,textarea:focus { border-color:rgba(56,189,248,.65); }
  label { display:block; margin:0 0 7px; color:rgba(255,255,255,.7); font-size:12px; font-weight:850; }
  h1,h2,h3,p { margin:0; }
  .brand { color:#bae6fd; font-size:13px; font-weight:950; letter-spacing:.04em; text-transform:uppercase; }
  .muted { color:var(--muted); }
  .card { border:1px solid var(--line); background:rgba(11,15,24,.92); border-radius:18px; box-shadow:0 22px 70px rgba(0,0,0,.26); }
  .btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; min-height:42px; border-radius:12px; padding:11px 14px; background:var(--blue); color:#fff; font-weight:900; text-decoration:none; }
  .btn.secondary { background:rgba(255,255,255,.06); border:1px solid var(--line); }
  .btn.green { background:var(--green); }
  .btn.red { background:rgba(239,68,68,.14); border:1px solid rgba(239,68,68,.34); color:#fecaca; }
  .btn:disabled { opacity:.55; cursor:not-allowed; }
  .notice { display:none; margin-bottom:16px; padding:12px 14px; border-radius:14px; border:1px solid var(--line); background:rgba(255,255,255,.05); color:#dbeafe; }
  .notice.show { display:block; }
  .notice.error { border-color:rgba(239,68,68,.38); background:rgba(239,68,68,.11); color:#fecaca; }
`;

const LOGIN_HTML = `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>Admin | Ecliptic Store</title>
  <style>
    ${BASE_STYLE}
    .login-page { position:relative; z-index:1; min-height:100vh; display:grid; place-items:center; padding:24px; }
    .login-card { width:min(440px,100%); padding:28px; text-align:center; }
    .login-card h1 { margin-top:14px; font-size:clamp(36px,7vw,50px); line-height:1; }
    .login-card p { margin-top:14px; line-height:1.5; }
    .login-form { display:grid; gap:14px; margin-top:24px; text-align:left; }
    .login-form .btn { width:100%; }
  </style>
</head>
<body>
  <main class="login-page">
    <form class="card login-card" id="loginForm" autocomplete="off">
      <div class="brand">Ecliptic Admin</div>
      <h1>Вход в админку</h1>
      <p class="muted">Введите пароль владельца, чтобы открыть аналитику и настройки сайта.</p>
      <div class="login-form">
        <div>
          <label for="password">Пароль</label>
          <input id="password" type="password" autocomplete="current-password" autofocus required>
        </div>
        <button class="btn" id="loginButton" type="submit">Войти</button>
        <div id="message" class="notice"></div>
      </div>
    </form>
  </main>
  <script>
    var form = document.getElementById('loginForm');
    var input = document.getElementById('password');
    var button = document.getElementById('loginButton');
    var message = document.getElementById('message');

    function showMessage(text, error) {
      message.textContent = text;
      message.className = 'notice show' + (error ? ' error' : '');
    }

    form.addEventListener('submit', async function(event) {
      event.preventDefault();
      var password = input.value.trim();
      if (!password) {
        showMessage('Введите пароль.', true);
        return;
      }

      button.disabled = true;
      showMessage('Проверяю пароль...', false);

      try {
        var response = await fetch('/api/admin/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: password })
        });
        var data = await response.json().catch(function() { return {}; });
        if (!response.ok || !data.ok) throw new Error(data.error || 'Пароль не подошёл.');
        showMessage('Готово. Открываю админку...', false);
        window.location.replace('/admin');
      } catch (error) {
        showMessage(error.message || 'Не удалось войти.', true);
        button.disabled = false;
      }
    });
  </script>
</body>
</html>`;

const ADMIN_HTML = `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>Admin | Ecliptic Store</title>
  <style>
    ${BASE_STYLE}
    .page { position:relative; z-index:1; width:min(1480px,calc(100% - 28px)); margin:0 auto; padding:22px 0 44px; }
    .top { display:flex; justify-content:space-between; align-items:flex-end; gap:16px; margin-bottom:16px; }
    .top h1 { margin-top:8px; font-size:clamp(28px,4vw,46px); line-height:1.05; }
    .toolbar { display:flex; flex-wrap:wrap; gap:10px; align-items:center; }
    .tabs { display:flex; flex-wrap:wrap; gap:8px; padding:8px; margin-bottom:16px; }
    .tab { border-radius:12px; padding:11px 14px; background:transparent; color:#fff; font-weight:900; border:1px solid transparent; }
    .tab.active { background:rgba(14,165,233,.16); border-color:rgba(56,189,248,.44); color:#e0f2fe; }
    .section { display:none; }
    .section.active { display:block; }
    .stats { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; margin-bottom:16px; }
    .stat { padding:16px; }
    .stat .value { margin-top:8px; font-size:32px; font-weight:1000; }
    .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
    .panel { padding:16px; }
    .list { display:grid; gap:8px; margin-top:14px; }
    .row { display:grid; grid-template-columns:1fr auto; gap:10px; align-items:center; padding:10px 12px; border:1px solid rgba(255,255,255,.08); border-radius:12px; background:rgba(255,255,255,.035); }
    .bar { height:8px; margin-top:8px; overflow:hidden; border-radius:999px; background:rgba(255,255,255,.08); }
    .bar span { display:block; height:100%; background:linear-gradient(90deg,#38bdf8,#22c55e); }
    .admin-grid { display:grid; grid-template-columns:330px minmax(0,1fr); gap:14px; }
    .sidebar { padding:12px; max-height:calc(100vh - 220px); overflow:auto; }
    .product-btn { width:100%; display:grid; grid-template-columns:44px 1fr; gap:10px; align-items:center; margin:7px 0; padding:8px; border:1px solid rgba(255,255,255,.08); border-radius:14px; background:rgba(255,255,255,.035); color:#fff; text-align:left; }
    .product-btn.active { border-color:rgba(56,189,248,.46); background:rgba(14,165,233,.14); }
    .thumb { width:44px; height:44px; display:grid; place-items:center; border-radius:12px; background:#07101d; overflow:hidden; }
    .thumb img { max-width:74%; max-height:74%; object-fit:contain; }
    .editor { padding:16px; }
    .fields { display:grid; gap:12px; margin-top:14px; }
    .two { display:grid; grid-template-columns:minmax(0,1fr) minmax(150px,220px); gap:12px; }
    .upload-row { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:8px; align-items:center; }
    .image-preview { width:58px; height:58px; display:grid; place-items:center; margin-top:8px; border:1px solid rgba(255,255,255,.1); border-radius:14px; background:#07101d; overflow:hidden; color:rgba(255,255,255,.45); font-size:12px; }
    .image-preview img { max-width:80%; max-height:80%; object-fit:contain; transform-origin:center; transition:transform .18s ease; }
    .offer { border:1px solid var(--line); background:rgba(7,16,29,.72); border-radius:14px; padding:12px; margin-top:10px; }
    .offer-head { display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:10px; }
    .mini-actions { display:flex; flex-wrap:wrap; gap:7px; }
    .mini { border-radius:9px; padding:7px 9px; background:rgba(255,255,255,.07); color:#fff; font-size:12px; font-weight:800; border:1px solid var(--line); }
    .empty { padding:28px; text-align:center; color:var(--muted); }
    .table { width:100%; border-collapse:collapse; margin-top:12px; }
    .table th,.table td { padding:10px; border-bottom:1px solid rgba(255,255,255,.08); text-align:left; font-size:13px; }
    .table th { color:rgba(255,255,255,.65); }
    .settings-card { max-width:640px; padding:18px; }
    @media (max-width: 940px) { .stats,.grid2,.admin-grid,.two { grid-template-columns:1fr; } .top { align-items:flex-start; flex-direction:column; } .sidebar { max-height:none; } .upload-row { grid-template-columns:1fr; } }
  </style>
</head>
<body>
  <main class="page">
    <header class="top">
      <div>
        <div class="brand">Ecliptic Admin</div>
        <h1>Админка сайта</h1>
        <p class="muted" style="margin-top:8px">Аналитика, товары, картинки вариантов и настройки главной страницы.</p>
      </div>
      <div class="toolbar">
        <a class="btn secondary" href="/" target="_blank" rel="noreferrer">Открыть сайт</a>
        <button class="btn secondary" id="reloadBtn" type="button">Обновить</button>
        <button class="btn red" id="logoutBtn" type="button">Выйти</button>
      </div>
    </header>

    <nav class="card tabs">
      <button class="tab active" type="button" data-tab="analytics">Аналитика</button>
      <button class="tab" type="button" data-tab="products">Товары</button>
      <button class="tab" type="button" data-tab="settings">Главная</button>
    </nav>

    <div id="notice" class="notice show">Загружаю данные...</div>

    <section id="analytics" class="section active">
      <div class="stats">
        <div class="card stat"><p class="muted">Всего событий</p><div id="statTotal" class="value">0</div></div>
        <div class="card stat"><p class="muted">Просмотры</p><div id="statViews" class="value">0</div></div>
        <div class="card stat"><p class="muted">Клики купить</p><div id="statBuys" class="value">0</div></div>
        <div class="card stat"><p class="muted">Telegram</p><div id="statTelegram" class="value">0</div></div>
      </div>
      <div class="grid2">
        <div class="card panel">
          <h2>Популярные товары</h2>
          <div id="productStats" class="list"></div>
        </div>
        <div class="card panel">
          <h2>Действия</h2>
          <div id="actionStats" class="list"></div>
        </div>
      </div>
      <div class="card panel" style="margin-top:14px">
        <h2>Последние события</h2>
        <div style="overflow:auto">
          <table class="table">
            <thead><tr><th>Время</th><th>Действие</th><th>Товар</th><th>Страница</th></tr></thead>
            <tbody id="eventsTable"></tbody>
          </table>
        </div>
      </div>
    </section>

    <section id="products" class="section">
      <div class="admin-grid">
        <aside class="card sidebar">
          <div class="toolbar" style="justify-content:space-between">
            <h2>Товары</h2>
            <button class="btn secondary" id="addProductBtn" type="button">Добавить</button>
          </div>
          <div id="productList"></div>
        </aside>
        <section class="card editor">
          <div class="toolbar" style="justify-content:space-between">
            <h2>Настройка товара</h2>
            <button class="btn green" id="saveProductsBtn" type="button">Сохранить товары</button>
          </div>
          <div id="productEditor" class="empty">Выберите товар слева.</div>
        </section>
      </div>
    </section>

    <section id="settings" class="section">
      <div class="card settings-card">
        <h2>Настройки главной страницы</h2>
        <div class="fields">
          <div>
            <label for="reviewsCount">Количество успешных покупок</label>
            <input id="reviewsCount" placeholder="400+">
          </div>
          <div class="toolbar">
            <button class="btn green" id="saveSettingsBtn" type="button">Сохранить настройки</button>
          </div>
        </div>
      </div>
    </section>
  </main>

  <input id="imagePicker" type="file" accept="image/png,image/jpeg,image/webp" hidden>

  <script>
    var products = [];
    var settings = { reviewsCountLabel: '400+' };
    var analyticsEvents = [];
    var selectedSlug = '';
    var uploadTarget = null;

    function $(id) { return document.getElementById(id); }
    function esc(value) {
      return String(value == null ? '' : value)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }
    function parseDecimal(value, fallback) {
      var text = String(value == null ? '' : value).trim().replace(',', '.');
      if (!text) return fallback;
      var number = Number(text);
      return Number.isFinite(number) ? number : fallback;
    }
    function clampNumber(value, fallback, min, max) {
      var number = parseDecimal(value, fallback);
      return Math.min(max, Math.max(min, number));
    }
    function scaleToPercent(value) {
      var scale = clampNumber(value, 1, 0, 2);
      return Math.round((scale - 1) * 100);
    }
    function percentToScale(value, fallbackScale) {
      var fallbackPercent = scaleToPercent(fallbackScale || 1);
      var percent = clampNumber(value, fallbackPercent, -100, 100);
      return Math.round((1 + percent / 100) * 1000) / 1000;
    }
    function showNotice(text, isError) {
      var el = $('notice');
      el.textContent = text;
      el.className = 'notice show' + (isError ? ' error' : '');
    }
    function hideNoticeSoon() {
      setTimeout(function() { $('notice').className = 'notice'; }, 2200);
    }
    async function postJson(url, body) {
      var controller = new AbortController();
      var timeout = setTimeout(function() { controller.abort(); }, 30000);
      try {
        var response = await fetch(url, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body || {}),
          signal: controller.signal
        });
        var data = await response.json().catch(function() { return {}; });
        if (!response.ok) {
          if (response.status === 403) {
            showNotice('Доступ закончился или пароль неверный. Откройте админку заново.', true);
          }
          throw new Error(data.error || 'Сервер ответил ошибкой.');
        }
        return data;
      } finally {
        clearTimeout(timeout);
      }
    }
    function countBy(items, getter) {
      return items.reduce(function(acc, item) {
        var key = getter(item) || 'Неизвестно';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});
    }
    function renderBars(id, data) {
      var rows = Object.entries(data).sort(function(a,b) { return b[1] - a[1]; }).slice(0, 8);
      var max = Math.max(1, ...rows.map(function(row) { return row[1]; }));
      $(id).innerHTML = rows.length ? rows.map(function(row) {
        var label = row[0], value = row[1];
        return '<div class="row"><div><strong>' + esc(label) + '</strong><div class="bar"><span style="width:' + Math.max(8, Math.round(value / max * 100)) + '%"></span></div></div><strong>' + value + '</strong></div>';
      }).join('') : '<p class="muted">Пока нет данных.</p>';
    }
    function renderAnalytics() {
      $('statTotal').textContent = analyticsEvents.length;
      $('statViews').textContent = analyticsEvents.filter(function(e) { return e.type === 'page_view'; }).length;
      $('statBuys').textContent = analyticsEvents.filter(function(e) { return e.type === 'buy_click'; }).length;
      $('statTelegram').textContent = analyticsEvents.filter(function(e) { return String(e.type || '').indexOf('telegram') !== -1; }).length;
      renderBars('productStats', countBy(analyticsEvents.filter(function(e) { return e.product; }), function(e) { return e.product; }));
      renderBars('actionStats', countBy(analyticsEvents, function(e) { return e.type; }));
      $('eventsTable').innerHTML = analyticsEvents.slice(0, 80).map(function(event) {
        var time = event.time ? new Date(event.time).toLocaleString('ru-RU') : '';
        return '<tr><td>' + esc(time) + '</td><td>' + esc(event.type || '') + '</td><td>' + esc(event.product || '') + '</td><td>' + esc(event.path || '') + '</td></tr>';
      }).join('') || '<tr><td colspan="4" class="muted">Пока нет событий.</td></tr>';
    }
    function currentProduct() {
      return products.find(function(product) { return product.slug === selectedSlug; });
    }
    function slugify(value) {
      var map = { 'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'c','ч':'ch','ш':'sh','щ':'sch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya' };
      return String(value || '').toLowerCase().split('').map(function(ch) { return map[ch] || ch; }).join('').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64);
    }
    function renderProductList() {
      $('productList').innerHTML = products.map(function(product) {
        return '<button class="product-btn ' + (product.slug === selectedSlug ? 'active' : '') + '" type="button" data-action="select-product" data-slug="' + esc(product.slug) + '">' +
          '<span class="thumb"><img src="' + esc(product.icon) + '" alt=""></span>' +
          '<span><strong>' + esc(product.name) + '</strong><br><span class="muted">' + esc(product.slug) + '</span></span>' +
        '</button>';
      }).join('');
    }
    function previewHtml(value, scale, attrs) {
      var imageScale = clampNumber(scale, 1, 0, 2);
      return '<div class="image-preview" ' + (attrs || '') + '>' + (value ? '<img src="' + esc(value) + '" alt="" style="transform:scale(' + esc(imageScale) + ')">' : 'нет') + '</div>';
    }
    function productImageField(key, label, value, scale) {
      return '<div><label>' + label + '</label><div class="upload-row">' +
        '<input value="' + esc(value || '') + '" data-product-field="' + esc(key) + '" placeholder="Ссылка на картинку или загрузка с ПК">' +
        '<button class="btn secondary" type="button" data-action="pick-image" data-kind="product" data-key="' + esc(key) + '">Загрузить с ПК</button>' +
      '</div>' + previewHtml(value, scale || 1, 'data-product-preview="' + esc(key) + '"') + '</div>';
    }
    function offerImageField(index, value, scale) {
      return '<div style="margin-top:10px"><label>Картинка этого варианта</label><div class="upload-row">' +
        '<input value="' + esc(value || '') + '" data-offer-index="' + index + '" data-offer-field="icon" placeholder="Пусто = общая иконка вариантов">' +
        '<button class="btn secondary" type="button" data-action="pick-image" data-kind="offer" data-index="' + index + '" data-key="icon">Загрузить с ПК</button>' +
      '</div>' + previewHtml(value, scale || 1, 'data-offer-preview="' + index + '"') + '</div>';
    }
    function renderProductEditor() {
      var product = currentProduct();
      if (!product) {
        $('productEditor').className = 'empty';
        $('productEditor').innerHTML = 'Выберите товар слева.';
        return;
      }
      $('productEditor').className = 'fields';
      $('productEditor').innerHTML =
        '<div class="toolbar" style="justify-content:space-between"><h3>' + esc(product.name) + '</h3><button class="btn red" type="button" data-action="delete-product">Удалить товар</button></div>' +
        '<div><label>Название</label><input value="' + esc(product.name) + '" data-product-field="name"></div>' +
        '<div><label>Адрес товара</label><input value="' + esc(product.slug) + '" data-action="update-slug"></div>' +
        productImageField('icon', 'Иконка товара', product.icon, product.iconScale || 1) +
        '<div class="two">' + productImageField('offerIcon', 'Общая иконка вариантов', product.offerIcon || '', 1) +
        '<div><label>Размер иконки товара (%)</label><input type="number" step="1" min="-100" max="100" value="' + esc(scaleToPercent(product.iconScale || 1)) + '" data-product-field="iconScale"></div></div>' +
        '<div><label>Общий текст Telegram</label><textarea data-product-field="messageTemplate">' + esc(product.messageTemplate || '') + '</textarea></div>' +
        '<div class="toolbar" style="justify-content:space-between;margin-top:8px"><h3>Варианты покупки</h3><div class="toolbar"><button class="btn secondary" type="button" data-action="add-divider">Раздел</button><button class="btn secondary" type="button" data-action="add-offer">Вариант</button></div></div>' +
        '<div>' + renderOffers(product) + '</div>';
    }
    function renderOffers(product) {
      return (product.offers || []).map(function(offer, index) {
        var controls = '<div class="mini-actions"><button class="mini" type="button" data-action="move-offer" data-index="' + index + '" data-direction="-1">Вверх</button><button class="mini" type="button" data-action="move-offer" data-index="' + index + '" data-direction="1">Вниз</button><button class="mini" type="button" data-action="remove-offer" data-index="' + index + '">Удалить</button></div>';
        if (offer.type === 'divider') {
          return '<div class="offer"><div class="offer-head"><strong>Раздел</strong>' + controls + '</div>' +
            '<div class="two"><div><label>Заголовок</label><input value="' + esc(offer.title || '') + '" data-offer-index="' + index + '" data-offer-field="title"></div>' +
            '<div><label>Описание</label><input value="' + esc(offer.description || '') + '" data-offer-index="' + index + '" data-offer-field="description"></div></div></div>';
        }
        return '<div class="offer"><div class="offer-head"><strong>Вариант</strong>' + controls + '</div>' +
          '<div class="two"><div><label>Название</label><input value="' + esc(offer.label || '') + '" data-offer-index="' + index + '" data-offer-field="label"></div>' +
          '<div><label>Цена</label><input type="number" min="0" value="' + esc(offer.priceRub || 0) + '" data-offer-index="' + index + '" data-offer-field="priceRub"></div></div>' +
          offerImageField(index, offer.icon || '', offer.iconScale || 1) +
          '<div style="margin-top:10px"><label>Размер картинки варианта (%)</label><input type="number" step="1" min="-100" max="100" value="' + esc(scaleToPercent(offer.iconScale || 1)) + '" data-offer-index="' + index + '" data-offer-field="iconScale"></div>' +
          '<div style="margin-top:10px"><label>Текст Telegram</label><textarea data-offer-index="' + index + '" data-offer-field="messageTemplate">' + esc(offer.messageTemplate || '') + '</textarea></div></div>';
      }).join('');
    }
    function handleProductListClick(event) {
      var button = event.target.closest('[data-action="select-product"]');
      if (!button) return;
      selectedSlug = button.dataset.slug || '';
      renderProductList();
      renderProductEditor();
    }
    function handleEditorClick(event) {
      var button = event.target.closest('[data-action]');
      if (!button) return;
      var action = button.dataset.action;
      if (action === 'pick-image') {
        uploadTarget = {
          kind: button.dataset.kind || 'product',
          key: button.dataset.key || '',
          index: Number(button.dataset.index || -1)
        };
        $('imagePicker').value = '';
        $('imagePicker').click();
      }
      if (action === 'delete-product') deleteProduct();
      if (action === 'add-offer') addOffer();
      if (action === 'add-divider') addDivider();
      if (action === 'remove-offer') removeOffer(Number(button.dataset.index));
      if (action === 'move-offer') moveOffer(Number(button.dataset.index), Number(button.dataset.direction));
    }
    function handleEditorInput(event) {
      var target = event.target;
      var product = currentProduct();
      if (!product || !target) return;
      if (target.dataset.action === 'update-slug') {
        product.slug = slugify(target.value) || product.slug;
        selectedSlug = product.slug;
        renderProductList();
        return;
      }
      if (target.dataset.productField) {
        var key = target.dataset.productField;
        product[key] = key === 'iconScale' ? percentToScale(target.value, product.iconScale || 1) : target.value;
        if (key === 'iconScale') {
          var productPreview = document.querySelector('[data-product-preview="icon"] img');
          if (productPreview) productPreview.style.transform = 'scale(' + product[key] + ')';
        }
        if (key === 'name' || key === 'icon') renderProductList();
        return;
      }
      if (target.dataset.offerIndex && target.dataset.offerField) {
        var index = Number(target.dataset.offerIndex);
        var field = target.dataset.offerField;
        if (!product.offers || !product.offers[index]) return;
        if (field === 'iconScale') {
          product.offers[index][field] = percentToScale(target.value, product.offers[index][field] || 1);
          var offerPreview = document.querySelector('[data-offer-preview="' + index + '"] img');
          if (offerPreview) offerPreview.style.transform = 'scale(' + product.offers[index][field] + ')';
          return;
        }
        if (field === 'priceRub') {
          product.offers[index][field] = Math.max(0, Math.min(999999, parseDecimal(target.value, 0)));
          return;
        }
        product.offers[index][field] = target.value;
      }
    }
    function addOffer() {
      var product = currentProduct();
      if (!product) return;
      product.offers = product.offers || [];
      product.offers.push({ label: 'Новый вариант', priceRub: 0, icon: '', iconScale: 1, messageTemplate: '🛍 Новый заказ\\n📦 Сервис: {product}\\n💎 Товар: {offer}\\n💰 К оплате: {price}р' });
      renderProductEditor();
    }
    function addDivider() {
      var product = currentProduct();
      if (!product) return;
      product.offers = product.offers || [];
      product.offers.push({ type: 'divider', title: 'Новый раздел', description: '' });
      renderProductEditor();
    }
    function removeOffer(index) {
      var product = currentProduct();
      if (!product || !product.offers[index]) return;
      product.offers.splice(index, 1);
      renderProductEditor();
    }
    function moveOffer(index, direction) {
      var product = currentProduct();
      if (!product) return;
      var next = index + direction;
      if (next < 0 || next >= product.offers.length) return;
      var item = product.offers.splice(index, 1)[0];
      product.offers.splice(next, 0, item);
      renderProductEditor();
    }
    function deleteProduct() {
      if (!confirm('Удалить товар?')) return;
      products = products.filter(function(product) { return product.slug !== selectedSlug; });
      selectedSlug = products[0] ? products[0].slug : '';
      renderProductList();
      renderProductEditor();
    }
    function addProduct() {
      var base = 'new-product', slug = base, index = 2;
      while (products.some(function(product) { return product.slug === slug; })) slug = base + '-' + index++;
      products.push({ name: 'Новый товар', slug: slug, icon: '/loading-icon.png', iconScale: 1, offers: [] });
      selectedSlug = slug;
      renderProductList();
      renderProductEditor();
    }
    function readFileDataUrl(file) {
      return new Promise(function(resolve, reject) {
        var reader = new FileReader();
        reader.onload = function() { resolve(String(reader.result || '')); };
        reader.onerror = function() { reject(new Error('Не удалось прочитать файл.')); };
        reader.readAsDataURL(file);
      });
    }
    function loadImage(dataUrl) {
      return new Promise(function(resolve, reject) {
        var image = new Image();
        image.onload = function() { resolve(image); };
        image.onerror = function() { reject(new Error('Не удалось открыть картинку.')); };
        image.src = dataUrl;
      });
    }
    async function imageFileToDataUrl(file) {
      var imageType = new RegExp('^image/(png|jpe?g|webp)$', 'i');
      if (!file || !imageType.test(file.type)) throw new Error('Выберите PNG, JPG или WEBP.');
      var original = await readFileDataUrl(file);
      if (original.length <= 260000) return original;
      var image = await loadImage(original);
      var maxSide = 512;
      while (maxSide >= 160) {
        var scale = Math.min(1, maxSide / Math.max(image.width, image.height));
        var canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        for (var quality = 0.9; quality >= 0.5; quality -= 0.1) {
          var result = canvas.toDataURL('image/webp', quality);
          if (result.length <= 260000) return result;
        }
        maxSide = Math.round(maxSide * 0.75);
      }
      throw new Error('Картинка слишком большая. Попробуйте файл поменьше.');
    }
    async function handleImagePick(event) {
      var file = event.target.files && event.target.files[0];
      var product = currentProduct();
      if (!file || !product || !uploadTarget) return;
      showNotice('Готовлю картинку...', false);
      try {
        var dataUrl = await imageFileToDataUrl(file);
        if (uploadTarget.kind === 'offer') {
          if (!product.offers || !product.offers[uploadTarget.index]) throw new Error('Вариант не найден.');
          product.offers[uploadTarget.index][uploadTarget.key] = dataUrl;
        } else {
          product[uploadTarget.key] = dataUrl;
          renderProductList();
        }
        renderProductEditor();
        showNotice('Картинка загружена. Нажмите «Сохранить товары».', false);
      } catch (error) {
        showNotice(error.message || 'Не удалось загрузить картинку.', true);
      } finally {
        uploadTarget = null;
        event.target.value = '';
      }
    }
    async function loadAll() {
      showNotice('Загружаю данные...', false);
      try {
        var result = await Promise.allSettled([
          postJson('/api/admin/products', {}),
          postJson('/api/admin/settings', {})
        ]);
        if (result[0].status === 'fulfilled') products = result[0].value.products || [];
        if (result[1].status === 'fulfilled') settings = result[1].value.settings || settings;
        var failed = result.filter(function(item) { return item.status === 'rejected'; }).length;
        selectedSlug = products[0] ? products[0].slug : '';
        $('reviewsCount').value = settings.reviewsCountLabel || '400+';
        renderAnalytics();
        renderProductList();
        renderProductEditor();
        if (failed) {
          showNotice('Товары или настройки не загрузились. Нажмите «Обновить» или войдите заново.', true);
        } else {
          showNotice('Товары загружены. Загружаю аналитику...', false);
          loadAnalytics();
        }
      } catch (error) {
        showNotice(error.message || 'Не удалось загрузить админку.', true);
      }
    }
    async function loadAnalytics() {
      try {
        var data = await postJson('/api/admin/analytics', {});
        analyticsEvents = data.events || [];
        renderAnalytics();
        showNotice('Готово.', false);
        hideNoticeSoon();
      } catch (error) {
        analyticsEvents = [];
        renderAnalytics();
        showNotice('Товары загружены. Аналитика временно недоступна.', true);
      }
    }
    async function saveProducts() {
      $('saveProductsBtn').disabled = true;
      showNotice('Сохраняю товары...', false);
      try {
        var data = await postJson('/api/admin/products', { products: products });
        products = data.products || products;
        if (!products.some(function(product) { return product.slug === selectedSlug; })) selectedSlug = products[0] ? products[0].slug : '';
        renderProductList();
        renderProductEditor();
        showNotice('Товары сохранены.', false);
        hideNoticeSoon();
      } catch (error) {
        showNotice(error.message || 'Не удалось сохранить товары.', true);
      } finally {
        $('saveProductsBtn').disabled = false;
      }
    }
    async function saveSettings() {
      $('saveSettingsBtn').disabled = true;
      showNotice('Сохраняю настройки...', false);
      try {
        settings.reviewsCountLabel = $('reviewsCount').value.trim() || '400+';
        var data = await postJson('/api/admin/settings', { settings: settings });
        settings = data.settings || settings;
        $('reviewsCount').value = settings.reviewsCountLabel || '400+';
        showNotice('Настройки главной сохранены.', false);
        hideNoticeSoon();
      } catch (error) {
        showNotice(error.message || 'Не удалось сохранить настройки.', true);
      } finally {
        $('saveSettingsBtn').disabled = false;
      }
    }
    async function logout() {
      await fetch('/api/admin/logout', { method: 'POST' }).catch(function() {});
      window.location.replace('/admin');
    }
    document.querySelectorAll('.tab').forEach(function(button) {
      button.addEventListener('click', function() {
        document.querySelectorAll('.tab').forEach(function(tab) { tab.classList.remove('active'); });
        document.querySelectorAll('.section').forEach(function(section) { section.classList.remove('active'); });
        button.classList.add('active');
        $(button.dataset.tab).classList.add('active');
      });
    });
    $('reloadBtn').addEventListener('click', loadAll);
    $('logoutBtn').addEventListener('click', logout);
    $('addProductBtn').addEventListener('click', addProduct);
    $('saveProductsBtn').addEventListener('click', saveProducts);
    $('saveSettingsBtn').addEventListener('click', saveSettings);
    $('productList').addEventListener('click', handleProductListClick);
    $('productEditor').addEventListener('click', handleEditorClick);
    $('productEditor').addEventListener('input', handleEditorInput);
    $('imagePicker').addEventListener('change', handleImagePick);
    loadAll();
  </script>
</body>
</html>`;

function readCookie(request: Request, name: string) {
  const header = request.headers.get("cookie") || "";
  const prefix = `${name}=`;
  const cookie = header
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));

  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : "";
}

function hasAdminSession(request: Request) {
  const expected = getAdminSessionValue(getAdminSessionSecret(), request.headers.get("user-agent") || "");
  const actual = readCookie(request, ADMIN_SESSION_COOKIE);

  return safeEqual(actual, expected);
}

function htmlResponse(html: string) {
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
      "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet",
    },
  });
}

export function GET(request: Request) {
  return htmlResponse(hasAdminSession(request) ? ADMIN_HTML : LOGIN_HTML);
}
