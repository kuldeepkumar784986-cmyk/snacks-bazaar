// ═══════════════════════════════════════════════════════
//  SNACK BAZAAR — API Config
//  Primary: Cloudflare Worker (fast in India, no blocking)
//  Fallback: Railway direct (if Worker not deployed yet)
// ═══════════════════════════════════════════════════════

const API_URLS = {
  // ← Replace with your actual Worker URL after deploying
  primary: 'https://snack-bazaar-proxy.YOUR-SUBDOMAIN.workers.dev/api',
  backup:  'https://snacks-bazaar-production.up.railway.app/api',
};

// Stores the working URL so we don't retry on every call
let _resolvedBase = null;

async function getApiBase() {
  if (_resolvedBase) return _resolvedBase;

  // If Worker URL is still a placeholder, skip straight to backup
  if (API_URLS.primary.includes('YOUR-SUBDOMAIN')) {
    _resolvedBase = API_URLS.backup;
    console.log('[API] Worker not configured yet, using Railway:', _resolvedBase);
    return _resolvedBase;
  }

  // Quick health check on Worker (2.5s timeout)
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 2500);
    const res = await fetch(`${API_URLS.primary}/products?limit=1`, { signal: ctrl.signal });
    clearTimeout(t);
    if (res.ok) {
      _resolvedBase = API_URLS.primary;
      console.log('[API] Using Cloudflare Worker:', _resolvedBase);
      return _resolvedBase;
    }
  } catch {
    console.warn('[API] Worker unreachable, falling back to Railway');
  }

  _resolvedBase = API_URLS.backup;
  console.log('[API] Using Railway backup:', _resolvedBase);
  return _resolvedBase;
}

// Expose for filter.js, cart.js, reviews.js
window.getApiBase = getApiBase;
window.API_URLS   = API_URLS;
