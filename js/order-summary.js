document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('summaryContainer');
  renderSummary();

  function renderSummary() {
    let cart = [];
    try {
      cart = JSON.parse(localStorage.getItem('snack_cart')) || [];
    } catch {}

    if (cart.length === 0) {
      container.innerHTML = `
        <div style="width:100%; text-align:center; padding: 6rem; background:white; border-radius:12px;">
          <h2 style="font-family:var(--font-display); font-size:2rem; color:var(--color-purple-deep);">YOUR CART IS EMPTY</h2>
          <p style="margin:1rem 0 2rem; color:#666;">Looks like you haven't added any snacks yet!</p>
          <a href="/shop.html" class="btn-primary" style="text-decoration:none; display:inline-block;">Start Shopping</a>
        </div>
      `;
      return;
    }

    let subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    let discAmount = 0;
    
    // Check if SNACK50 applied (simplified via local state)
    let promoApplied = window.activePromo === 'SNACK50';
    if (promoApplied) {
      discAmount = subtotal * 0.5;
    }

    let delivery = (subtotal - discAmount) >= 299 ? 0 : 50;
    let finalTotal = (subtotal - discAmount) + delivery;

    container.innerHTML = `
      <div class="summary-cart">
        <h2 style="font-family:var(--font-display); font-size:2.5rem; color:var(--color-purple-deep); margin-bottom:1.5rem;">ORDER SUMMARY</h2>
        <div style="background:white; border-radius:12px; padding:1.5rem; box-shadow:0 4px 15px rgba(0,0,0,0.03);">
          ${cart.map(item => `
            <div class="summary-item">
              <img src="${item.image || '/images/default-snack.png'}" alt="${item.name}">
              <div style="flex:1;">
                <div style="font-weight:700; font-size:1.1rem; text-transform:uppercase;">${item.name}</div>
                <div style="color:#666; font-size:0.9rem; margin-top:0.4rem;">Qty: ${item.qty}</div>
              </div>
              <div style="font-weight:700; font-size:1.1rem; color:var(--color-primary);">₹${(item.price * item.qty).toFixed(2)}</div>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="summary-math">
        <h3 style="font-family:var(--font-display); font-size:1.8rem; margin-bottom:1.5rem; color:var(--color-purple-deep);">PRICE DETAILS</h3>
        
        <div class="promo-box">
          <input type="text" id="promoInput" placeholder="Enter promo code" style="text-transform:uppercase;" ${promoApplied ? 'disabled value="SNACK50"' : ''}>
          <button id="applyPromoBtn" ${promoApplied ? 'disabled style="background:#16a34a;"' : ''}>${promoApplied ? 'APPLIED' : 'APPLY'}</button>
        </div>

        <div class="summary-row">
          <span>Subtotal</span>
          <span>₹${subtotal.toFixed(2)}</span>
        </div>
        
        ${promoApplied ? `
        <div class="summary-row" style="color:#16a34a;">
          <span>Promo Discount (50%)</span>
          <span>- ₹${discAmount.toFixed(2)}</span>
        </div>
        ` : ''}

        <div class="summary-row">
          <span>Delivery Fee</span>
          <span style="${delivery === 0 ? 'color:#16a34a; font-weight:700;' : ''}">${delivery === 0 ? 'FREE' : '₹50.00'}</span>
        </div>
        
        <div class="summary-row total">
          <span>Total</span>
          <span style="color:var(--color-primary);">₹${finalTotal.toFixed(2)}</span>
        </div>

        <button id="finalCheckoutBtn" class="btn-primary" style="width:100%; margin-top:1.5rem; font-size:1.2rem; display:block; text-align:center;">PROCEED TO PAYMENT</button>
        <a href="/shop.html" style="display:block; text-align:center; margin-top:1rem; color:#666; font-weight:700; text-decoration:none;">← Continue Shopping</a>
      </div>
    `;

    // Wire up events
    const applyBtn = document.getElementById('applyPromoBtn');
    if (applyBtn && !promoApplied) {
      applyBtn.addEventListener('click', () => {
        const code = document.getElementById('promoInput').value.trim().toUpperCase();
        if (code === 'SNACK50') {
          window.activePromo = 'SNACK50';
          showToast('📋 SNACK50 Applied! 50% Off ✨', 'success');
          renderSummary();
        } else {
          showToast('Invalid promo code', 'error');
        }
      });
    }

    const checkoutBtn = document.getElementById('finalCheckoutBtn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => {
         // Re-assign global cart total for razorpay compatibility
         window.total = finalTotal; 
         if (typeof window.openCheckout === 'function') {
           window.openCheckout();
         } else {
           showToast('Checkout securely initializing...', 'info');
         }
      });
    }
  }

  // Hook into cart updates so summary page changes if drawer modifies cart
  document.addEventListener('click', (e) => {
    if (e.target.closest('button[onclick^="changeQty"]')) {
      setTimeout(renderSummary, 50); // small delay to let cart.js update localstorage
    }
  });

});
