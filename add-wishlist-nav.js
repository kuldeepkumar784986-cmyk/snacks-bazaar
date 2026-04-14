const fs = require('fs');
const files = ['account.html', 'admin.html', 'find-ollys.html', 'index.html', 'one-feeds-two.html', 'our-story.html', 'product.html', 'shop.html', 'order-summary.html'];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  
  // Look for the cart icon across navbars
  const target = '<a href="javascript:void(0)" aria-label="Cart" onclick="openCart()">';
  const replacement = '<a href="/wishlist.html" aria-label="Wishlist" style="position:relative;">❤️ <span class="wishlist-count hidden" style="position:absolute; top:-8px; right:-12px; background:#ff4e00; color:white; min-width:20px; height:20px; border-radius:999px; display:flex; align-items:center; justify-content:center; font-size:0.75rem; font-weight:700; padding:0 4px; border:2px solid white; box-shadow:0 2px 5px rgba(0,0,0,0.2); transition:opacity 0.2s, transform 0.2s;">0</span></a>\n      ' + target;
  
  if (content.includes(target) && !content.includes('wishlist.html')) {
    content = content.replace(target, replacement);
    
    // Also include js/wishlist.js before js/cart.js if not present
    if (!content.includes('wishlist.js')) {
      content = content.replace('<script src="/js/cart.js"></script>', '<script src="/js/wishlist.js"></script>\n  <script src="/js/cart.js"></script>');
    }
    
    fs.writeFileSync(file, content);
    console.log('Updated ' + file);
  }
});
