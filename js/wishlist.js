// ═══════════════════════════════════════════════════════
//  SNACK BAZAAR — Wishlist Logic
// ═══════════════════════════════════════════════════════

function getWishlist() {
  const data = localStorage.getItem('snack_wishlist');
  return data ? JSON.parse(data) : [];
}

function saveWishlist(list) {
  localStorage.setItem('snack_wishlist', JSON.stringify(list));
}

function updateWishlistBadge() {
  const list = getWishlist();
  document.querySelectorAll('.wishlist-count').forEach(el => {
    el.textContent = list.length;
    if (list.length > 0) {
      el.classList.remove('hidden');
      el.classList.remove('badge-pop');
      void el.offsetWidth;
      el.classList.add('badge-pop');
    } else {
      el.classList.add('hidden');
    }
  });
}

// Global expose early before DOM load
window.snackWishlist = getWishlist().map(item => item.id.toString());

window.toggleWishlist = function(event, id, name, price, image) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  
  let list = getWishlist();
  const index = list.findIndex(item => item.id == id);
  
  let added = false;
  if (index > -1) {
    list.splice(index, 1);
    showToast('🗑️ Removed from wishlist', 'error');
  } else {
    list.push({ id, name, price, image });
    showToast('❤️ Added to wishlist!', 'success');
    added = true;
  }
  
  saveWishlist(list);
  window.snackWishlist = list.map(item => item.id.toString());
  updateWishlistBadge();

  // Visual toggle on the specific button
  if (event && event.currentTarget) {
    event.currentTarget.classList.toggle('active', added);
    event.currentTarget.textContent = added ? '❤️' : '♡';
    event.currentTarget.style.transform = 'scale(1.2)';
    setTimeout(() => { event.currentTarget.style.transform = 'scale(1)'; }, 200);
  }

  // Dispatch global event for wishlist page
  document.dispatchEvent(new Event('wishlistUpdated'));
};

document.addEventListener('DOMContentLoaded', () => {
  updateWishlistBadge();
});
