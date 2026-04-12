document.addEventListener('DOMContentLoaded', () => {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const shopGrid = document.querySelector('.shop-grid');
  
  if (!shopGrid) return; // Only run on shop page

  const API_BASE = 'https://snacks-bazaar-production.up.railway.app/api';
  let allProducts = [];

  // Fetch products from backend
  async function loadProducts() {
    try {
      shopGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem;">Loading incredibly tasty snacks... 🍿</div>';
      
      const response = await fetch(`${API_BASE}/products`);
      const data = await response.json();
      
      if (data.success) {
        allProducts = data.data;
        renderProducts(allProducts);
      } else {
        shopGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: red;">Failed to load snacks.</div>';
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      shopGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: red;">Could not connect to the backend server.</div>';
    }
  }

  // Render products to grid
  function renderProducts(products) {
    if (products.length === 0) {
      shopGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem;">No snacks found here!</div>';
      return;
    }

    shopGrid.innerHTML = products.map(product => {
      // Escape for safe HTML injection
      const safeName = product.name.replace(/'/g, "\\'");
      const imageSrc = product.image || '/images/default-snack.png';
      
      let outOfStockBadge = '';
      let btnHtml = `<button class="btn-primary" onclick="addToCart({id:${product.productId}, name: '${safeName}', price: ${product.price}, image: '${imageSrc}'})">Add to cart</button>`;
      
      if (product.stock === 0) {
        outOfStockBadge = `<div style="position: absolute; top: 10px; right: 10px; background: #dc2626; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: bold; z-index: 10;">OUT OF STOCK</div>`;
        btnHtml = `<button class="btn-primary" disabled style="opacity: 0.5; cursor: not-allowed;">Out of Stock</button>`;
      }

      return `
        <div class="product-card" data-category="${product.category}" style="position: relative;">
          ${outOfStockBadge}
          <div style="aspect-ratio:1; border-radius:8px; margin-bottom:1rem; overflow:hidden; background:#f8f8f8;">
            <img src="${imageSrc}" alt="${product.name}" style="width:100%; height:100%; object-fit:cover;" onerror="this.style.display='none'">
          </div>
          <div class="product-card__title" style="text-transform: uppercase;">${product.name}</div>
          <div class="product-card__subtitle">MRP: ₹${product.price.toFixed(2)} ${product.weight ? '• ' + product.weight : ''}</div>
          <div class="product-card__price">₹${product.price.toFixed(2)}</div>
          ${btnHtml}
        </div>
      `;
    }).join('');
  }

  // Handle Filtering
  if (filterBtns.length > 0) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;
        
        // Update active styling
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Filter frontend data array instead of DOM nodes for smoother rendering
        if (filter === 'all') {
          renderProducts(allProducts);
        } else {
          const filtered = allProducts.filter(p => p.category === filter);
          renderProducts(filtered);
        }
      });
    });
  }

  // Initial load
  loadProducts();
});
