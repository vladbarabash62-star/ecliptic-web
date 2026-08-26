import { ADMIN_SESSION_COOKIE, getAdminSessionSecret, getAdminSessionValue, safeEqual } from "../../lib/security";

export const dynamic = "force-dynamic";

const STYLE = `
  :root { color-scheme: dark; --bg:#000; --panel:#0b0f18; --panel2:#111827; --line:rgba(255,255,255,.13); --text:#fff; --muted:rgba(255,255,255,.64); --blue:#0ea5e9; --green:#10b981; --red:#ef4444; }
  * { box-sizing:border-box; }
  html,body { margin:0; min-height:100%; }
  body { min-height:100vh; background:#000; color:#fff; font-family:Inter,Segoe UI,Arial,sans-serif; }
  body:before { content:""; position:fixed; inset:0; pointer-events:none; background-image:radial-gradient(#fff 1px, transparent 1.5px); background-size:92px 92px; opacity:.24; }
  button,input,textarea { font:inherit; }
  button { cursor:pointer; }
  input,textarea { width:100%; border:1px solid var(--line); border-radius:12px; background:#07101d; color:#fff; padding:11px 12px; outline:none; }
  textarea { min-height:86px; resize:vertical; }
  input:focus,textarea:focus { border-color:rgba(56,189,248,.7); }
  label { display:block; margin:0 0 7px; color:rgba(255,255,255,.7); font-size:12px; font-weight:850; }
  h1,h2,h3,p { margin:0; }
  .page { position:relative; z-index:1; width:min(1480px,calc(100% - 28px)); margin:0 auto; padding:22px 0 44px; }
  .brand { color:#bae6fd; font-size:13px; font-weight:950; letter-spacing:.04em; text-transform:uppercase; }
  .muted { color:var(--muted); }
  .card { border:1px solid var(--line); background:rgba(11,15,24,.92); border-radius:18px; box-shadow:0 22px 70px rgba(0,0,0,.26); }
  .top { display:flex; justify-content:space-between; align-items:flex-end; gap:16px; margin-bottom:16px; }
  .top h1 { margin-top:8px; font-size:clamp(30px,4vw,48px); line-height:1.05; }
  .toolbar { display:flex; flex-wrap:wrap; gap:10px; align-items:center; }
  .btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; min-height:42px; border:1px solid transparent; border-radius:12px; padding:11px 14px; background:var(--blue); color:#fff; font-weight:900; text-decoration:none; }
  .btn.secondary { background:rgba(255,255,255,.06); border-color:var(--line); }
  .btn.green { background:var(--green); }
  .btn.red { background:rgba(239,68,68,.14); border-color:rgba(239,68,68,.38); color:#fecaca; }
  .btn:disabled { opacity:.55; cursor:not-allowed; }
  .notice { display:none; margin-bottom:16px; padding:12px 14px; border-radius:14px; border:1px solid var(--line); background:rgba(255,255,255,.05); color:#dbeafe; }
  .notice.show { display:block; }
  .notice.error { border-color:rgba(239,68,68,.38); background:rgba(239,68,68,.11); color:#fecaca; }
  .tabs { display:flex; flex-wrap:wrap; gap:8px; padding:8px; margin-bottom:16px; }
  .tab { border:1px solid transparent; border-radius:12px; padding:11px 14px; background:transparent; color:#fff; font-weight:900; }
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
  .row strong { overflow-wrap:anywhere; }
  .row-meta { margin-top:3px; color:rgba(255,255,255,.48); font-size:12px; font-weight:700; }
  .bar { height:8px; margin-top:8px; overflow:hidden; border-radius:999px; background:rgba(255,255,255,.08); }
  .bar span { display:block; height:100%; background:linear-gradient(90deg,#38bdf8,#22c55e); }
  .admin-grid { display:grid; grid-template-columns:330px minmax(0,1fr); gap:14px; }
  .sidebar { padding:12px; max-height:calc(100vh - 220px); overflow:auto; }
  .product-btn { width:100%; display:grid; grid-template-columns:24px 44px 1fr; gap:10px; align-items:center; margin:7px 0; padding:8px; border:1px solid rgba(56,189,248,.18); border-radius:14px; background:linear-gradient(135deg,rgba(14,165,233,.12),rgba(255,255,255,.035)); color:#fff; text-align:left; cursor:grab; }
  .product-btn.active { border-color:rgba(56,189,248,.46); background:rgba(14,165,233,.14); }
  .product-btn.dragging,.offer.dragging { opacity:.45; border-color:rgba(56,189,248,.72); }
  .product-btn.drag-over,.offer.drag-over { border-color:rgba(16,185,129,.82); background:rgba(16,185,129,.12); }
  .drag-handle { display:grid; place-items:center; color:rgba(255,255,255,.46); font-size:18px; line-height:1; cursor:grab; user-select:none; }
  .product-btn:active .drag-handle,.offer:active .drag-handle { cursor:grabbing; }
  .thumb { width:44px; height:44px; display:grid; place-items:center; border-radius:12px; background:#07101d; overflow:hidden; }
  .thumb img { max-width:74%; max-height:74%; object-fit:contain; }
  .editor,.settings-card { padding:16px; }
  .fields { display:grid; gap:12px; margin-top:14px; }
  .two { display:grid; grid-template-columns:minmax(0,1fr) minmax(150px,220px); gap:12px; }
  .upload-row { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:8px; align-items:center; }
  .image-preview { width:58px; height:58px; display:grid; place-items:center; margin-top:8px; border:1px solid rgba(255,255,255,.1); border-radius:14px; background:#07101d; overflow:hidden; color:rgba(255,255,255,.45); font-size:12px; }
  .image-preview img { max-width:80%; max-height:80%; object-fit:contain; transform-origin:center; }
  .offer { border:1px solid var(--line); background:rgba(7,16,29,.72); border-radius:14px; padding:12px; margin-top:10px; }
  .offer.variant { border-color:rgba(56,189,248,.42); background:linear-gradient(135deg,rgba(14,165,233,.18),rgba(7,16,29,.78)); box-shadow:inset 0 0 0 1px rgba(56,189,248,.08); }
  .offer.divider { border-color:rgba(250,204,21,.5); background:linear-gradient(135deg,rgba(250,204,21,.18),rgba(7,16,29,.78)); box-shadow:inset 0 0 0 1px rgba(250,204,21,.1); }
  .offer-head { display:grid; grid-template-columns:24px 1fr auto; align-items:center; gap:10px; margin-bottom:10px; }
  .offer-kind { display:inline-flex; width:max-content; align-items:center; border-radius:999px; padding:5px 10px; font-size:12px; font-weight:950; letter-spacing:.02em; }
  .offer.variant .offer-kind { border:1px solid rgba(125,211,252,.44); background:rgba(14,165,233,.2); color:#dff6ff; }
  .offer.divider .offer-kind { border:1px solid rgba(253,224,71,.5); background:rgba(250,204,21,.22); color:#fff7ad; }
  .mini-actions { display:flex; flex-wrap:wrap; gap:7px; }
  .mini { border:1px solid var(--line); border-radius:9px; padding:7px 9px; background:rgba(255,255,255,.07); color:#fff; font-size:12px; font-weight:800; }
  .empty { padding:28px; text-align:center; color:var(--muted); }
  .table { width:100%; border-collapse:collapse; margin-top:12px; }
  .table th,.table td { padding:10px; border-bottom:1px solid rgba(255,255,255,.08); text-align:left; font-size:13px; }
  .table th { color:rgba(255,255,255,.65); }
  .table td { vertical-align:top; }
  .nowrap { white-space:nowrap; }
  .visitor-cell { min-width:190px; }
  .visitor-main { font-weight:850; color:#e0f2fe; }
  .visitor-meta { margin-top:4px; color:rgba(255,255,255,.56); font-size:12px; line-height:1.35; overflow-wrap:anywhere; }
  .load-more-wrap { display:flex; justify-content:center; margin-top:14px; }
  .chart-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; margin-bottom:14px; }
  .chart-grid.two { grid-template-columns:repeat(2,minmax(0,1fr)); }
  .chart-card { padding:16px; min-height:330px; }
  .chart-card h2 { font-size:22px; margin-bottom:6px; }
  .chart-card .hint { min-height:36px; color:var(--muted); font-size:13px; line-height:1.35; }
  .pie-wrap { display:grid; grid-template-columns:170px minmax(0,1fr); gap:16px; align-items:center; margin-top:18px; }
  .pie { width:170px; aspect-ratio:1; border-radius:50%; background:conic-gradient(rgba(255,255,255,.12) 0 100%); box-shadow:inset 0 0 0 14px rgba(0,0,0,.18),0 18px 42px rgba(0,0,0,.28); }
  .legend { display:grid; gap:8px; align-content:center; }
  .legend-row { display:grid; grid-template-columns:12px 1fr auto; gap:8px; align-items:center; font-size:13px; }
  .legend.scroll { max-height:260px; overflow:auto; padding-right:4px; }
  .dot { width:12px; height:12px; border-radius:50%; background:var(--dot,#38bdf8); }
  .chart-empty { display:grid; min-height:210px; place-items:center; color:var(--muted); text-align:center; }
  .wide-chart { padding:16px; margin-bottom:14px; }
  .week-bars { display:flex; gap:12px; align-items:end; min-height:230px; margin-top:18px; padding:12px 2px 4px; border-top:1px solid rgba(255,255,255,.08); overflow-x:auto; }
  .week-bar { position:relative; flex:0 0 118px; display:grid; gap:8px; align-content:end; min-height:205px; cursor:default; }
  .week-fill { min-height:8px; border-radius:12px 12px 6px 6px; background:linear-gradient(180deg,#38bdf8,#22c55e); box-shadow:0 12px 28px rgba(34,197,94,.2); }
  .week-label { color:var(--muted); font-size:11px; line-height:1.25; text-align:center; }
  .week-value { font-weight:950; text-align:center; line-height:1.2; }
  .week-value small { display:block; margin-top:2px; color:var(--muted); font-size:11px; font-weight:800; }
  .week-tip { display:none; }
  .floating-week-tip { position:fixed; left:0; top:0; z-index:99999; width:265px; transform:translate(-50%,-110%); border:1px solid rgba(148,163,184,.34); border-radius:14px; background:rgba(7,16,29,.98); padding:12px; box-shadow:0 22px 58px rgba(0,0,0,.46); opacity:0; pointer-events:none; transition:opacity .12s ease; }
  .floating-week-tip.show { opacity:1; }
  .floating-week-tip strong { display:block; margin-bottom:8px; color:#fff; }
  .week-tip-row { display:flex; justify-content:space-between; gap:10px; color:rgba(255,255,255,.72); font-size:12px; line-height:1.55; }
  .week-tip-total { margin-top:8px; padding-top:8px; border-top:1px solid rgba(255,255,255,.08); color:#e0f2fe; font-size:12px; font-weight:900; line-height:1.45; }
  .return-list { display:grid; gap:10px; margin-top:14px; }
  .insight-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; margin-bottom:14px; }
  .insight { padding:14px; }
  .insight strong { display:block; margin-top:8px; font-size:22px; }
  .login-page { position:relative; z-index:1; min-height:100vh; display:grid; place-items:center; padding:24px; }
  .login-card { width:min(440px,100%); padding:28px; text-align:center; }
  .login-card h1 { margin-top:14px; font-size:clamp(36px,7vw,50px); line-height:1; }
  .login-form { display:grid; gap:14px; margin-top:24px; text-align:left; }
  .login-form .btn { width:100%; }
  @media (max-width:1100px) { .chart-grid,.chart-grid.two,.insight-grid { grid-template-columns:1fr; } .pie-wrap { grid-template-columns:1fr; justify-items:center; } }
  @media (max-width:940px) { .stats,.grid2,.admin-grid,.two { grid-template-columns:1fr; } .top { align-items:flex-start; flex-direction:column; } .sidebar { max-height:none; } .upload-row { grid-template-columns:1fr; } }
`;

const LOGIN_HTML = `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>Admin | Ecliptic Store</title>
  <style>${STYLE}</style>
</head>
<body>
  <main class="login-page">
    <form class="card login-card" id="loginForm" autocomplete="off">
      <div class="brand">Ecliptic Admin</div>
      <h1>Вход в админку</h1>
      <p class="muted" style="margin-top:14px;line-height:1.5">Введите пароль владельца, чтобы открыть товары, аналитику и настройки сайта.</p>
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
      if (!password) return showMessage('Введите пароль.', true);
      button.disabled = true;
      showMessage('Проверяю пароль...', false);
      try {
        var response = await fetch('/api/admin/auth', {
          method: 'POST',
          credentials: 'same-origin',
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
  <style>${STYLE}</style>
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
      <button class="tab" type="button" data-tab="charts">Диаграммы</button>
      <button class="tab" type="button" data-tab="products">Товары</button>
      <button class="tab" type="button" data-tab="settings">Главная</button>
    </nav>

    <div id="notice" class="notice show">Загружаю данные...</div>

    <section id="analytics" class="section active">
      <div class="toolbar" style="justify-content:flex-end;margin-bottom:12px">
        <button class="btn secondary" id="reloadAnalyticsBtn" type="button">Обновить аналитику</button>
        <button class="btn red" id="resetAnalyticsBtn" type="button">Сбросить статистику</button>
      </div>
      <p class="muted" id="analyticsUpdatedAt" style="margin:-4px 0 14px;text-align:right">Статистика загружается...</p>
      <div class="stats">
        <div class="card stat"><p class="muted">Всего событий</p><div id="statTotal" class="value">0</div></div>
        <div class="card stat"><p class="muted">Просмотры</p><div id="statViews" class="value">0</div></div>
        <div class="card stat"><p class="muted">Клики купить</p><div id="statBuys" class="value">0</div></div>
        <div class="card stat"><p class="muted">Telegram</p><div id="statTelegram" class="value">0</div></div>
      </div>
      <div class="grid2">
        <div class="card panel"><h2>Популярные товары</h2><div id="productStats" class="list"></div></div>
        <div class="card panel"><h2>Действия</h2><div id="actionStats" class="list"></div></div>
      </div>
      <div class="card panel" style="margin-top:14px">
        <h2>Последние события</h2>
        <div style="overflow:auto">
          <table class="table">
            <thead><tr><th>Время</th><th>Действие</th><th>Товар</th><th>Страница</th><th>Посетитель</th></tr></thead>
            <tbody id="eventsTable"></tbody>
          </table>
        </div>
        <div class="load-more-wrap">
          <button class="btn secondary" id="loadMoreEventsBtn" type="button">Показать еще события</button>
        </div>
      </div>
    </section>

    <section id="charts" class="section">
      <div class="toolbar" style="justify-content:space-between;margin-bottom:12px">
        <div>
          <h2>Диаграммы</h2>
          <p class="muted" id="chartsUpdatedAt" style="margin-top:6px">Данные загружаются...</p>
        </div>
        <button class="btn secondary" id="reloadChartsBtn" type="button">Обновить диаграммы</button>
      </div>
      <div class="chart-grid">
        <div class="card chart-card">
          <h2>Популярность товаров</h2>
          <p class="hint">Все действия по товарам: открытия и нажатия «Купить». Помогает понять общий интерес к каждому товару.</p>
          <div id="chartProducts"></div>
        </div>
        <div class="card chart-card">
          <h2>Регионы</h2>
          <p class="hint">Откуда заходят посетители по данным сервера. Если город не определён, показывается страна или «Неизвестно».</p>
          <div id="chartRegions"></div>
        </div>
        <div class="card chart-card">
          <h2>Просмотры / покупки</h2>
          <p class="hint">Соотношение обычных просмотров и нажатий «Купить». Чем больше доля покупок, тем лучше конверсия.</p>
          <div id="chartConversion"></div>
        </div>
      </div>
      <div class="insight-grid">
        <div class="card insight"><span class="muted">Конверсия в покупку</span><strong id="insightConversion">0%</strong></div>
        <div class="card insight"><span class="muted">Самый популярный товар</span><strong id="insightTopProduct">-</strong></div>
        <div class="card insight"><span class="muted">Лучший регион</span><strong id="insightTopRegion">-</strong></div>
        <div class="card insight"><span class="muted">Вернулись через день</span><strong id="insightReturnVisitors">0</strong></div>
      </div>
      <div class="chart-grid two">
        <div class="card chart-card">
          <h2>Типы действий</h2>
          <p class="hint">Что чаще делают на сайте: смотрят, открывают товары, нажимают купить, переходят в Telegram.</p>
          <div id="chartActions"></div>
        </div>
      </div>
      <div class="card wide-chart">
        <h2>Клики «Купить» по неделям</h2>
        <p class="muted" style="margin-top:6px">Сравнение недель показывает, растёт ли желание купить.</p>
        <div id="chartWeeklyBuys"></div>
      </div>
      <div class="card wide-chart">
        <h2>Открытия товаров по неделям</h2>
        <p class="muted" style="margin-top:6px">Сколько раз люди открывали страницы товаров в каждую неделю.</p>
        <div id="chartWeeklyProductViews"></div>
      </div>
      <div class="card wide-chart">
        <h2>Повторные посетители</h2>
        <p class="muted" style="margin-top:6px">Сколько клиентов возвращались на сайт снова минимум через 1 день с того же IP или того же браузера.</p>
        <div id="chartReturnVisitors"></div>
      </div>
    </section>

    <div id="floatingWeekTip" class="floating-week-tip"></div>

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
    var savedProductsSnapshot = [];
    var dirtyProductSlugs = {};
    var deletedProductSlugs = [];
    var settings = { reviewsCountLabel: '400+' };
    var analyticsEvents = [];
    var analyticsSummary = { total: 0, views: 0, buys: 0, telegram: 0, actions: {}, products: {} };
    var analyticsPagination = { offset: 0, limit: 1000, loaded: 0, totalStored: 0, hasMore: false, nextOffset: 0 };
    var selectedSlug = '';
    var uploadTarget = null;
    var dirtyProducts = false;
    var draggedProductSlug = '';
    var draggedOfferIndex = -1;
    var dragScrollTimer = 0;
    var dragScrollTarget = null;
    var dragScrollSpeed = 0;
    var KEEP_IMAGE = '__ECLIPTIC_KEEP_IMAGE__';

    function $(id) { return document.getElementById(id); }
    function esc(value) {
      return String(value == null ? '' : value)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }
    function showNotice(text, error) {
      var el = $('notice');
      el.textContent = text;
      el.className = 'notice show' + (error ? ' error' : '');
    }
    function hideNoticeSoon() {
      setTimeout(function() { $('notice').className = 'notice'; }, 2200);
    }
    function markProductsDirty(slug) {
      dirtyProducts = true;
      if (slug || selectedSlug) dirtyProductSlugs[slug || selectedSlug] = true;
      $('saveProductsBtn').textContent = 'Сохранить товары *';
    }
    function markProductsClean() {
      dirtyProducts = false;
      dirtyProductSlugs = {};
      deletedProductSlugs = [];
      $('saveProductsBtn').textContent = 'Сохранить товары';
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
    function slugify(value) {
      var map = { 'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'c','ч':'ch','ш':'sh','щ':'sch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya' };
      return String(value || '').toLowerCase().split('').map(function(ch) { return map[ch] || ch; }).join('').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64);
    }
    async function postJson(url, body, timeoutMs) {
      var controller = new AbortController();
      var timeout = setTimeout(function() { controller.abort(); }, timeoutMs || 45000);
      try {
        var response = await fetch(url, {
          method: 'POST',
          credentials: 'same-origin',
          cache: 'no-store',
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
          body: JSON.stringify(body || {}),
          signal: controller.signal
        });
        var data = await response.json().catch(function() { return {}; });
        if (!response.ok) throw new Error(data.error || ('Ошибка сервера: ' + response.status));
        return data;
      } finally {
        clearTimeout(timeout);
      }
    }
    function currentProduct() {
      return products.find(function(product) { return product.slug === selectedSlug; });
    }
    function cloneProducts(value) {
      return JSON.parse(JSON.stringify(value || []));
    }
    function previousProduct(slug) {
      return savedProductsSnapshot.find(function(product) { return product.slug === slug; });
    }
    function sameStoredImage(value, previousValue) {
      return Boolean(value && previousValue && value === previousValue);
    }
    function compactOfferForSave(offer, previousOffer, previousOffers) {
      var nextOffer = Object.assign({}, offer);
      if (nextOffer.type === 'divider') return nextOffer;

      var matchingOffer = previousOffer && previousOffer.type !== 'divider' && previousOffer.label === nextOffer.label
        ? previousOffer
        : (previousOffers || []).find(function(item) { return item && item.type !== 'divider' && item.label === nextOffer.label; });

      if (matchingOffer && sameStoredImage(nextOffer.icon, matchingOffer.icon)) {
        nextOffer.icon = KEEP_IMAGE;
      }

      return nextOffer;
    }
    function compactProductsForSave() {
      return products.map(function(product) {
        var previous = previousProduct(product.slug);
        var nextProduct = Object.assign({}, product);
        if (previous && sameStoredImage(nextProduct.icon, previous.icon)) nextProduct.icon = KEEP_IMAGE;
        if (previous && sameStoredImage(nextProduct.offerIcon, previous.offerIcon)) nextProduct.offerIcon = KEEP_IMAGE;
        nextProduct.offers = (product.offers || []).map(function(offer, index) {
          return compactOfferForSave(offer, previous && previous.offers ? previous.offers[index] : null, previous && previous.offers);
        });
        return nextProduct;
      });
    }
    function compactDirtyProductsForSave() {
      var dirtySlugs = Object.keys(dirtyProductSlugs);
      var patches = products.filter(function(product) {
        return dirtySlugs.indexOf(product.slug) !== -1 || product.slug === selectedSlug || !previousProduct(product.slug);
      }).map(function(product) {
        var previous = previousProduct(product.slug);
        var nextProduct = Object.assign({}, product);
        if (previous && sameStoredImage(nextProduct.icon, previous.icon)) nextProduct.icon = KEEP_IMAGE;
        if (previous && sameStoredImage(nextProduct.offerIcon, previous.offerIcon)) nextProduct.offerIcon = KEEP_IMAGE;
        nextProduct.offers = (product.offers || []).map(function(offer, index) {
          return compactOfferForSave(offer, previous && previous.offers ? previous.offers[index] : null, previous && previous.offers);
        });
        return nextProduct;
      });

      return {
        productPatches: patches,
        productOrder: products.map(function(product) { return product.slug; }),
        deletedSlugs: deletedProductSlugs
      };
    }
    function productNameBySlug(slug) {
      var product = products.find(function(item) { return item.slug === slug; });
      return product ? product.name : slug;
    }
    function productSlugFromPath(path) {
      var match = String(path || '').match(/^\\/products\\/([^/?#]+)/);
      return match ? decodeURIComponent(match[1]) : '';
    }
    function eventProductSlug(event) {
      return event.product || productSlugFromPath(event.path);
    }
    function eventProductLabel(event) {
      var slug = eventProductSlug(event);
      if (slug) return productNameBySlug(slug);
      return event.path === '/' ? 'Главная страница' : 'Страница сайта';
    }
    function pageLabel(path) {
      var value = String(path || '/');
      var slug = productSlugFromPath(value);
      if (slug) return '/products/' + slug + ' · ' + productNameBySlug(slug);
      if (value === '/') return '/ · Главная';
      return value;
    }
    function actionLabel(type) {
      var labels = {
        page_view: 'Просмотр страницы',
        product_open: 'Открытие товара',
        buy_click: 'Нажали «Купить»',
        telegram_contact: 'Переход в Telegram',
        telegram_channel: 'Переход в канал',
        telegram_support: 'Переход к менеджеру',
        telegram_reviews: 'Переход в отзывы',
        reviews_click: 'Открыли отзывы',
        click: 'Клик'
      };
      return labels[type] || type || 'Неизвестно';
    }
    function cleanText(value) {
      var text = String(value || '');
      try {
        return decodeURIComponent(text);
      } catch (error) {
        return text;
      }
    }
    function deviceLabel(userAgent) {
      var text = String(userAgent || '');
      if (!text) return 'устройство не определено';
      if (/Telegram/i.test(text)) return 'Telegram';
      if (/iPhone|iPad|iPod/i.test(text)) return 'iPhone/iPad';
      if (/Android/i.test(text)) return 'Android';
      if (/Mobile/i.test(text)) return 'Телефон';
      if (/Windows/i.test(text)) return 'Windows';
      if (/Macintosh|Mac OS/i.test(text)) return 'Mac';
      return 'Браузер';
    }
    function visitorHtml(event) {
      var main = event.telegramUser && (event.telegramUser.username || event.telegramUser.firstName)
        ? '@' + (event.telegramUser.username || event.telegramUser.firstName)
        : 'ID ' + (event.visitorId || 'неизвестен');
      var meta = [];
      if (event.ipAddress) {
        meta.push('IP: ' + event.ipAddress);
      } else if (event.ipHash) {
        meta.push('IP-метка: ' + event.ipHash);
      }
      if (event.city || event.region || event.country) meta.push([event.city, event.region, event.country].filter(Boolean).map(cleanText).join(', '));
      meta.push(deviceLabel(event.userAgent));
      if (event.screen) meta.push(event.screen);
      return '<div class="visitor-cell"><div class="visitor-main">' + esc(main) + '</div><div class="visitor-meta">' + esc(meta.join(' · ')) + '</div></div>';
    }
    function countBy(items, getter) {
      return items.reduce(function(acc, item) {
        var key = getter(item) || 'Неизвестно';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});
    }
    function topEntries(data, limit) {
      return Object.entries(data).sort(function(a,b) { return b[1] - a[1]; }).slice(0, limit || 8);
    }
    function percent(value, total) {
      return total > 0 ? Math.round(value / total * 100) : 0;
    }
    function decodeText(value) {
      var text = String(value || '').trim();
      if (!text) return '';
      try { return decodeURIComponent(text); } catch { return text; }
    }
    function eventRegion(event) {
      return decodeText(event.city) || decodeText(event.region) || decodeText(event.country) || 'Неизвестно';
    }
    function productName(slug) {
      var product = products.find(function(item) { return item.slug === slug; });
      return product ? product.name : slug;
    }
    function eventProductName(event) {
      var slug = eventProductSlug(event);
      return slug ? productName(slug) : 'Неизвестно';
    }
    function productSummaryNames(data) {
      return Object.entries(data || {}).reduce(function(acc, row) {
        acc[productNameBySlug(row[0])] = Number(row[1] || 0);
        return acc;
      }, {});
    }
    function actionSummaryNames(data) {
      return Object.entries(data || {}).reduce(function(acc, row) {
        var label = actionLabel(row[0]);
        acc[label] = (acc[label] || 0) + Number(row[1] || 0);
        return acc;
      }, {});
    }
    var chartColors = ['#38bdf8','#22c55e','#f59e0b','#a78bfa','#fb7185','#2dd4bf','#f97316','#60a5fa','#facc15','#34d399','#c084fc','#fb923c','#67e8f9','#fda4af'];
    function renderPie(id, rows) {
      var total = rows.reduce(function(sum, row) { return sum + row[1]; }, 0);
      if (!total) {
        $(id).innerHTML = '<div class="chart-empty">Пока нет данных для диаграммы.</div>';
        return;
      }
      var used = 0;
      var segments = rows.map(function(row, index) {
        var from = used / total * 100;
        used += row[1];
        var to = used / total * 100;
        return chartColors[index % chartColors.length] + ' ' + from.toFixed(2) + '% ' + to.toFixed(2) + '%';
      }).join(',');
      var legend = rows.map(function(row, index) {
        return '<div class="legend-row"><span class="dot" style="--dot:' + chartColors[index % chartColors.length] + '"></span><span>' + esc(row[0]) + '</span><strong>' + row[1] + ' · ' + percent(row[1], total) + '%</strong></div>';
      }).join('');
      $(id).innerHTML = '<div class="pie-wrap"><div class="pie" style="background:conic-gradient(' + segments + ')"></div><div class="legend ' + (rows.length > 8 ? 'scroll' : '') + '">' + legend + '</div></div>';
    }
    function formatShortDate(date) {
      return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
    }
    function formatDayName(date) {
      return date.toLocaleDateString('ru-RU', { weekday: 'short', day: '2-digit', month: '2-digit' });
    }
    function mondayStart(date) {
      var copy = new Date(date);
      copy.setHours(0, 0, 0, 0);
      var day = copy.getDay();
      var shift = day === 0 ? -6 : 1 - day;
      copy.setDate(copy.getDate() + shift);
      return copy;
    }
    function normalizeOfferText(value) {
      return String(value || '').toLowerCase().replace(/ё/g, 'е').replace(/\\s+/g, ' ').trim();
    }
    function priceFromProductOffer(event) {
      if (!event.product || !event.offer) return 0;
      var product = products.find(function(item) { return item.slug === event.product; });
      if (!product || !Array.isArray(product.offers)) return 0;
      var offerText = normalizeOfferText(event.offer);
      var offer = product.offers.find(function(item) {
        return item && item.type !== 'divider' && normalizeOfferText(item.label) === offerText;
      }) || product.offers.find(function(item) {
        var label = item && item.type !== 'divider' ? normalizeOfferText(item.label) : '';
        return label && (offerText.indexOf(label) !== -1 || label.indexOf(offerText) !== -1);
      });
      return offer && Number(offer.priceRub) > 0 ? Number(offer.priceRub) : 0;
    }
    function parsePrice(event) {
      var direct = Number(event.price || event.priceRub || 0);
      if (Number.isFinite(direct) && direct > 0) return direct;
      var offerPrice = priceFromProductOffer(event);
      if (offerPrice > 0) return offerPrice;
      var text = String(event.offer || '') + ' ' + String(event.message || '');
      var match = text.match(/(?:к оплате|оплате|цена)?\\D*(\\d{1,7})\\s*(?:р|₽)/i);
      return match ? Number(match[1]) : 0;
    }
    function weekRanges(events) {
      var dates = events.map(function(event) { return event.time ? new Date(event.time) : null; }).filter(function(date) { return date && !Number.isNaN(date.getTime()); });
      if (!dates.length) return [];
      var first = mondayStart(new Date(Math.min.apply(null, dates)));
      var last = mondayStart(new Date(Math.max.apply(null, dates)));
      last.setHours(23, 59, 59, 999);
      var ranges = [];
      var start = new Date(first);
      while (start <= last) {
        var end = new Date(start);
        end.setDate(end.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        ranges.push({
          start: new Date(start),
          end: new Date(end),
          label: formatShortDate(start) + ' - ' + formatShortDate(end)
        });
        start.setDate(start.getDate() + 7);
      }
      return ranges;
    }
    function renderWeekBars(id, events, type, unit) {
      var ranges = weekRanges(events);
      if (!ranges.length) {
        $(id).innerHTML = '<div class="chart-empty">Пока нет данных для недельного графика.</div>';
        return;
      }
      var rows = ranges.map(function(range) {
        var days = [];
        for (var index = 0; index < 7; index += 1) {
          var day = new Date(range.start);
          day.setDate(day.getDate() + index);
          days.push({ date: day, value: 0, sum: 0 });
        }
        return { label: range.label, start: range.start, end: range.end, value: 0, sum: 0, days: days };
      });
      events.forEach(function(event) {
        if (event.type !== type || !event.time) return;
        var date = new Date(event.time);
        if (Number.isNaN(date.getTime())) return;
        var row = rows.find(function(item) { return date >= item.start && date <= item.end; });
        if (!row) return;
        var price = type === 'buy_click' ? parsePrice(event) : 0;
        row.value += 1;
        row.sum += price;
        var stamp = dayStamp(date);
        var day = row.days.find(function(item) { return dayStamp(item.date) === stamp; });
        if (day) {
          day.value += 1;
          day.sum += price;
        }
      });
      var max = Math.max(1, ...rows.map(function(row) { return row.value; }));
      $(id).innerHTML = '<div class="week-bars">' + rows.map(function(row) {
        var height = Math.max(8, Math.round(row.value / max * 150));
        var activeDays = row.days.filter(function(day) { return day.value > 0; });
        var dayRows = activeDays.map(function(day) {
          var valueText = type === 'buy_click' ? day.value + ' - ' + day.sum + ' р' : String(day.value);
          return '<div class="week-tip-row"><span>' + esc(formatDayName(day.date)) + '</span><b>' + valueText + '</b></div>';
        }).join('') || '<div class="week-tip-row"><span>Нет действий</span><b>-</b></div>';
        var totalText = type === 'buy_click'
          ? 'Заказов: ' + row.value + '<br>Сумма: ' + row.sum + ' р'
          : 'Открытий: ' + row.value;
        var tip = '<strong>' + esc(row.label) + '</strong>' + dayRows + '<div class="week-tip-total">' + totalText + '</div>';
        return '<div class="week-bar" data-week-tip="' + esc(tip) + '"><div class="week-value">' + row.value + '<small>' + esc(unit) + '</small></div><div class="week-fill" style="height:' + height + 'px"></div><div class="week-label">' + esc(row.label) + '</div></div>';
      }).join('') + '</div>';
    }
    function showFloatingWeekTip(event, html) {
      var tip = $('floatingWeekTip');
      tip.innerHTML = html;
      tip.classList.add('show');
      moveFloatingWeekTip(event);
    }
    function moveFloatingWeekTip(event) {
      var tip = $('floatingWeekTip');
      var margin = 16;
      var width = 265;
      var x = Math.min(window.innerWidth - width / 2 - margin, Math.max(width / 2 + margin, event.clientX));
      var y = Math.max(130, event.clientY - 18);
      tip.style.left = x + 'px';
      tip.style.top = y + 'px';
    }
    function hideFloatingWeekTip() {
      var tip = $('floatingWeekTip');
      tip.classList.remove('show');
    }
    function dayStamp(date) {
      return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    }
    function visitorKey(event) {
      return event.ipAddress || event.ipHash || event.visitorId || '';
    }
    function returningVisitors(events) {
      var byVisitor = {};
      events.forEach(function(event) {
        var key = visitorKey(event);
        if (!key || !event.time) return;
        var date = new Date(event.time);
        if (Number.isNaN(date.getTime())) return;
        if (!byVisitor[key]) byVisitor[key] = { key: key, days: new Set(), events: 0, label: eventRegion(event) };
        byVisitor[key].days.add(dayStamp(date));
        byVisitor[key].events += 1;
      });
      return Object.values(byVisitor).filter(function(item) {
        var days = Array.from(item.days).sort(function(a, b) { return a - b; });
        return days.some(function(day, index) { return index > 0 && day - days[0] >= 86400000; });
      }).sort(function(a, b) { return b.events - a.events; });
    }
    function visitorDisplayKey(key) {
      var text = String(key || 'неизвестно');
      return text.length > 18 ? text.slice(0, 8) + '...' + text.slice(-6) : text;
    }
    function renderReturnVisitors(id, events) {
      var rows = returningVisitors(events);
      if (!rows.length) {
        $(id).innerHTML = '<div class="chart-empty">Пока нет повторных посетителей по текущим данным.</div>';
        return;
      }
      var visible = rows.slice(0, 12);
      var total = visible.reduce(function(sum, row) { return sum + row.events; }, 0);
      var used = 0;
      var segments = visible.map(function(row, index) {
        var from = used / total * 100;
        used += row.events;
        var to = used / total * 100;
        return chartColors[index % chartColors.length] + ' ' + from.toFixed(2) + '% ' + to.toFixed(2) + '%';
      }).join(',');
      var legend = visible.map(function(row, index) {
        var days = Array.from(row.days).sort(function(a, b) { return a - b; }).map(function(stamp) { return formatShortDate(new Date(stamp)); }).join(', ');
        return '<div class="legend-row"><span class="dot" style="--dot:' + chartColors[index % chartColors.length] + '"></span><span>' + esc(row.label || visitorDisplayKey(row.key)) + '<br><span class="row-meta">' + esc(visitorDisplayKey(row.key)) + ' · ' + esc(days) + '</span></span><strong>' + row.events + ' · ' + percent(row.events, total) + '%</strong></div>';
      }).join('');
      $(id).innerHTML = '<div class="pie-wrap"><div class="pie" style="background:conic-gradient(' + segments + ')"></div><div class="legend scroll">' + legend + '</div></div>';
    }
    function renderBars(id, data) {
      var rows = Object.entries(data).sort(function(a,b) { return b[1] - a[1]; }).slice(0, 8);
      var max = Math.max(1, ...rows.map(function(row) { return row[1]; }));
      $(id).innerHTML = rows.length ? rows.map(function(row) {
        var label = id === 'actionStats' ? actionLabel(row[0]) : productNameBySlug(row[0]);
        var meta = label !== row[0] ? '<div class="row-meta">' + esc(row[0]) + '</div>' : '';
        return '<div class="row"><div><strong>' + esc(label) + '</strong>' + meta + '<div class="bar"><span style="width:' + Math.max(8, Math.round(row[1] / max * 100)) + '%"></span></div></div><strong>' + row[1] + '</strong></div>';
      }).join('') : '<p class="muted">Пока нет данных.</p>';
    }
    function renderAnalytics() {
      var fallbackProducts = countBy(analyticsEvents.filter(function(e) { return eventProductSlug(e); }), function(e) { return eventProductSlug(e); });
      var fallbackActions = countBy(analyticsEvents, function(e) { return e.type; });
      $('statTotal').textContent = analyticsSummary.total || analyticsEvents.length;
      $('statViews').textContent = analyticsSummary.views || analyticsEvents.filter(function(e) { return e.type === 'page_view'; }).length;
      $('statBuys').textContent = analyticsSummary.buys || analyticsEvents.filter(function(e) { return e.type === 'buy_click'; }).length;
      $('statTelegram').textContent = analyticsSummary.telegram || analyticsEvents.filter(function(e) { return String(e.type || '').indexOf('telegram') !== -1; }).length;
      renderBars('productStats', Object.keys(analyticsSummary.products || {}).length ? analyticsSummary.products : fallbackProducts);
      renderBars('actionStats', Object.keys(analyticsSummary.actions || {}).length ? analyticsSummary.actions : fallbackActions);
      $('eventsTable').innerHTML = analyticsEvents.map(function(event) {
        var time = event.time ? new Date(event.time).toLocaleString('ru-RU') : '';
        return '<tr><td class="nowrap">' + esc(time) + '</td><td>' + esc(actionLabel(event.type)) + '</td><td>' + esc(eventProductLabel(event)) + '</td><td>' + esc(pageLabel(event.path)) + '</td><td>' + visitorHtml(event) + '</td></tr>';
      }).join('') || '<tr><td colspan="5" class="muted">Пока нет событий.</td></tr>';
      $('loadMoreEventsBtn').style.display = analyticsPagination.hasMore ? 'inline-flex' : 'none';
      $('loadMoreEventsBtn').textContent = analyticsPagination.hasMore
        ? 'Показать еще события (' + analyticsEvents.length + ' из ' + analyticsPagination.totalStored + ')'
        : 'Все события загружены';
      renderCharts();
    }
    function renderCharts() {
      var chartEvents = analyticsEvents.filter(function(e) { return !(e.type === 'page_view' && e.path === '/'); });
      var buyEvents = chartEvents.filter(function(e) { return e.type === 'buy_click'; });
      var pageViews = chartEvents.filter(function(e) { return e.type === 'page_view'; });
      var productOpens = chartEvents.filter(function(e) { return e.type === 'product_open'; });
      var regions = countBy(chartEvents, eventRegion);
      var fallbackProductCounts = countBy(chartEvents.filter(function(e) { return e.product; }), eventProductName);
      var productCounts = Object.keys(analyticsSummary.products || {}).length ? productSummaryNames(analyticsSummary.products) : fallbackProductCounts;
      var fallbackActions = countBy(chartEvents, function(e) { return actionLabel(e.type); });
      var actions = fallbackActions;
      var conversionRows = [['Просто просмотрели страницу', pageViews.length], ['Нажали «Купить»', buyEvents.length]];
      var topProduct = topEntries(productCounts, 1)[0];
      var topRegion = topEntries(regions, 1)[0];
      var returnCount = returningVisitors(analyticsEvents).length;

      renderPie('chartProducts', topEntries(productCounts, products.length || 100));
      renderPie('chartRegions', topEntries(regions, 6));
      renderPie('chartConversion', conversionRows);
      renderPie('chartActions', topEntries(actions, 10));
      renderWeekBars('chartWeeklyBuys', chartEvents, 'buy_click', 'кликов');
      renderWeekBars('chartWeeklyProductViews', chartEvents, 'product_open', 'открытий');
      renderReturnVisitors('chartReturnVisitors', chartEvents);

      $('insightConversion').textContent = percent(buyEvents.length, Math.max(1, pageViews.length)) + '%';
      $('insightTopProduct').textContent = topProduct ? topProduct[0] : '-';
      $('insightTopRegion').textContent = topRegion ? topRegion[0] : '-';
      $('insightReturnVisitors').textContent = String(returnCount);
      $('chartsUpdatedAt').textContent = 'Обновлено: ' + new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' · событий без главной: ' + chartEvents.length + ' · открытий товаров: ' + productOpens.length;
    }
    function updateAnalyticsTimestamp() {
      $('analyticsUpdatedAt').textContent = 'Обновлено: ' + new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
    function renderProductList() {
      $('productList').innerHTML = products.map(function(product) {
        return '<button class="product-btn ' + (product.slug === selectedSlug ? 'active' : '') + '" type="button" draggable="true" data-action="select-product" data-slug="' + esc(product.slug) + '">' +
          '<span class="drag-handle" title="Перетащить">↕</span>' +
          '<span class="thumb"><img src="' + esc(product.icon || '/loading-icon.png') + '" alt=""></span>' +
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
        '<div id="offersList">' + renderOffers(product) + '</div>';
    }
    function renderOffers(product) {
      return (product.offers || []).map(function(offer, index) {
        var controls = '<div class="mini-actions"><button class="mini" type="button" data-action="move-offer" data-index="' + index + '" data-direction="-1">Вверх</button><button class="mini" type="button" data-action="move-offer" data-index="' + index + '" data-direction="1">Вниз</button><button class="mini" type="button" data-action="remove-offer" data-index="' + index + '">Удалить</button></div>';
        if (offer.type === 'divider') {
          return '<div class="offer divider" draggable="true" data-offer-drag-index="' + index + '"><div class="offer-head"><span class="drag-handle" title="Перетащить">↕</span><strong class="offer-kind">Раздел</strong>' + controls + '</div>' +
            '<div class="two"><div><label>Заголовок</label><input value="' + esc(offer.title || '') + '" data-offer-index="' + index + '" data-offer-field="title"></div>' +
            '<div><label>Описание</label><input value="' + esc(offer.description || '') + '" data-offer-index="' + index + '" data-offer-field="description"></div></div></div>';
        }
        return '<div class="offer variant" draggable="true" data-offer-drag-index="' + index + '"><div class="offer-head"><span class="drag-handle" title="Перетащить">↕</span><strong class="offer-kind">Вариант</strong>' + controls + '</div>' +
          '<div class="two"><div><label>Название</label><input value="' + esc(offer.label || '') + '" data-offer-index="' + index + '" data-offer-field="label"></div>' +
          '<div><label>Цена</label><input type="number" min="0" value="' + esc(offer.priceRub || 0) + '" data-offer-index="' + index + '" data-offer-field="priceRub"></div></div>' +
          offerImageField(index, offer.icon || '', offer.iconScale || 1) +
          '<div style="margin-top:10px"><label>Размер картинки варианта (%)</label><input type="number" step="1" min="-100" max="100" value="' + esc(scaleToPercent(offer.iconScale || 1)) + '" data-offer-index="' + index + '" data-offer-field="iconScale"></div>' +
          '<div style="margin-top:10px"><label>Текст Telegram</label><textarea data-offer-index="' + index + '" data-offer-field="messageTemplate">' + esc(offer.messageTemplate || '') + '</textarea></div></div>';
      }).join('');
    }
    function selectProduct(slug) {
      selectedSlug = slug || '';
      renderProductList();
      renderProductEditor();
    }
    function handleEditorClick(event) {
      var button = event.target.closest('[data-action]');
      if (!button) return;
      var action = button.dataset.action;
      if (action === 'pick-image') {
        uploadTarget = { kind: button.dataset.kind || 'product', key: button.dataset.key || '', index: Number(button.dataset.index || -1) };
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
        var previousSlug = product.slug;
        product.slug = slugify(target.value) || product.slug;
        if (previousSlug !== product.slug && deletedProductSlugs.indexOf(previousSlug) === -1) deletedProductSlugs.push(previousSlug);
        selectedSlug = product.slug;
        markProductsDirty();
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
        markProductsDirty();
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
        } else if (field === 'priceRub') {
          product.offers[index][field] = Math.max(0, Math.min(999999, parseDecimal(target.value, 0)));
        } else {
          product.offers[index][field] = target.value;
        }
        markProductsDirty();
      }
    }
    function addOffer() {
      var product = currentProduct();
      if (!product) return;
      product.offers = product.offers || [];
      product.offers.push({ label: 'Новый вариант', priceRub: 0, icon: '', iconScale: 1, messageTemplate: '🛍 Новый заказ\\n📦 Сервис: {product}\\n💎 Товар: {offer}\\n💰 К оплате: {price}р' });
      markProductsDirty();
      renderProductEditor();
    }
    function addDivider() {
      var product = currentProduct();
      if (!product) return;
      product.offers = product.offers || [];
      product.offers.push({ type: 'divider', title: 'Новый раздел', description: '' });
      markProductsDirty();
      renderProductEditor();
    }
    function removeOffer(index) {
      var product = currentProduct();
      if (!product || !product.offers[index]) return;
      product.offers.splice(index, 1);
      markProductsDirty();
      renderProductEditor();
    }
    function moveOffer(index, direction) {
      var product = currentProduct();
      if (!product) return;
      var next = index + direction;
      if (next < 0 || next >= product.offers.length) return;
      var item = product.offers.splice(index, 1)[0];
      product.offers.splice(next, 0, item);
      markProductsDirty();
      renderProductEditor();
    }
    function moveArrayItem(items, fromIndex, toIndex) {
      if (!items || fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= items.length || toIndex >= items.length) return false;
      var item = items.splice(fromIndex, 1)[0];
      items.splice(toIndex, 0, item);
      return true;
    }
    function productIndexBySlug(slug) {
      return products.findIndex(function(product) { return product.slug === slug; });
    }
    function clearDragClasses() {
      document.querySelectorAll('.dragging,.drag-over').forEach(function(element) {
        element.classList.remove('dragging', 'drag-over');
      });
    }
    function isDraggingSomething() {
      return Boolean(draggedProductSlug) || draggedOfferIndex >= 0;
    }
    function stopDragAutoScroll() {
      if (!dragScrollTimer) return;
      window.clearInterval(dragScrollTimer);
      dragScrollTimer = 0;
      dragScrollTarget = null;
      dragScrollSpeed = 0;
    }
    function startDragAutoScroll(target, speed) {
      if (!speed) return;
      if (dragScrollTimer && dragScrollTarget === target && dragScrollSpeed === speed) return;
      stopDragAutoScroll();
      dragScrollTarget = target;
      dragScrollSpeed = speed;
      dragScrollTimer = window.setInterval(function() {
        if (dragScrollTarget === window) {
          window.scrollBy({ top: dragScrollSpeed, behavior: 'auto' });
        } else if (dragScrollTarget) {
          dragScrollTarget.scrollTop += dragScrollSpeed;
        }
      }, 16);
    }
    function scrollContainerAtPoint(x, y) {
      var element = document.elementFromPoint(x, y);
      var container = element && element.closest ? element.closest('.sidebar') : null;
      if (container && container.scrollHeight > container.clientHeight) return container;
      return window;
    }
    function updateDragAutoScroll(event) {
      if (!isDraggingSomething()) return;
      var edge = 120;
      var maxSpeed = 34;
      var y = event.clientY;
      var target = scrollContainerAtPoint(event.clientX, y);
      var top = 0;
      var bottom = window.innerHeight;
      if (target !== window) {
        var rect = target.getBoundingClientRect();
        top = rect.top;
        bottom = rect.bottom;
      }
      if (y < edge) {
        startDragAutoScroll(window, -Math.max(10, Math.round((edge - y) / edge * maxSpeed)));
      } else if (window.innerHeight - y < edge) {
        startDragAutoScroll(window, Math.max(10, Math.round((edge - (window.innerHeight - y)) / edge * maxSpeed)));
      } else if (target !== window && y - top < edge) {
        startDragAutoScroll(target, -Math.max(10, Math.round((edge - (y - top)) / edge * maxSpeed)));
      } else if (target !== window && bottom - y < edge) {
        startDragAutoScroll(target, Math.max(10, Math.round((edge - (bottom - y)) / edge * maxSpeed)));
      } else {
        stopDragAutoScroll();
      }
    }
    function handleDragWheel(event) {
      if (!isDraggingSomething()) return;
      window.scrollBy({ top: event.deltaY, behavior: 'auto' });
    }
    function handleProductDragStart(event) {
      var item = event.target.closest('.product-btn');
      if (!item) return;
      draggedProductSlug = item.dataset.slug || '';
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', draggedProductSlug);
      }
      item.classList.add('dragging');
    }
    function handleProductDragOver(event) {
      var item = event.target.closest('.product-btn');
      if (!item || !draggedProductSlug) return;
      event.preventDefault();
      updateDragAutoScroll(event);
      item.classList.add('drag-over');
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    }
    function handleProductDragLeave(event) {
      var item = event.target.closest('.product-btn');
      if (item) item.classList.remove('drag-over');
    }
    function handleProductDrop(event) {
      var item = event.target.closest('.product-btn');
      if (!item || !draggedProductSlug) return;
      event.preventDefault();
      var fromIndex = productIndexBySlug(draggedProductSlug);
      var toIndex = productIndexBySlug(item.dataset.slug || '');
      if (moveArrayItem(products, fromIndex, toIndex)) {
        selectedSlug = draggedProductSlug;
        markProductsDirty();
        renderProductList();
        renderProductEditor();
      }
      draggedProductSlug = '';
      stopDragAutoScroll();
      clearDragClasses();
    }
    function handleOfferDragStart(event) {
      var target = event.target;
      if (target.closest('input,textarea,button,select')) {
        event.preventDefault();
        return;
      }
      var item = target.closest('.offer');
      if (!item) return;
      draggedOfferIndex = Number(item.dataset.offerDragIndex || -1);
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', String(draggedOfferIndex));
      }
      item.classList.add('dragging');
    }
    function handleOfferDragOver(event) {
      var item = event.target.closest('.offer');
      if (!item || draggedOfferIndex < 0) return;
      event.preventDefault();
      updateDragAutoScroll(event);
      item.classList.add('drag-over');
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    }
    function handleOfferDragLeave(event) {
      var item = event.target.closest('.offer');
      if (item) item.classList.remove('drag-over');
    }
    function handleOfferDrop(event) {
      var item = event.target.closest('.offer');
      var product = currentProduct();
      if (!item || !product || draggedOfferIndex < 0) return;
      event.preventDefault();
      var toIndex = Number(item.dataset.offerDragIndex || -1);
      if (moveArrayItem(product.offers, draggedOfferIndex, toIndex)) {
        markProductsDirty();
        renderProductEditor();
      }
      draggedOfferIndex = -1;
      stopDragAutoScroll();
      clearDragClasses();
    }
    function handleDragEnd() {
      draggedProductSlug = '';
      draggedOfferIndex = -1;
      stopDragAutoScroll();
      clearDragClasses();
    }
    function deleteProduct() {
      if (!confirm('Удалить товар?')) return;
      if (selectedSlug && deletedProductSlugs.indexOf(selectedSlug) === -1) deletedProductSlugs.push(selectedSlug);
      products = products.filter(function(product) { return product.slug !== selectedSlug; });
      selectedSlug = products[0] ? products[0].slug : '';
      markProductsDirty();
      renderProductList();
      renderProductEditor();
    }
    function addProduct() {
      var base = 'new-product', slug = base, index = 2;
      while (products.some(function(product) { return product.slug === slug; })) slug = base + '-' + index++;
      products.push({ name: 'Новый товар', slug: slug, icon: '/loading-icon.png', iconScale: 1, offers: [], messageTemplate: '' });
      selectedSlug = slug;
      markProductsDirty();
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
      if (!file || !/^image\\/(png|jpe?g|webp)$/i.test(file.type)) throw new Error('Выберите PNG, JPG или WEBP.');
      var original = await readFileDataUrl(file);
      if (original.length <= 95000) return original;
      var image = await loadImage(original);
      var maxSide = 420;
      while (maxSide >= 160) {
        var scale = Math.min(1, maxSide / Math.max(image.width, image.height));
        var canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        for (var quality = 0.82; quality >= 0.45; quality -= 0.08) {
          var result = canvas.toDataURL('image/webp', quality);
          if (result.length <= 95000) return result;
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
        markProductsDirty();
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
        var result = await Promise.allSettled([postJson('/api/admin/products', {}), postJson('/api/admin/settings', {})]);
        if (result[0].status === 'fulfilled') products = result[0].value.products || [];
        savedProductsSnapshot = cloneProducts(products);
        if (result[1].status === 'fulfilled') settings = result[1].value.settings || settings;
        var failed = result.filter(function(item) { return item.status === 'rejected'; }).length;
        selectedSlug = products[0] ? products[0].slug : '';
        $('reviewsCount').value = settings.reviewsCountLabel || '400+';
        renderProductList();
        renderProductEditor();
        markProductsClean();
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
    async function loadAnalytics(offset) {
      var shouldAppend = Number(offset || 0) > 0;
      var loadOffset = shouldAppend ? offset : 0;
      $('loadMoreEventsBtn').disabled = true;
      try {
        var data = await postJson('/api/admin/analytics', { offset: loadOffset, limit: analyticsPagination.limit });
        analyticsEvents = shouldAppend ? analyticsEvents.concat(data.events || []) : data.events || [];
        analyticsSummary = data.summary || analyticsSummary;
        analyticsPagination = data.pagination || {
          offset: loadOffset,
          limit: analyticsPagination.limit,
          loaded: data.events ? data.events.length : 0,
          totalStored: analyticsEvents.length,
          hasMore: false,
          nextOffset: analyticsEvents.length,
        };
        renderAnalytics();
        updateAnalyticsTimestamp();
        showNotice('Готово.', false);
        hideNoticeSoon();
      } catch (error) {
        analyticsEvents = [];
        analyticsSummary = { total: 0, views: 0, buys: 0, telegram: 0, actions: {}, products: {} };
        analyticsPagination = { offset: 0, limit: 1000, loaded: 0, totalStored: 0, hasMore: false, nextOffset: 0 };
        renderAnalytics();
        $('analyticsUpdatedAt').textContent = 'Статистика временно не обновилась';
        showNotice('Товары загружены. Аналитика временно недоступна.', true);
      } finally {
        $('loadMoreEventsBtn').disabled = false;
      }
    }
    async function resetAnalytics() {
      if (!confirm('Сбросить всю статистику?')) return;
      $('resetAnalyticsBtn').disabled = true;
      showNotice('Сбрасываю статистику...', false);
      try {
        var data = await postJson('/api/admin/analytics', { reset: true });
        analyticsEvents = data.events || [];
        analyticsSummary = data.summary || { total: 0, views: 0, buys: 0, telegram: 0, actions: {}, products: {} };
        analyticsPagination = data.pagination || { offset: 0, limit: 1000, loaded: 0, totalStored: 0, hasMore: false, nextOffset: 0 };
        renderAnalytics();
        updateAnalyticsTimestamp();
        showNotice('Статистика сброшена.', false);
        hideNoticeSoon();
      } catch (error) {
        showNotice(error.message || 'Не удалось сбросить статистику.', true);
      } finally {
        $('resetAnalyticsBtn').disabled = false;
      }
    }
    async function saveProducts() {
      $('saveProductsBtn').disabled = true;
      showNotice('Сохраняю товары...', false);
      try {
        var data = await postJson('/api/admin/products', compactDirtyProductsForSave(), 120000);
        if (data.products) {
          products = data.products;
          if (!products.some(function(product) { return product.slug === selectedSlug; })) selectedSlug = products[0] ? products[0].slug : '';
          renderProductList();
          renderProductEditor();
        }
        savedProductsSnapshot = cloneProducts(products);
        markProductsClean();
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
        var data = await postJson('/api/admin/settings', { settings: settings }, 60000);
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
      await fetch('/api/admin/logout', { method: 'POST', credentials: 'same-origin' }).catch(function() {});
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
    $('reloadAnalyticsBtn').addEventListener('click', function() { loadAnalytics(0); });
    $('loadMoreEventsBtn').addEventListener('click', function() { loadAnalytics(analyticsPagination.nextOffset || analyticsEvents.length); });
    $('reloadChartsBtn').addEventListener('click', function() { loadAnalytics(0); });
    document.addEventListener('mouseover', function(event) {
      var bar = event.target.closest && event.target.closest('.week-bar[data-week-tip]');
      if (!bar) return;
      showFloatingWeekTip(event, bar.dataset.weekTip || '');
    });
    document.addEventListener('mousemove', function(event) {
      if (event.target.closest && event.target.closest('.week-bar[data-week-tip]')) moveFloatingWeekTip(event);
    });
    document.addEventListener('mouseout', function(event) {
      var bar = event.target.closest && event.target.closest('.week-bar[data-week-tip]');
      if (!bar || (event.relatedTarget && bar.contains(event.relatedTarget))) return;
      hideFloatingWeekTip();
    });
    $('resetAnalyticsBtn').addEventListener('click', resetAnalytics);
    $('logoutBtn').addEventListener('click', logout);
    $('addProductBtn').addEventListener('click', addProduct);
    $('saveProductsBtn').addEventListener('click', saveProducts);
    $('saveSettingsBtn').addEventListener('click', saveSettings);
    $('productList').addEventListener('click', function(event) {
      var button = event.target.closest('[data-action="select-product"]');
      if (button) selectProduct(button.dataset.slug || '');
    });
    $('productList').addEventListener('dragstart', handleProductDragStart);
    $('productList').addEventListener('dragover', handleProductDragOver);
    $('productList').addEventListener('dragleave', handleProductDragLeave);
    $('productList').addEventListener('drop', handleProductDrop);
    $('productList').addEventListener('dragend', handleDragEnd);
    $('productEditor').addEventListener('click', handleEditorClick);
    $('productEditor').addEventListener('input', handleEditorInput);
    $('productEditor').addEventListener('dragstart', handleOfferDragStart);
    $('productEditor').addEventListener('dragover', handleOfferDragOver);
    $('productEditor').addEventListener('dragleave', handleOfferDragLeave);
    $('productEditor').addEventListener('drop', handleOfferDrop);
    $('productEditor').addEventListener('dragend', handleDragEnd);
    document.addEventListener('dragover', updateDragAutoScroll);
    document.addEventListener('drop', handleDragEnd);
    document.addEventListener('wheel', handleDragWheel, { passive: true });
    $('imagePicker').addEventListener('change', handleImagePick);
    window.addEventListener('beforeunload', function(event) {
      if (!dirtyProducts) return;
      event.preventDefault();
      event.returnValue = '';
    });
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
