document.addEventListener('DOMContentLoaded', () => {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const shopGrid   = document.querySelector('.shop-grid');

  if (!shopGrid) return; // Only run on shop page

  const API_BASE = 'https://snack-bazaar-proxy.kuldeepkumar784986.workers.dev/api';
  let allProducts  = [];

  // ── Trending / New product IDs (for badges) ──
  const TRENDING_IDS  = new Set([101, 102, 104, 106, 120]);
  const FAST_IDS      = new Set([103, 107, 130]);
  const NEW_IDS       = new Set([204, 205, 212, 220, 225]);
  const FREE_DELIVERY = 299;

  // ── Skeleton loading ──
  function showSkeletons(count = 8) {
    shopGrid.innerHTML = Array.from({ length: count }, () => `
      <div class="skeleton-card">
        <div class="skeleton-line skeleton-img"></div>
        <div class="skeleton-line skeleton-title"></div>
        <div class="skeleton-line skeleton-sub"></div>
        <div class="skeleton-line skeleton-price"></div>
        <div class="skeleton-line skeleton-btn"></div>
      </div>`).join('');
  }

  // ── Fetch products from backend ──
  async function loadProducts() {
    showSkeletons(8);
    try {
      const response = await fetch(`${API_BASE}/products?limit=200`);
      const data     = await response.json();

      if (data.success) {
        allProducts = data.data;
        renderProducts(allProducts);
      } else {
        shopGrid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:2rem;color:red;">Failed to load snacks.</div>';
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      shopGrid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:2rem;color:red;">Could not connect to server.</div>';
    }
  }

  // ── Render products ──
  function renderProducts(products) {
    if (products.length === 0) {
      shopGrid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:2rem;">No snacks found here!</div>';
      return;
    }

    // Dispatch event after render completes
    setTimeout(() => document.dispatchEvent(new Event('productsRendered')), 100);

    shopGrid.innerHTML = products.map(product => {
      const safeName = product.name.replace(/'/g, "\\'");
      const imageSrc = product.image || '/images/default-snack.png';
      const pid      = product.productId;

      // Badge
      let badge = '';
      if (TRENDING_IDS.has(pid))
        badge = '<span class="badge badge--trending">🔥 Trending</span>';
      else if (FAST_IDS.has(pid))
        badge = '<span class="badge badge--fast">⚡ Fast Moving</span>';
      else if (NEW_IDS.has(pid))
        badge = '<span class="badge badge--new">✨ New</span>';

      // Out of stock
      let outOfStockBadge = '';
      let btnHtml = `<button class="btn-primary"
        onclick="handleAddToCart(this,{id:${pid},name:'${safeName}',price:${product.price},image:'${imageSrc}'})">
        Add to cart</button>`;

      if (product.stock === 0) {
        outOfStockBadge = `<div style="position:absolute;top:10px;right:10px;background:#dc2626;color:white;
          padding:4px 8px;border-radius:4px;font-size:0.75rem;font-weight:bold;z-index:10;">OUT OF STOCK</div>`;
        btnHtml = `<button class="btn-primary" disabled style="opacity:0.5;cursor:not-allowed;">Out of Stock</button>`;
      }

      // Low stock urgency
      const lowStockLabel = (product.stock > 0 && product.stock <= 5)
        ? `<div class="badge--low-stock">🔥 Only ${product.stock} left!</div>` : '';

      // Star rating
      const stars = product.averageRating > 0
        ? `<div class="star-rating" style="margin:4px 0;">${'★'.repeat(Math.round(product.averageRating))}${'☆'.repeat(5-Math.round(product.averageRating))} <small style="color:#888;">(${product.reviewCount})</small></div>`
        : '';

      return `
        <div class="product-card" data-category="${product.category}" style="position:relative;" data-aos="fade-up">
          ${badge}
          ${outOfStockBadge}
          <div class="product-img-wrap">
            <img src="${imageSrc}" alt="${product.name}" onerror="this.style.display='none'">
          </div>
          <div class="product-card__title" style="text-transform:uppercase;">${product.name}</div>
          ${stars}
          <div class="product-card__subtitle">MRP: ₹${product.price.toFixed(2)} ${product.weight ? '• '+product.weight : ''}</div>
          ${lowStockLabel}
          <div class="product-card__price">₹${product.price.toFixed(2)}</div>
          ${btnHtml}
          <a href="https://wa.me/917849861219?text=${encodeURIComponent('Hey! Check out ' + product.name + ' on Snack Bazaar 🍿 https://snacks-bazaar.vercel.app/shop.html')}"
             target="_blank" rel="noopener" class="wa-share-btn" title="Share on WhatsApp">
            💬 Share
          </a>
        </div>`;
    }).join('');
  }

  // ── Add to cart with bounce animation ──
  window.handleAddToCart = function(btn, product) {
    addToCart(product);
    btn.classList.remove('btn-bouncing');
    void btn.offsetWidth; // reflow to restart animation
    btn.classList.add('btn-bouncing');
    const orig = btn.textContent;
    btn.textContent = '✓ Added!';
    setTimeout(() => {
      btn.classList.remove('btn-bouncing');
      btn.textContent = orig;
    }, 1200);
  };

  // ── Category map: filter button value → DB category string(s) ──
  // Some brands share a DB category (e.g. Too Yumm is stored as 'healthy')
  const CATEGORY_MAP = {
    'too-yumm':    p => p.category === 'healthy' && p.name.toLowerCase().includes('too yumm'),
    'soya-chips':  p => p.category === 'healthy' && p.name.toLowerCase().includes('soya'),
  };

  // ── Filtering ──
  if (filterBtns.length > 0) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        let filtered;
        if (filter === 'all') {
          filtered = allProducts;
        } else if (CATEGORY_MAP[filter]) {
          filtered = allProducts.filter(CATEGORY_MAP[filter]);
        } else {
          filtered = allProducts.filter(p => p.category === filter);
        }
        renderProducts(filtered);
      });
    });
  }

  loadProducts();

  // Notify premium.js to refresh AOS after dynamic render
  document.addEventListener('productsRendered', () => { if (window.AOS) AOS.refresh(); });
});
