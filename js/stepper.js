/**
 * stepper.js
 * Automatically injects a quantity stepper into every product card.
 * Works on any page with .product-card elements.
 */
document.addEventListener('DOMContentLoaded', () => {
  // Find all Add to Cart buttons
  const cartBtns = document.querySelectorAll('.product-card .btn-primary');

  cartBtns.forEach((btn, index) => {
    // Skip buttons that are "View product" links (not cart buttons)
    if (!btn.getAttribute('onclick') || !btn.getAttribute('onclick').includes('addToCart')) return;

    // Create a unique stepper ID
    const stepperId = `stepper-qty-${index}`;

    // Grab the original onclick and extract the cart object JSON
    const originalOnclick = btn.getAttribute('onclick');

    // Create stepper HTML
    const stepperWrapper = document.createElement('div');
    stepperWrapper.className = 'qty-stepper';
    stepperWrapper.innerHTML = `
      <button class="qty-stepper__btn" onclick="
        const el = document.getElementById('${stepperId}');
        const v = parseInt(el.textContent);
        if(v > 1) el.textContent = v - 1;
      " aria-label="Decrease quantity">−</button>
      <span class="qty-stepper__count" id="${stepperId}">1</span>
      <button class="qty-stepper__btn" onclick="
        const el = document.getElementById('${stepperId}');
        el.textContent = parseInt(el.textContent) + 1;
      " aria-label="Increase quantity">+</button>
    `;

    // Inject stepper before the Add to Cart button
    btn.parentNode.insertBefore(stepperWrapper, btn);

    // Update button onclick to include the quantity from stepper
    btn.setAttribute('onclick', `
      (function() {
        ${originalOnclick.replace('addToCart(', 'const _cartData = ').replace(/\)$/, ';')}
        const qty = parseInt(document.getElementById('${stepperId}').textContent);
        for (let i = 0; i < qty; i++) { addToCart(_cartData); }
      })()
    `);
  });
});
