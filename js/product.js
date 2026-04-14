document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = parseInt(urlParams.get('id'));

  const container = document.getElementById('productContainer');
  const breadcrumb = document.getElementById('breadcrumb-title');
  const relatedGrid = document.getElementById('relatedGrid');
  
  if (!productId) {
    container.innerHTML = '<div style="text-align:center; padding: 6rem; width:100%; color:red;">Invalid Product ID.</div>';
    breadcrumb.textContent = "Error";
    return;
  }

  try {
    const API_BASE = await window.getApiBase();
    const res = await fetch(`${API_BASE}/products?limit=200`);
    const data = await res.json();
    
    if (!data.success) throw new Error('Failed API');
    
    const products = data.data;
    const target = products.find(p => p.productId === productId || p.id === productId);
    
    if (!target) {
      container.innerHTML = '<div style="text-align:center; padding: 6rem; width:100%; color:red;">Product not found.</div>';
      breadcrumb.textContent = "Not Found";
      return;
    }

    breadcrumb.textContent = target.name;
    const isDiscounted = target.price < target.mrp;
    const mrpHTML = isDiscounted ? `<span style="font-size:1rem; opacity:0.6; color:var(--text-color); text-decoration:line-through; margin-right:0.5rem;">₹${target.mrp.toFixed(2)}</span>` : '';
    const imgUrl = target.image || '/images/default-snack.png';
    const safeName = target.name.replace(/'/g, "\\'");
    
    // Set Product Layout
    container.innerHTML = `
    <div class="product-detail__gallery">
      <div class="gallery-main" style="overflow:hidden; border-radius:12px; background:#fff; aspect-ratio:1;">
        <img src="${imgUrl}" alt="${safeName}" style="width:100%; height:100%; object-fit:cover;">
      </div>
      <button class="wishlist-btn" onclick="toggleWishlist(event, ${target.productId || target.id})" style="position:absolute; top:20px; right:20px; background:white; border:none; border-radius:50%; width:40px; height:40px; font-size:1.5rem; cursor:pointer; box-shadow:0 4px 10px rgba(0,0,0,0.1); z-index:10;">♡</button>
    </div>
    <div class="product-detail__info" style="position:relative;">
      <span class="product-badge" style="text-transform:uppercase;">${target.category}</span>
      <h1>${target.name}</h1>
      <p class="product-price">₹${target.price.toFixed(2)} ${mrpHTML}<span style="font-size:1rem; opacity:0.6; color:var(--text-color);">MRP</span></p>
      <div class="product-rating">★★★★★ <span>${Math.floor(Math.random() * 100) + 20} reviews</span></div>
      <p class="product-description" style="margin:1rem 0; line-height:1.6;">
        Delicious ${target.name} bringing you the authentic taste of premium ingredients! Perfect for your snack cravings anytime, anywhere.
      </p>
      <div class="product-quantity" style="display:flex; align-items:center; gap:1rem; margin:2rem 0;">
        <button onclick="updateQty(-1)" style="width:40px;height:40px;border-radius:8px;border:1px solid #ddd;background:white;cursor:pointer;font-size:1.2rem;">−</button>
        <span id="qty" style="font-weight:700; font-size:1.2rem;">1</span>
        <button onclick="updateQty(1)" style="width:40px;height:40px;border-radius:8px;border:1px solid #ddd;background:white;cursor:pointer;font-size:1.2rem;">+</button>
      </div>
      <button class="btn-add-to-cart" id="addToCartBtn">ADD TO CART — ₹<span id="add-btn-price">${target.price.toFixed(2)}</span></button>
      <div class="product-benefits" style="margin-top:2rem; display:flex; gap:1rem; flex-wrap:wrap;">
        <span style="font-size:0.9rem; background:#f4f4f4; padding:0.4rem 0.8rem; border-radius:999px;">🌿 Fresh Quality</span>
        <span style="font-size:0.9rem; background:#f4f4f4; padding:0.4rem 0.8rem; border-radius:999px;">📦 Fast Delivery</span>
      </div>
    </div>
    `;

    // Wiring Quantity Buttons
    let currentQty = 1;
    window.updateQty = (delta) => {
      currentQty = Math.max(1, currentQty + delta);
      document.getElementById('qty').textContent = currentQty;
      document.getElementById('add-btn-price').textContent = (currentQty * target.price).toFixed(2);
    };

    // Wiring Add to Cart Button
    document.getElementById('addToCartBtn').addEventListener('click', () => {
      addToCart({
        id: target.productId || target.id,
        name: target.name,
        price: target.price,
        image: target.image,
        qty: currentQty
      });
      showToast('✅ Added to cart!', 'success');
    });

    // Populate "You may also like"
    const related = products.filter(p => p.category === target.category && p.productId !== target.productId).slice(0, 4);
    if (related.length === 0) {
      // Fallback
      related.push(...products.filter(p => p.productId !== target.productId).slice(0, 4));
    }

    relatedGrid.innerHTML = related.map(p => {
      const pImage = p.image || '/images/default-snack.png';
      const plink = `/product.html?id=${p.productId || p.id}`;
      return `
      <div class="product-card" onclick="window.location='${plink}'" style="cursor:pointer; background:white; border-radius:12px; padding:1rem; box-shadow:0 4px 12px rgba(0,0,0,0.05); transition:transform 0.2s;">
        <img src="${pImage}" style="width:100%; height:160px; object-fit:contain; border-radius:8px;">
        <div style="font-weight:700; margin-top:0.8rem; font-size:1.1rem; color:var(--color-dark-text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.name}</div>
        <div style="color:var(--color-primary); font-weight:700; margin-top:0.4rem;">₹${p.price.toFixed(2)}</div>
      </div>
      `;
    }).join('');

  } catch (err) {
    console.error(err);
    container.innerHTML = '<div style="text-align:center; padding: 6rem; width:100%; color:red;">Failed to connect to API.</div>';
  }
});
