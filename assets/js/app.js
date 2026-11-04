/* AURELO — shared storefront engine.
   One cart store (localStorage) shared by every page; page-specific
   initialisers run only when their elements exist, so this single file
   can be loaded site-wide. */
(function () {
  'use strict';
  var PRODUCTS = window.AURELO_PRODUCTS || [];
  var FREE_SHIP = 150, SHIP_COST = 9;
  var money = function (n) { return '$' + n.toFixed(2).replace(/\.00$/, ''); };
  var $ = function (id) { return document.getElementById(id); };
  var byId = function (id) { return PRODUCTS.find(function (p) { return p.id === id; }); };
  function icons() { if (window.lucide) window.lucide.createIcons(); }

  /* ---------- branded loader (first visit per session) ---------- */
  (function loader() {
    var el = $('loader'); if (!el) return;
    if (sessionStorage.getItem('aurelo_seen')) { el.remove(); return; }
    sessionStorage.setItem('aurelo_seen', '1');
    document.body.classList.add('is-loading');
    setTimeout(function () {
      el.classList.add('done'); document.body.classList.remove('is-loading');
      setTimeout(function () { el.remove(); }, 650);
    }, 1150);
  })();

  /* ---------- cart store ---------- */
  var KEY = 'aurelo_cart_v1', cart = [];
  try { cart = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { cart = []; }
  function save() { localStorage.setItem(KEY, JSON.stringify(cart)); renderBadges(); }
  function cartQty() { return cart.reduce(function (s, i) { return s + i.qty; }, 0); }
  function cartSubtotal() { return cart.reduce(function (s, i) { var p = byId(i.id); return p ? s + p.price * i.qty : s; }, 0); }
  function addToCart(id, size, color, qty) {
    var line = cart.find(function (i) { return i.id === id && i.size === size && i.color === color; });
    if (line) line.qty += qty; else cart.push({ id: id, size: size, color: color, qty: qty });
    save(); renderDrawer(); pulseBadges();
  }
  function setLine(idx, qty) {
    if (qty <= 0) cart.splice(idx, 1); else cart[idx].qty = qty;
    save(); renderDrawer(); if ($('cartPageItems')) renderCartPage();
  }
  function renderBadges() {
    document.querySelectorAll('[data-cart-count]').forEach(function (b) { b.textContent = cartQty(); });
  }
  function pulseBadges() {
    document.querySelectorAll('[data-cart-count]').forEach(function (b) {
      b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
    });
  }

  /* ---------- toast ---------- */
  var toastTimer;
  function toast(msg) {
    var t = $('toast'); if (!t) return;
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, 2600);
  }

  /* ---------- cart drawer ---------- */
  function openDrawer() {
    renderDrawer();
    var d = $('cartDrawer'), b = $('drawerBackdrop');
    if (d) { d.classList.add('open'); d.setAttribute('aria-hidden', 'false'); }
    if (b) b.hidden = false;
  }
  function closeDrawer() {
    var d = $('cartDrawer'), b = $('drawerBackdrop');
    if (d) { d.classList.remove('open'); d.setAttribute('aria-hidden', 'true'); }
    if (b) b.hidden = true;
  }
  function renderDrawer() {
    var zone = $('drawerItems'); if (!zone) return;
    var empty = $('drawerEmpty'), foot = $('drawerFoot');
    if (!cart.length) {
      zone.innerHTML = ''; if (empty) empty.hidden = false; if (foot) foot.hidden = true; icons(); return;
    }
    if (empty) empty.hidden = true; if (foot) foot.hidden = false;
    zone.innerHTML = cart.map(function (i, idx) {
      var p = byId(i.id); if (!p) return '';
      return '<div class="drawer-line">' +
        '<img src="' + p.images[0] + '" alt="' + p.name + '">' +
        '<div class="drawer-line-info"><strong>' + p.name + '</strong>' +
        '<small>' + i.color + ' · Size ' + i.size + '</small>' +
        '<div class="mini-stepper"><button type="button" data-line="' + idx + '" data-d="-1" aria-label="Decrease quantity">−</button><span>' + i.qty + '</span><button type="button" data-line="' + idx + '" data-d="1" aria-label="Increase quantity">+</button></div></div>' +
        '<div class="drawer-line-price">' + money(p.price * i.qty) + '</div></div>';
    }).join('');
    var sub = $('drawerSubtotal'); if (sub) sub.textContent = money(cartSubtotal());
    zone.querySelectorAll('[data-line]').forEach(function (btn) {
      btn.addEventListener('click', function () { setLine(+btn.dataset.line, cart[+btn.dataset.line].qty + (+btn.dataset.d)); });
    });
    icons();
  }

  /* ---------- header: nav, search suggestions ---------- */
  (function header() {
    var toggle = $('navToggle'), nav = $('mobileNav');
    if (toggle && nav) toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open);
    });
    var openBtns = document.querySelectorAll('[data-open-cart]');
    openBtns.forEach(function (b) { b.addEventListener('click', openDrawer); });
    var closeBtn = $('drawerClose'); if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    var bd = $('drawerBackdrop'); if (bd) bd.addEventListener('click', closeDrawer);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeDrawer(); closeModal(); } });

    var mSearch = $('mobileSearch');
    if (mSearch) mSearch.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); window.location.href = 'shop.html?q=' + encodeURIComponent(mSearch.value.trim()); }
    });
    var input = $('siteSearch'), box = $('searchSuggest');
    if (input && box) {
      input.addEventListener('input', function () {
        var q = input.value.trim().toLowerCase();
        if (q.length < 2) { box.hidden = true; return; }
        var hits = PRODUCTS.filter(function (p) {
          return (p.name + ' ' + p.category + ' ' + p.colors.join(' ')).toLowerCase().indexOf(q) > -1;
        }).slice(0, 6);
        box.innerHTML = hits.length ? hits.map(function (p) {
          return '<a class="suggest-item" href="product.html?id=' + p.id + '"><img src="' + p.images[0] + '" alt=""><span><strong>' + p.name + '</strong><small>' + p.category + '</small></span><span class="suggest-price">' + money(p.price) + '</span></a>';
        }).join('') : '<p class="suggest-none">No matches for “' + input.value.trim() + '”. Try “knit” or “trench”.</p>';
        box.hidden = false;
      });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); window.location.href = 'shop.html?q=' + encodeURIComponent(input.value.trim()); }
      });
      document.addEventListener('click', function (e) { if (!e.target.closest('.search-wrap')) box.hidden = true; });
    }
  })();

  /* ---------- promotional countdown (to Sunday midnight) ---------- */
  (function countdown() {
    var els = document.querySelectorAll('[data-countdown]'); if (!els.length) return;
    function target() {
      var d = new Date(); d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7)); d.setHours(23, 59, 59, 999); return d;
    }
    var end = target();
    function tick() {
      var ms = Math.max(0, end - new Date());
      var dd = Math.floor(ms / 864e5), hh = Math.floor(ms / 36e5) % 24, mm = Math.floor(ms / 6e4) % 60, ss = Math.floor(ms / 1e3) % 60;
      var txt = dd + 'd : ' + String(hh).padStart(2, '0') + 'h : ' + String(mm).padStart(2, '0') + 'm : ' + String(ss).padStart(2, '0') + 's';
      els.forEach(function (e) { e.textContent = txt; });
    }
    tick(); setInterval(tick, 1000);
  })();

  /* ---------- scroll reveal ---------- */
  (function reveal() {
    var items = document.querySelectorAll('.reveal'); if (!items.length) return;
    if (!('IntersectionObserver' in window)) { items.forEach(function (i) { i.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    items.forEach(function (i) { io.observe(i); });
  })();

  /* ---------- product card (shared renderer) ---------- */
  function stars(r) {
    var full = Math.round(r);
    return '<span class="stars" aria-label="Rated ' + r + ' out of 5">' + '★'.repeat(full) + '<span class="stars-off">' + '★'.repeat(5 - full) + '</span></span>';
  }
  function cardHTML(p) {
    return '<article class="card reveal in">' +
      '<a class="card-media" href="product.html?id=' + p.id + '"><img src="' + p.images[0] + '" alt="' + p.name + ' — flat garment illustration" loading="lazy">' +
      (p.badge ? '<span class="card-badge">' + p.badge + '</span>' : '') + '</a>' +
      '<div class="card-body"><p class="card-cat">' + p.category + '</p>' +
      '<h3><a href="product.html?id=' + p.id + '">' + p.name + '</a></h3>' +
      '<p class="card-meta">' + stars(p.rating) + ' <span>(' + p.reviews + ')</span></p>' +
      '<p class="card-price">' + money(p.price) + (p.compareAt ? ' <s>' + money(p.compareAt) + '</s>' : '') + '</p></div></article>';
  }

  /* ---------- home ---------- */
  (function home() {
    var grid = $('featuredGrid');
    if (grid) grid.innerHTML = PRODUCTS.filter(function (p) { return p.featured; }).map(cardHTML).join('');
    var spot = byId('sculpted-wool-trench');
    var dist = $('spotDist');
    if (dist && spot) {
      dist.innerHTML = [5, 4, 3, 2, 1].map(function (s) {
        var pct = window.AURELO_RATING_DIST[s] || 0;
        return '<div class="dist-row"><span>' + s + ' ★</span><span class="dist-bar"><span style="width:' + pct + '%"></span></span><span>' + pct + '%</span></div>';
      }).join('');
    }
    icons();
  })();

  /* ---------- shop ---------- */
  (function shop() {
    var grid = $('shopGrid'); if (!grid) return;
    var params = new URLSearchParams(location.search);
    var state = { cat: params.get('cat') || 'All', q: (params.get('q') || '').toLowerCase(), sort: 'featured', max: 300 };
    var cats = ['All'].concat(PRODUCTS.map(function (p) { return p.category; }).filter(function (v, i, a) { return a.indexOf(v) === i; }));
    var chips = $('catChips');
    chips.innerHTML = cats.map(function (c) {
      return '<button type="button" class="chip' + (c === state.cat ? ' active' : '') + '" data-cat="' + c + '">' + c + '</button>';
    }).join('');
    chips.querySelectorAll('[data-cat]').forEach(function (b) {
      b.addEventListener('click', function () {
        state.cat = b.dataset.cat;
        chips.querySelectorAll('.chip').forEach(function (x) { x.classList.toggle('active', x === b); });
        draw();
      });
    });
    var search = $('shopSearch'); if (search) { search.value = params.get('q') || ''; search.addEventListener('input', function () { state.q = search.value.toLowerCase(); draw(); }); }
    var sort = $('sortSel'); if (sort) sort.addEventListener('change', function () { state.sort = sort.value; draw(); });
    var range = $('priceRange'), rangeVal = $('priceVal');
    if (range) range.addEventListener('input', function () { state.max = +range.value; if (rangeVal) rangeVal.textContent = money(state.max); draw(); });
    function draw() {
      var list = PRODUCTS.filter(function (p) {
        return (state.cat === 'All' || p.category === state.cat) && p.price <= state.max &&
          (!state.q || (p.name + ' ' + p.category + ' ' + p.colors.join(' ')).toLowerCase().indexOf(state.q) > -1);
      });
      if (state.sort === 'low') list.sort(function (a, b) { return a.price - b.price; });
      if (state.sort === 'high') list.sort(function (a, b) { return b.price - a.price; });
      if (state.sort === 'rating') list.sort(function (a, b) { return b.rating - a.rating; });
      grid.innerHTML = list.map(cardHTML).join('');
      var empty = $('shopEmpty'); if (empty) empty.hidden = list.length > 0;
      var count = $('shopCount'); if (count) count.textContent = list.length + (list.length === 1 ? ' piece' : ' pieces');
      icons();
    }
    draw();
  })();

  /* ---------- size guide modal ---------- */
  function closeModal() {
    var m = $('sizeModal'), b = $('modalBackdrop');
    if (m) m.hidden = true; if (b) b.hidden = true;
  }
  (function modal() {
    var open = $('sizeGuideOpen'), m = $('sizeModal'), b = $('modalBackdrop'), c = $('sizeModalClose');
    if (open && m) open.addEventListener('click', function () { m.hidden = false; if (b) b.hidden = false; });
    if (c) c.addEventListener('click', closeModal);
    if (b) b.addEventListener('click', closeModal);
  })();

  /* ---------- product page ---------- */
  (function productPage() {
    var root = $('productRoot'); if (!root) return;
    var params = new URLSearchParams(location.search);
    var p = byId(params.get('id')) || PRODUCTS[0];
    document.title = p.name + ' — AURELO';
    $('pCat').textContent = p.category; $('pName').textContent = p.name;
    $('pBlurb').textContent = p.blurb; $('pDesc').textContent = p.description;
    $('pPrice').innerHTML = money(p.price) + (p.compareAt ? ' <s>' + money(p.compareAt) + '</s>' : '');
    $('pRating').innerHTML = stars(p.rating) + ' <span>' + p.rating + ' · ' + p.reviews + ' reviews</span>';
    var ra = $('ratingAvg'); if (ra) ra.textContent = p.rating;
    $('pDetails').innerHTML = p.details.map(function (d) { return '<li>' + d + '</li>'; }).join('');

    var main = $('pMainImg'), thumbs = $('pThumbs');
    main.src = p.images[0]; main.alt = p.name + ' — front view illustration';
    thumbs.innerHTML = p.images.map(function (src, i) {
      return '<button type="button" class="thumb' + (i === 0 ? ' active' : '') + '" data-src="' + src + '" aria-label="View ' + (i + 1) + '"><img src="' + src + '" alt=""></button>';
    }).join('');
    thumbs.querySelectorAll('.thumb').forEach(function (t) {
      t.addEventListener('click', function () {
        main.src = t.dataset.src;
        thumbs.querySelectorAll('.thumb').forEach(function (x) { x.classList.toggle('active', x === t); });
      });
    });

    var sel = { color: p.colors[0], size: null, qty: 1 };
    var colorName = $('pColorName'); if (colorName) colorName.textContent = sel.color;
    var colorZone = $('pColors');
    colorZone.innerHTML = p.colors.map(function (c, i) {
      return '<button type="button" class="swatch' + (i === 0 ? ' active' : '') + '" data-color="' + c + '">' + c + '</button>';
    }).join('');
    colorZone.querySelectorAll('[data-color]').forEach(function (b) {
      b.addEventListener('click', function () {
        sel.color = b.dataset.color;
        if (colorName) colorName.textContent = sel.color;
        colorZone.querySelectorAll('.swatch').forEach(function (x) { x.classList.toggle('active', x === b); });
      });
    });
    var sizeZone = $('pSizes');
    sizeZone.innerHTML = p.sizes.map(function (s) {
      return '<button type="button" class="size-btn" data-size="' + s + '">' + s + '</button>';
    }).join('');
    sizeZone.querySelectorAll('[data-size]').forEach(function (b) {
      b.addEventListener('click', function () {
        sel.size = b.dataset.size;
        sizeZone.querySelectorAll('.size-btn').forEach(function (x) { x.classList.toggle('active', x === b); });
        var err = $('sizeErr'); if (err) err.hidden = true;
      });
    });
    var qtyEl = $('pQty');
    $('pMinus').addEventListener('click', function () { sel.qty = Math.max(1, sel.qty - 1); qtyEl.textContent = sel.qty; });
    $('pPlus').addEventListener('click', function () { sel.qty = Math.min(9, sel.qty + 1); qtyEl.textContent = sel.qty; });
    $('pAdd').addEventListener('click', function () {
      if (!sel.size) {
        var err = $('sizeErr'); if (err) err.hidden = false;
        sizeZone.scrollIntoView({ behavior: 'smooth', block: 'center' }); return;
      }
      addToCart(p.id, sel.size, sel.color, sel.qty);
      toast(p.name + ' (' + sel.size + ') added to your bag.');
      openDrawer();
    });

    document.querySelectorAll('.tab-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        document.querySelectorAll('.tab-btn').forEach(function (x) { x.classList.toggle('active', x === b); });
        document.querySelectorAll('.tab-panel').forEach(function (x) { x.hidden = x.id !== b.dataset.tab; });
      });
    });

    /* interactive rating summary: click a row to filter reviews */
    var reviews = window.AURELO_REVIEWS[p.id] || [
      { stars: 5, author: 'Jordan M.', title: 'Exactly as described', text: 'Fabric, fit and finish all match the page. This is how product pages should read.' },
      { stars: 5, author: 'Sana K.', title: 'Quality you can feel', text: 'Arrived in three days, beautifully packed without plastic. Already ordered a second colour.' },
      { stars: 4, author: 'Tom W.', title: 'Very good, size up if between', text: 'Runs a touch slim through the shoulder. Support exchanged mine in two days, no fuss.' }
    ];
    var distEl = $('ratingDist'), listEl = $('reviewList');
    function drawReviews(filter) {
      var list = filter ? reviews.filter(function (r) { return r.stars === filter; }) : reviews;
      listEl.innerHTML = list.length ? list.map(function (r) {
        return '<article class="review"><p>' + stars(r.stars) + '</p><h4>' + r.title + '</h4><p>' + r.text + '</p><small>— ' + r.author + ', verified buyer</small></article>';
      }).join('') : '<p class="muted">No written reviews at this rating yet.</p>';
      icons();
    }
    if (distEl) {
      distEl.innerHTML = [5, 4, 3, 2, 1].map(function (s) {
        var pct = window.AURELO_RATING_DIST[s] || 0;
        return '<button type="button" class="dist-row as-btn" data-stars="' + s + '" aria-label="Show ' + s + '-star reviews"><span>' + s + ' ★</span><span class="dist-bar"><span style="width:' + pct + '%"></span></span><span>' + pct + '%</span></button>';
      }).join('') + '<button type="button" class="link-btn" id="distReset">Show all reviews</button>';
      distEl.querySelectorAll('[data-stars]').forEach(function (b) {
        b.addEventListener('click', function () { drawReviews(+b.dataset.stars); });
      });
      var reset = $('distReset'); if (reset) reset.addEventListener('click', function () { drawReviews(0); });
    }
    drawReviews(0);

    var rel = $('relatedGrid');
    if (rel) rel.innerHTML = PRODUCTS.filter(function (x) { return x.id !== p.id && x.category === p.category; })
      .concat(PRODUCTS.filter(function (x) { return x.id !== p.id && x.category !== p.category; }))
      .slice(0, 4).map(cardHTML).join('');
    icons();
  })();

  /* ---------- cart page ---------- */
  function renderCartPage() {
    var zone = $('cartPageItems'); if (!zone) return;
    var empty = $('cartEmpty'), wrap = $('cartWrap');
    if (!cart.length) {
      zone.innerHTML = ''; if (empty) empty.hidden = false; if (wrap) wrap.hidden = true; return;
    }
    if (empty) empty.hidden = true; if (wrap) wrap.hidden = false;
    zone.innerHTML = cart.map(function (i, idx) {
      var p = byId(i.id); if (!p) return '';
      return '<div class="cart-row"><img src="' + p.images[0] + '" alt="' + p.name + '">' +
        '<div class="cart-row-info"><h3><a href="product.html?id=' + p.id + '">' + p.name + '</a></h3><p class="muted">' + i.color + ' · Size ' + i.size + '</p>' +
        '<button type="button" class="link-btn danger" data-remove="' + idx + '">Remove</button></div>' +
        '<div class="mini-stepper big"><button type="button" data-cline="' + idx + '" data-d="-1" aria-label="Decrease quantity">−</button><span>' + i.qty + '</span><button type="button" data-cline="' + idx + '" data-d="1" aria-label="Increase quantity">+</button></div>' +
        '<div class="cart-row-price">' + money(p.price * i.qty) + '</div></div>';
    }).join('');
    zone.querySelectorAll('[data-cline]').forEach(function (b) {
      b.addEventListener('click', function () { setLine(+b.dataset.cline, cart[+b.dataset.cline].qty + (+b.dataset.d)); });
    });
    zone.querySelectorAll('[data-remove]').forEach(function (b) {
      b.addEventListener('click', function () { setLine(+b.dataset.remove, 0); toast('Removed from your bag.'); });
    });
    var sub = cartSubtotal(), ship = sub >= FREE_SHIP || sub === 0 ? 0 : SHIP_COST;
    $('sumSubtotal').textContent = money(sub);
    $('sumShipping').textContent = ship === 0 ? 'Free' : money(ship);
    $('sumTotal').textContent = money(sub + ship);
    var pct = Math.min(100, Math.round(sub / FREE_SHIP * 100));
    var bar = $('shipBar'); if (bar) bar.style.width = pct + '%';
    var note = $('shipNote');
    if (note) note.textContent = sub >= FREE_SHIP ? 'Your order ships free.' : 'Add ' + money(FREE_SHIP - sub) + ' more for free shipping.';
    icons();
  }
  if ($('cartPageItems')) renderCartPage();

  /* ---------- checkout page ---------- */
  (function checkout() {
    var list = $('coItems'); if (!list) return;
    if (!cart.length) { list.innerHTML = '<p class="muted">Your bag is empty.</p>'; }
    else {
      list.innerHTML = cart.map(function (i) {
        var p = byId(i.id); if (!p) return '';
        return '<div class="co-line"><img src="' + p.images[0] + '" alt=""><span>' + p.name + ' <small>× ' + i.qty + ' · ' + i.size + '</small></span><strong>' + money(p.price * i.qty) + '</strong></div>';
      }).join('');
    }
    var sub = cartSubtotal(), ship = sub >= FREE_SHIP || sub === 0 ? 0 : SHIP_COST;
    $('coSubtotal').textContent = money(sub);
    $('coShipping').textContent = ship === 0 ? 'Free' : money(ship);
    $('coTotal').textContent = money(sub + ship);
    var form = $('checkoutForm');
    if (form) form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!cart.length) { toast('Your bag is empty.'); return; }
      var num = 'AUR-' + Math.floor(100000 + Math.random() * 900000);
      cart = []; save(); renderDrawer();
      $('checkoutMain').hidden = true;
      var done = $('orderDone'); if (done) { done.hidden = false; $('orderNum').textContent = num; }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    icons();
  })();

  /* ---------- newsletter ---------- */
  document.querySelectorAll('.newsletter-form').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = f.querySelector('input[type="email"]');
      var ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim());
      var msg = f.querySelector('.nl-msg');
      if (!ok) { if (msg) { msg.textContent = 'Please enter a valid email address.'; msg.className = 'nl-msg err'; } input.focus(); return; }
      if (msg) { msg.textContent = 'Welcome to The Considered List — your first letter arrives this Sunday.'; msg.className = 'nl-msg ok'; }
      input.value = '';
    });
  });

  var year = $('year'); if (year) year.textContent = new Date().getFullYear();
  renderBadges(); renderDrawer(); icons();
})();
