// ===== SMOOTH SCROLL =====
function smoothScrollTo(id) {
  var el = document.querySelector(id);
  if (!el) return;
  var y = el.getBoundingClientRect().top + window.pageYOffset - 68;
  window.scrollTo({ top: y, behavior: 'smooth' });
}

document.querySelectorAll('[data-scroll]').forEach(function(el) {
  el.addEventListener('click', function() { smoothScrollTo(el.dataset.scroll); });
});

document.querySelectorAll('a[href^="#"]').forEach(function(a) {
  a.addEventListener('click', function(e) {
    e.preventDefault();
    smoothScrollTo(a.getAttribute('href'));
  });
});

// ===== HEADER SHADOW ON SCROLL =====
var hdr = document.querySelector('.site-header');
window.addEventListener('scroll', function() {
  hdr.style.boxShadow = window.scrollY > 50 ? '0 2px 24px rgba(44,21,3,.1)' : '';
}, { passive: true });

// ===== SCROLL ANIMATIONS =====
var obs = new IntersectionObserver(function(entries) {
  entries.forEach(function(e) {
    if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.animate-on-scroll').forEach(function(el) { obs.observe(el); });

// ===== MENU FILTER =====
var fBtns = document.querySelectorAll('.f-btn');
var pCards = document.querySelectorAll('.prod-card');

fBtns.forEach(function(btn) {
  btn.addEventListener('click', function() {
    fBtns.forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    var cat = btn.dataset.filter;
    pCards.forEach(function(c) {
      if (cat === 'all' || c.dataset.cat === cat) {
        c.classList.remove('hidden');
        c.style.opacity = '0';
        c.style.transform = 'translateY(14px)';
        requestAnimationFrame(function() {
          requestAnimationFrame(function() {
            c.style.opacity = '1';
            c.style.transform = '';
          });
        });
      } else {
        c.classList.add('hidden');
      }
    });
  });
});

// ===== COUNT-UP ANIMATION =====
function countUp(el, raw, suffix, ms) {
  var start = performance.now();
  (function tick(now) {
    var p = Math.min((now - start) / ms, 1);
    var val = Math.floor(raw * (1 - Math.pow(1 - p, 4)));
    var fmt = val >= 1000 ? val.toLocaleString('fr-FR') : val;
    el.textContent = fmt + suffix;
    if (p < 1) requestAnimationFrame(tick);
  })(start);
}

var statsEl = document.querySelector('.stats-s');
if (statsEl) {
  new IntersectionObserver(function(entries) {
    if (!entries[0].isIntersecting) return;
    document.querySelectorAll('.stat-num[data-val]').forEach(function(el) {
      countUp(el, parseInt(el.dataset.val), el.dataset.sfx || '', 1800);
    });
  }, { threshold: 0.4 }).observe(statsEl);
}

// ===== MOBILE NAV ACTIVE STATE =====
var sections = document.querySelectorAll('section[id]');
var navBtns = document.querySelectorAll('.mob-nav-btn[data-scroll]');
if (sections.length && navBtns.length) {
  sections.forEach(function(s) {
    new IntersectionObserver(function(entries) {
      if (entries[0].isIntersecting) {
        var id = '#' + entries[0].target.id;
        navBtns.forEach(function(b) { b.classList.toggle('active', b.dataset.scroll === id); });
      }
    }, { threshold: 0.35 }).observe(s);
  });
}

// ===================================================
// ===== CART =====
// ===================================================
var cart = []; // [{name, price, qty}]

var cartDrawer  = document.getElementById('cartDrawer');
var cartOverlay = document.getElementById('cartOverlay');
var cartClose   = document.getElementById('cartClose');
var cartItemsEl = document.getElementById('cartItems');
var cartEmptyEl = document.getElementById('cartEmpty');
var cartFootEl  = document.getElementById('cartFoot');
var cartTotalEl = document.getElementById('cartTotal');
var cartFab     = document.getElementById('cartFab');
var cartBadge   = document.getElementById('cartBadge');

// Mode tabs
var tabUber = document.getElementById('tabUber');
var tabCC   = document.getElementById('tabCC');
var panelUber = document.getElementById('panelUber');
var panelCC   = document.getElementById('panelCC');

// CC form
var ccForm    = document.getElementById('ccForm');
var ccConfirm = document.getElementById('ccConfirm');
var ccSubmit  = document.getElementById('ccSubmit');
var ccNewOrder= document.getElementById('ccNewOrder');

function openCart() {
  cartDrawer.classList.add('open');
  cartOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  feather.replace();
}

function closeCart() {
  cartDrawer.classList.remove('open');
  cartOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

cartClose.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);
cartFab.addEventListener('click', openCart);

// Mode toggle
tabUber.addEventListener('click', function() {
  tabUber.classList.add('active'); tabCC.classList.remove('active');
  panelUber.style.display = ''; panelCC.style.display = 'none';
});
tabCC.addEventListener('click', function() {
  tabCC.classList.add('active'); tabUber.classList.remove('active');
  panelCC.style.display = ''; panelUber.style.display = 'none';
  feather.replace();
});

function formatPrice(n) {
  return n.toFixed(2).replace('.', ',') + ' €';
}

function renderCart() {
  // Total items
  var totalQty = cart.reduce(function(s, i) { return s + i.qty; }, 0);
  var totalPrice = cart.reduce(function(s, i) { return s + i.price * i.qty; }, 0);

  // Badge
  cartBadge.textContent = totalQty;
  cartFab.style.display = totalQty > 0 ? 'flex' : 'none';

  // Empty vs content
  cartEmptyEl.style.display = totalQty === 0 ? '' : 'none';
  cartItemsEl.style.display = totalQty === 0 ? 'none' : '';
  cartFootEl.style.display  = totalQty === 0 ? 'none' : '';

  cartTotalEl.textContent = formatPrice(totalPrice);

  // Render items
  cartItemsEl.innerHTML = '';
  cart.forEach(function(item, idx) {
    var div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML =
      '<span class="cart-item-name">' + item.name + '</span>' +
      '<div class="cart-item-qty">' +
        '<button class="qty-btn" data-idx="' + idx + '" data-action="dec">−</button>' +
        '<span class="qty-num">' + item.qty + '</span>' +
        '<button class="qty-btn" data-idx="' + idx + '" data-action="inc">+</button>' +
      '</div>' +
      '<span class="cart-item-price">' + formatPrice(item.price * item.qty) + '</span>';
    cartItemsEl.appendChild(div);
  });

  // Qty button listeners
  cartItemsEl.querySelectorAll('.qty-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var idx = parseInt(btn.dataset.idx);
      if (btn.dataset.action === 'inc') {
        cart[idx].qty++;
      } else {
        cart[idx].qty--;
        if (cart[idx].qty <= 0) cart.splice(idx, 1);
      }
      renderCart();
    });
  });
}

function addToCart(name, priceStr) {
  var price = parseFloat(priceStr.replace(',', '.'));
  var existing = cart.find(function(i) { return i.name === name; });
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ name: name, price: price, qty: 1 });
  }
  renderCart();
  openCart();
}

// Attach add buttons
document.querySelectorAll('.add-btn').forEach(function(btn) {
  btn.addEventListener('click', function(e) {
    e.stopPropagation();
    var card = btn.closest('.prod-card');
    var name  = card.querySelector('.prod-name').textContent.trim();
    var price = card.querySelector('.prod-price').textContent.trim().replace(' €', '').trim();
    addToCart(name, price);

    // Brief visual feedback on button
    btn.textContent = '✓';
    btn.style.background = '#22C55E';
    setTimeout(function() { btn.textContent = '+'; btn.style.background = ''; }, 900);
  });
});

// ===== CLICK & COLLECT SUBMIT =====
ccSubmit.addEventListener('click', function() {
  var name  = document.getElementById('ccName').value.trim();
  var phone = document.getElementById('ccPhone').value.trim();
  var slot  = document.getElementById('ccSlot').value;

  if (!name || !phone || !slot) {
    // Shake empty fields
    ['ccName','ccPhone','ccSlot'].forEach(function(id) {
      var el = document.getElementById(id);
      if (!el.value.trim()) {
        el.style.borderColor = '#EF4444';
        el.style.animation = 'none';
        setTimeout(function() {
          el.style.borderColor = '';
        }, 1500);
      }
    });
    return;
  }

  // Build order summary
  var lines = cart.map(function(i) { return i.qty + '× ' + i.name; }).join(', ');
  var total = cart.reduce(function(s, i) { return s + i.price * i.qty; }, 0);

  document.getElementById('ccConfirmMsg').innerHTML =
    '<strong>' + name + '</strong>, votre commande a bien été enregistrée !<br>' +
    '<span style="font-size:.78rem;opacity:.75;">' + lines + '</span><br><br>' +
    'Total : <strong style="color:var(--fuchsia)">' + formatPrice(total) + '</strong><br>' +
    'Créneau : <strong>' + slot + '</strong>';

  ccForm.style.display = 'none';
  ccConfirm.style.display = '';
  feather.replace();
});

// New order
ccNewOrder.addEventListener('click', function() {
  cart = [];
  renderCart();
  ccForm.style.display = '';
  ccConfirm.style.display = 'none';
  document.getElementById('ccName').value = '';
  document.getElementById('ccPhone').value = '';
  document.getElementById('ccSlot').value = '';
  // Switch back to uber tab
  tabUber.click();
  closeCart();
});

  // Mob cart btn
  var mobCartBtn   = document.getElementById('mobCartBtn');
  var mobCartBadge = document.getElementById('mobCartBadge');
  if (mobCartBtn) {
    mobCartBtn.addEventListener('click', openCart);
  }

  // Update mob badge alongside fab badge
  var _origRenderCart = renderCart;
  renderCart = function() {
    _origRenderCart();
    var totalQty = cart.reduce(function(s,i){ return s+i.qty; }, 0);
    if (mobCartBadge) {
      mobCartBadge.textContent = totalQty;
      mobCartBadge.style.display = totalQty > 0 ? 'flex' : 'none';
    }
  };

// ===== FEATHER ICONS =====
if (typeof feather !== 'undefined') feather.replace();
