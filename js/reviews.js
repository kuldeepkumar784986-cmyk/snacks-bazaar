// ═══════════════════════════════════════════════════════════════
//  SNACK BAZAAR — Customer Reviews Frontend
// ═══════════════════════════════════════════════════════════════

const REVIEWS_API = 'https://snacks-bazaar-production.up.railway.app/api';

// ── State ──
let currentReviewProductId = null;
let currentReviewRating = 0;

// ── Init: load ratings for all product cards ──
document.addEventListener('DOMContentLoaded', () => {
  loadAllProductRatings();
});

// ── Load average ratings for every product card on the page ──
async function loadAllProductRatings() {
  const cards = document.querySelectorAll('.product-card[data-product-id]');
  cards.forEach(async (card) => {
    const pid = card.getAttribute('data-product-id');
    try {
      const res = await fetch(`${REVIEWS_API}/products/${pid}/reviews`);
      const data = await res.json();
      if (data.success) {
        renderCardRating(card, data.averageRating, data.reviewCount, pid);
      }
    } catch { /* silently fail for individual cards */ }
  });
}

// ── Render star rating + review count on a product card ──
function renderCardRating(card, avg, count, productId) {
  // Remove any existing rating row
  const existing = card.querySelector('.card-rating-row');
  if (existing) existing.remove();

  const row = document.createElement('div');
  row.className = 'card-rating-row';
  row.innerHTML = `
    <div class="card-stars">${renderStarsHTML(avg)}</div>
    <span class="card-rating-text">${avg > 0 ? avg.toFixed(1) : '—'} <small>(${count} review${count !== 1 ? 's' : ''})</small></span>
    <button class="btn-view-reviews" onclick="openReviewPanel(${productId}, event)">Reviews</button>
  `;

  // Insert after the price and before the add-to-cart button
  const priceEl = card.querySelector('.product-card__price');
  if (priceEl && priceEl.nextSibling) {
    card.insertBefore(row, priceEl.nextSibling);
  } else {
    card.appendChild(row);
  }
}

// ── Generate star HTML from a rating number ──
function renderStarsHTML(rating) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) {
      html += '<span class="star filled">★</span>';
    } else if (rating >= i - 0.5) {
      html += '<span class="star half">★</span>';
    } else {
      html += '<span class="star empty">★</span>';
    }
  }
  return html;
}

// ── Open review panel (modal) ──
function openReviewPanel(productId, e) {
  if (e) e.stopPropagation();
  currentReviewProductId = productId;
  currentReviewRating = 0;

  const modal = document.getElementById('reviewModal');
  modal.classList.add('active');

  // Update star selector state
  updateStarSelector(0);

  // Check if logged in
  const token = localStorage.getItem('sb_token');
  const formSection = document.getElementById('reviewFormSection');
  const loginPrompt = document.getElementById('reviewLoginPrompt');

  if (token) {
    formSection.style.display = 'block';
    loginPrompt.style.display = 'none';
  } else {
    formSection.style.display = 'none';
    loginPrompt.style.display = 'block';
  }

  // Clear form
  document.getElementById('reviewComment').value = '';
  document.getElementById('reviewMsg').style.display = 'none';

  // Load existing reviews
  loadReviewsForProduct(productId);
}

function closeReviewPanel() {
  document.getElementById('reviewModal').classList.remove('active');
}

// ── Load reviews list ──
async function loadReviewsForProduct(productId) {
  const list = document.getElementById('reviewsList');
  list.innerHTML = '<div style="text-align:center;padding:20px;color:#999;">Loading reviews...</div>';

  try {
    const res = await fetch(`${REVIEWS_API}/products/${productId}/reviews`);
    const data = await res.json();

    // Update modal header
    document.getElementById('reviewModalAvg').innerHTML =
      `${renderStarsHTML(data.averageRating)} <strong>${data.averageRating > 0 ? data.averageRating.toFixed(1) : '—'}</strong> <small>(${data.reviewCount} review${data.reviewCount !== 1 ? 's' : ''})</small>`;

    if (!data.success || !data.reviews.length) {
      list.innerHTML = `
        <div style="text-align:center;padding:40px 20px;">
          <div style="font-size:2.5rem;margin-bottom:8px;">💬</div>
          <p style="font-weight:600;color:#333;">No reviews yet</p>
          <p style="font-size:13px;color:#999;">Be the first to share your thoughts!</p>
        </div>`;
      return;
    }

    list.innerHTML = data.reviews.map(r => `
      <div class="review-item">
        <div class="review-item__header">
          <div>
            <strong class="review-item__name">${escapeHtml(r.customerName)}</strong>
            <span class="review-item__date">${new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
          <div class="review-item__stars">${renderStarsHTML(r.rating)}</div>
        </div>
        ${r.comment ? `<p class="review-item__comment">${escapeHtml(r.comment)}</p>` : ''}
      </div>
    `).join('');

  } catch {
    list.innerHTML = '<div style="text-align:center;padding:20px;color:#c0392b;">Could not load reviews.</div>';
  }
}

// ── Star selector interaction ──
function selectStar(n) {
  currentReviewRating = n;
  updateStarSelector(n);
}

function updateStarSelector(n) {
  const stars = document.querySelectorAll('.star-selector .sel-star');
  stars.forEach((s, i) => {
    s.classList.toggle('active', i < n);
  });
}

// ── Submit review ──
async function submitReview() {
  const msg = document.getElementById('reviewMsg');
  msg.style.display = 'none';

  if (currentReviewRating === 0) {
    showReviewMsg(msg, 'Please select a star rating', 'error');
    return;
  }

  const comment = document.getElementById('reviewComment').value.trim();
  const token = localStorage.getItem('sb_token');

  if (!token) {
    showReviewMsg(msg, 'Please login first', 'error');
    return;
  }

  const btn = document.getElementById('btnSubmitReview');
  btn.disabled = true;
  btn.textContent = 'SUBMITTING...';

  try {
    const res = await fetch(`${REVIEWS_API}/products/${currentReviewProductId}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ rating: currentReviewRating, comment }),
    });

    const data = await res.json();

    if (data.success) {
      showReviewMsg(msg, '✅ ' + data.message, 'success');
      document.getElementById('reviewComment').value = '';
      currentReviewRating = 0;
      updateStarSelector(0);
      loadReviewsForProduct(currentReviewProductId);
      // Refresh card ratings
      setTimeout(() => loadAllProductRatings(), 500);
    } else {
      showReviewMsg(msg, data.message, 'error');
    }
  } catch {
    showReviewMsg(msg, 'Connection error. Try again.', 'error');
  }

  btn.disabled = false;
  btn.textContent = 'SUBMIT REVIEW';
}

// ── Helpers ──
function showReviewMsg(el, text, type) {
  el.textContent = text;
  el.className = `review-msg review-msg--${type}`;
  el.style.display = 'block';
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
