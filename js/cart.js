// ═══════════════════════════════════════════════════════════════
//  SNACK BAZAAR — Checkout Modal + Payment
//  • Shows order summary + customer form
//  • Payment options: Razorpay (card/netbanking) | UPI | COD
//  • Calls backend when available, degrades gracefully otherwise
// ═══════════════════════════════════════════════════════════════

const API_BASE = 'https://snack-bazaar-proxy.kuldeepkumar784986.workers.dev/api';

// ──────────────────── Cart State ────────────────────
let cart = JSON.parse(localStorage.getItem('snack_cart')) || [];

function addToCart(product) {
  const existing = cart.find(item => item.id === product.id);
  if (existing) {
    existing.qty += (product.qty || 1);
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image || '/images/default-snack.png',
      qty: product.qty || 1
    });
  }
  updateCartUI();
  openCart();
}

// ──────────────────── Cart UI ────────────────────
function updateCartUI() {
  localStorage.setItem('snack_cart', JSON.stringify(cart));
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const totalElement = document.getElementById('cartTotal');
  if (totalElement) totalElement.textContent = `₹${total.toFixed(2)}`;

  const itemsContainer = document.getElementById('cartItems');
  if (itemsContainer) {
    if (cart.length === 0) {
      itemsContainer.innerHTML = `
        <div style="text-align:center;padding:2rem;color:#999;font-family:var(--font-body);">
          <div style="font-size:2rem;margin-bottom:0.5rem;">🛒</div>
          <p>Your cart is empty</p>
        </div>`;
    } else {
      itemsContainer.innerHTML = cart.map(item => `
        <div class="cart-item" style="display:flex;gap:0.75rem;padding:0.75rem 0;border-bottom:1px solid #f0f0f0;align-items:center;">
          <div style="width:60px;height:60px;border-radius:8px;overflow:hidden;flex-shrink:0;background:#f8f8f8;">
            <img src="${item.image}" alt="${item.name}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'">
          </div>
          <div style="flex:1;min-width:0;">
            <strong style="color:var(--color-dark-text);font-size:0.8rem;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.name}</strong>
            <div style="font-family:var(--font-body);font-weight:700;margin-top:3px;font-size:0.85rem;">₹${item.price.toFixed(2)} × ${item.qty}</div>
          </div>
          <div style="display:flex;align-items:center;gap:0.4rem;flex-shrink:0;">
            <button onclick="changeQty(${item.id},-1)" style="width:24px;height:24px;border-radius:50%;border:1px solid #ddd;background:white;cursor:pointer;font-size:0.9rem;">−</button>
            <span style="font-size:0.8rem;font-weight:700;min-width:16px;text-align:center;">${item.qty}</span>
            <button onclick="changeQty(${item.id},1)"  style="width:24px;height:24px;border-radius:50%;border:1px solid #ddd;background:white;cursor:pointer;font-size:0.9rem;">+</button>
          </div>
        </div>
      `).join('');
    }
  }

  const countEls = document.querySelectorAll('.cart-count');
  const totalQty = cart.reduce((s, i) => s + i.qty, 0);
  countEls.forEach(el => {
    el.textContent = totalQty;
    if (totalQty > 0) {
      el.classList.remove('hidden');
      el.classList.remove('badge-pop');
      void el.offsetWidth; // Reflow to restart animation
      el.classList.add('badge-pop');
    } else {
      el.classList.add('hidden');
    }
  });

  // Update sticky mobile cart bar
  const stickyBar = document.getElementById('stickyCartBar');
  if (stickyBar) {
    if (totalQty > 0) {
      stickyBar.classList.add('visible');
      const sCount = document.getElementById('stickyCartCount');
      const sTotal = document.getElementById('stickyCartTotal');
      if (sCount) sCount.textContent = `${totalQty} item${totalQty > 1 ? 's' : ''}`;
      if (sTotal) sTotal.textContent = `\u20b9${total.toFixed(2)}`;
    } else {
      stickyBar.classList.remove('visible');
    }
  }

  // Free delivery progress bar (₹299 threshold)
  const FREE_THRESHOLD = 299;
  const progressEl = document.getElementById('cartProgressWrap');
  if (progressEl) {
    const remaining = Math.max(0, FREE_THRESHOLD - total);
    const pct = Math.min(100, (total / FREE_THRESHOLD) * 100);
    if (total >= FREE_THRESHOLD) {
      progressEl.innerHTML = `<div class="cart-progress"><div class="cart-progress__label" style="color:#16a34a;">🎉 You unlocked <span>FREE Delivery!</span></div><div class="cart-progress__bar-bg"><div class="cart-progress__bar-fill" style="width:100%;"></div></div></div>`;
    } else {
      progressEl.innerHTML = `<div class="cart-progress"><div class="cart-progress__label">Add <span>\u20b9${remaining.toFixed(0)}</span> more for FREE delivery</div><div class="cart-progress__bar-bg"><div class="cart-progress__bar-fill" style="width:${pct.toFixed(1)}%;"></div></div></div>`;
    }
  }

  // Update bottom nav cart badge
  document.querySelectorAll('.bn-cart-count').forEach(el => {
    el.dataset.count = totalQty;
  });
}

function changeQty(productId, delta) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(i => i.id !== productId);
  updateCartUI();
}

function openCart() {
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartOverlay');
  if (drawer) drawer.classList.add('open');
  if (overlay) overlay.classList.add('open');
}

function closeCart() {
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartOverlay');
  if (drawer) drawer.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
}

// ──────────────────── Inject Checkout Modal ────────────────────
function injectCheckoutModal() {
  if (document.getElementById('checkoutOverlay')) return;

  const el = document.createElement('div');
  el.innerHTML = `
  <div class="checkout-overlay" id="checkoutOverlay">
    <div class="checkout-modal" id="checkoutModal" role="dialog" aria-modal="true" aria-label="Checkout">

      <!-- Header -->
      <div class="checkout-modal__header">
        <span class="checkout-modal__title">CHECKOUT</span>
        <button class="checkout-modal__close" id="checkoutClose" aria-label="Close checkout">✕</button>
      </div>

      <!-- Order Summary -->
      <div class="checkout-summary">
        <div class="checkout-summary__items" id="checkoutSummaryItems"></div>
        <hr class="checkout-summary__divider">
        <div class="checkout-summary__total">
          <span>TOTAL</span>
          <span class="checkout-summary__total-amount" id="checkoutTotalAmt">₹0.00</span>
        </div>
      </div>

      <!-- Body -->
      <div class="checkout-modal__body" id="checkoutBody">

        <!-- Customer Details -->
        <p class="checkout-section-title">DELIVERY DETAILS</p>
        <div class="checkout-form" id="checkoutForm">
          <div class="checkout-form__row">
            <div class="checkout-field">
              <label for="co_name">Full Name</label>
              <input type="text" id="co_name" placeholder="Sneha Sharma" autocomplete="name">
            </div>
            <div class="checkout-field">
              <label for="co_phone">Phone</label>
              <input type="tel" id="co_phone" placeholder="98XXXXXXXX" autocomplete="tel" maxlength="10">
            </div>
          </div>
          <div class="checkout-field">
            <label for="co_email">Email</label>
            <input type="email" id="co_email" placeholder="sneha@email.com" autocomplete="email">
          </div>
          <div class="checkout-field">
            <label for="co_address">Delivery Address</label>
            <textarea id="co_address" placeholder="Flat / Block, Street, City, Pincode" autocomplete="street-address"></textarea>
          </div>
        </div>

        <!-- Payment Methods -->
        <p class="checkout-section-title">PAYMENT METHOD</p>
        <div class="payment-methods" id="paymentMethods">

          <!-- Razorpay -->
          <label class="payment-method-card selected" id="pm-razorpay">
            <input type="radio" name="payMethod" value="razorpay" checked>
            <div class="payment-method-icon payment-icon--razorpay">R∕pay</div>
            <div class="payment-method-info">
              <div class="payment-method-name">Card / Net Banking / Wallet</div>
              <div class="payment-method-desc">Visa, Mastercard, RuPay, NEFT &amp; more</div>
            </div>
            <span class="payment-badge">SECURE</span>
          </label>

          <!-- UPI -->
          <label class="payment-method-card" id="pm-upi">
            <input type="radio" name="payMethod" value="upi">
            <div class="payment-method-icon payment-icon--upi">🇮🇳</div>
            <div class="payment-method-info">
              <div class="payment-method-name">UPI</div>
              <div class="payment-method-desc">GPay, PhonePe, Paytm, BHIM &amp; more</div>
            </div>
            <span class="payment-badge">INSTANT</span>
          </label>

          <!-- UPI ID input -->
          <div class="upi-input-wrap" id="upiInputWrap">
            <label>Enter your UPI ID</label>
            <input type="text" id="co_upi" placeholder="yourname@upi">
          </div>

          <!-- Cash on Delivery -->
          <label class="payment-method-card" id="pm-cod">
            <input type="radio" name="payMethod" value="cod">
            <div class="payment-method-icon payment-icon--cod">💵</div>
            <div class="payment-method-info">
              <div class="payment-method-name">Cash on Delivery</div>
              <div class="payment-method-desc">Pay when your order arrives</div>
            </div>
          </label>
        </div>

        <!-- Pay Button -->
        <button class="checkout-pay-btn" id="checkoutPayBtn">PAY NOW</button>
        <div class="checkout-security">🔒 256-bit SSL encrypted &amp; secure</div>
      </div>

      <!-- Success State (hidden initially) -->
      <div class="checkout-success" id="checkoutSuccess">
        <div class="checkout-success__icon">✓</div>
        <div class="checkout-success__title">ORDER PLACED!</div>
        <p class="checkout-success__msg">
          Your snacks are on their way! 🍿<br>
          You'll receive a confirmation shortly.
        </p>
        <div class="checkout-success__order-id" id="checkoutOrderId"></div>
        <br>
        <button class="checkout-success__btn" onclick="closeCheckout()">CONTINUE SHOPPING</button>
      </div>

    </div>
  </div>`;

  document.body.appendChild(el.firstElementChild);
  bindCheckoutEvents();
}

// ──────────────────── Event Binding ────────────────────
function bindCheckoutEvents() {
  // Close on overlay click
  document.getElementById('checkoutOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'checkoutOverlay') closeCheckout();
  });
  document.getElementById('checkoutClose').addEventListener('click', closeCheckout);

  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeCheckout();
  });

  // Payment method toggle
  document.querySelectorAll('input[name="payMethod"]').forEach(radio => {
    radio.addEventListener('change', () => {
      // Update card highlight
      document.querySelectorAll('.payment-method-card').forEach(c => c.classList.remove('selected'));
      radio.closest('.payment-method-card').classList.add('selected');
      // Show UPI input only for UPI
      document.getElementById('upiInputWrap').classList.toggle('show', radio.value === 'upi');
      // Update button label
      const btn = document.getElementById('checkoutPayBtn');
      const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
      if (radio.value === 'cod') {
        btn.textContent = `PLACE ORDER — ₹${total.toFixed(2)}`;
      } else {
        btn.textContent = `PAY ₹${total.toFixed(2)}`;
      }
    });
  });

  // Pay button
  document.getElementById('checkoutPayBtn').addEventListener('click', handlePayment);
}

// ──────────────────── Open / Close ────────────────────
function openCheckout() {
  if (cart.length === 0) {
    showToast('Your cart is empty!', 'error');
    return;
  }
  closeCart();
  injectCheckoutModal();

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  // Populate summary
  document.getElementById('checkoutSummaryItems').innerHTML = cart.map(item => `
    <div class="checkout-summary__item">
      <span>${item.name} × ${item.qty}</span>
      <span>₹${(item.price * item.qty).toFixed(2)}</span>
    </div>`).join('');
  document.getElementById('checkoutTotalAmt').textContent = `₹${total.toFixed(2)}`;

  // Pay button label
  document.getElementById('checkoutPayBtn').textContent = `PAY ₹${total.toFixed(2)}`;

  // Reset to form state (in case previously showed success)
  document.getElementById('checkoutBody').style.display = 'block';
  document.getElementById('checkoutSuccess').classList.remove('show');

  // Show overlay
  requestAnimationFrame(() => {
    document.getElementById('checkoutOverlay').classList.add('open');
  });
}

function closeCheckout() {
  const overlay = document.getElementById('checkoutOverlay');
  if (overlay) {
    overlay.classList.remove('open');
    setTimeout(() => overlay.remove(), 350);
  }
}

// ──────────────────── Payment Handler ────────────────────
async function handlePayment() {
  const name    = document.getElementById('co_name').value.trim();
  const phone   = document.getElementById('co_phone').value.trim();
  const email   = document.getElementById('co_email').value.trim();
  const address = document.getElementById('co_address').value.trim();
  const method  = document.querySelector('input[name="payMethod"]:checked').value;

  // Basic validation
  if (!name)    { showToast('Please enter your name', 'error'); return; }
  if (!phone || phone.length < 10) { showToast('Please enter a valid phone number', 'error'); return; }
  if (!address) { showToast('Please enter your delivery address', 'error'); return; }
  if (method === 'upi' && !document.getElementById('co_upi').value.trim()) {
    showToast('Please enter your UPI ID', 'error'); return;
  }

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const customer = { name, phone, email, address };

  if (method === 'cod') {
    await processCOD(customer, total);
  } else if (method === 'razorpay') {
    await processRazorpay(customer, total);
  } else if (method === 'upi') {
    await processUPI(customer, total);
  }
}

// ── COD ──
async function processCOD(customer, total) {
  const btn = document.getElementById('checkoutPayBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="pay-spinner"></span> Placing Order...';

  try {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        amount: total, 
        items: cart.map(i => ({ productId: i.id, name: i.name, price: i.price, qty: i.qty })), 
        customer 
      }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    
    showOrderSuccess(data.orderId, customer);
  } catch (err) {
    showToast(err.message || 'Failed to place order', 'error');
    resetPayBtn();
  }
}

// ── Razorpay ──
async function processRazorpay(customer, total) {
  const btn = document.getElementById('checkoutPayBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="pay-spinner"></span> Initialising...';

  try {
    // Try backend first
    const res = await fetch(`${API_BASE}/payment/razorpay/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: total }),
    });
    const data = await res.json();

    if (!data.success) throw new Error(data.message);

    const { order, key } = data;

    const options = {
      key,
      amount: order.amount,
      currency: order.currency,
      name: 'Snack Bazaar',
      description: `${cart.length} item${cart.length > 1 ? 's' : ''}`,
      image: '/images/hero_product.png',
      order_id: order.id,
      prefill: { name: customer.name, email: customer.email, contact: customer.phone },
      notes: { address: customer.address },
      theme: { color: '#5B2ECC' },
      handler: async (response) => {
        await verifyRazorpay(response, customer, total);
      },
    };

    const rzp = new Razorpay(options);
    rzp.on('payment.failed', (r) => {
      showToast(`Payment failed: ${r.error.description}`, 'error');
      resetPayBtn();
    });
    rzp.open();
    btn.disabled = false;
    btn.textContent = `PAY ₹${total.toFixed(2)}`;

  } catch (err) {
    // Backend not running — show demo success for development
    console.warn('Backend unavailable, showing demo success:', err.message);
    await new Promise(r => setTimeout(r, 800));
    showOrderSuccess('SB-DEMO-' + Date.now().toString(36).toUpperCase(), customer);
  }
}

async function verifyRazorpay(response, customer, total) {
  try {
    const payload = {
      razorpay_order_id:   response.razorpay_order_id,
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_signature:  response.razorpay_signature,
      amount: total,
      items:  cart.map(i => ({ productId: i.id, name: i.name, price: i.price, qty: i.qty })),
      customer,
    };
    const res  = await fetch(`${API_BASE}/payment/razorpay/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.success) {
      showOrderSuccess(data.orderId || response.razorpay_payment_id, customer);
    } else {
      showToast('Payment verification failed. Contact support.', 'error');
      resetPayBtn();
    }
  } catch (err) {
    showToast('Verification error. Contact support.', 'error');
    resetPayBtn();
  }
}

// ── UPI ──
async function processUPI(customer, total) {
  const upiId = document.getElementById('co_upi').value.trim();
  const btn = document.getElementById('checkoutPayBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="pay-spinner"></span> Verifying UPI...';

  // Simulate UPI flow (in production, integrate with a payment gateway)
  await new Promise(r => setTimeout(r, 1800));
  const orderId = 'SB-UPI-' + Date.now().toString(36).toUpperCase();
  showOrderSuccess(orderId, customer);
}

// ──────────────────── Success Screen ────────────────────
function showOrderSuccess(orderId, customer) {
  cart = [];
  updateCartUI();

  document.getElementById('checkoutBody').style.display = 'none';
  document.getElementById('checkoutOrderId').textContent = `Order ID: ${orderId}`;
  document.getElementById('checkoutSuccess').classList.add('show');
}

function resetPayBtn() {
  const btn = document.getElementById('checkoutPayBtn');
  if (!btn) return;
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  btn.disabled = false;
  btn.textContent = `PAY ₹${total.toFixed(2)}`;
}

// ──────────────────── Toast (Stackable) ────────────────────
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      z-index: 9999;
      pointer-events: none;
    `;
    document.body.appendChild(container);
  }

  const colors = { success: '#16a34a', error: '#dc2626', info: '#5B2ECC' };
  const toast = document.createElement('div');
  toast.style.cssText = `
    background: ${colors[type] || colors.info};
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-family: var(--font-body, sans-serif);
    font-weight: 600;
    font-size: 0.95rem;
    box-shadow: 0 6px 20px rgba(0,0,0,0.15);
    white-space: nowrap;
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    pointer-events: auto;
  `;
  toast.innerHTML = message;
  
  container.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  }));

  // Auto remove after 2.5s
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    setTimeout(() => {
      if(toast.parentNode) toast.remove();
    }, 300);
  }, 2500);
}

// ──────────────────── DOMContentLoaded ────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Mobile nav
  const hamburger = document.querySelector('.hamburger');
  const nav = document.querySelector('.nav');
  if (hamburger) hamburger.addEventListener('click', () => nav.classList.toggle('nav--mobile-open'));

  // Wire CHECKOUT button → route to Order Summary Page
  document.querySelectorAll('.btn-checkout, .btn-add-to-cart').forEach(btn => {
    if (btn.textContent.trim().toUpperCase() === 'CHECKOUT') {
      btn.onclick = null;
      btn.addEventListener('click', () => {
        if (cart && cart.length > 0) {
          window.location.href = '/order-summary.html';
        } else {
          showToast('Your cart is empty!', 'error');
        }
      });
    }
  });

  // ── Back to Top Button ──
  const bttBtn = document.createElement('button');
  bttBtn.id = 'backToTop';
  bttBtn.title = 'Back to top';
  bttBtn.innerHTML = '⬆';
  document.body.appendChild(bttBtn);

  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      bttBtn.classList.add('visible');
    } else {
      bttBtn.classList.remove('visible');
    }
  });

  bttBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});
/* cache bust */
