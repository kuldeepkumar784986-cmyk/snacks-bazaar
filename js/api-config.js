// ═══════════════════════════════════════════════════════
//  SNACK BAZAAR — API Config
//  Smart fallback: tries primary URL, switches to backup
//  if primary fails (useful when Railway is slow in India)
// ═══════════════════════════════════════════════════════

const API_URLS = {
  primary: 'https://snacks-bazaar-production.up.railway.app/api',
  backup:  'https://snack-bazaar-backend-YOURNAME.koyeb.app/api', // ← update after Koyeb deploy
};

// Stores the working URL so we don't retry on every call
let _resolvedBase = null;

async function getApiBase() {
  if (_resolvedBase) return _resolvedBase;

  // Quick health check on primary (2s timeout)
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 2000);
    const res = await fetch(`${API_URLS.primary}/products?limit=1`, { signal: ctrl.signal });
    clearTimeout(t);
    if (res.ok) {
      _resolvedBase = API_URLS.primary;
      console.log('[API] Using primary (Railway):', _resolvedBase);
      return _resolvedBase;
    }
  } catch {
    console.warn('[API] Primary unreachable, switching to backup (Render)');
  }

  _resolvedBase = API_URLS.backup;
  console.log('[API] Using backup (Render):', _resolvedBase);
  return _resolvedBase;
}

// Export for use by filter.js, cart.js, reviews.js
window.getApiBase = getApiBase;
window.API_URLS   = API_URLS;
