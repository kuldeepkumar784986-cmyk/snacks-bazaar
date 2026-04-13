// ═══════════════════════════════════════════════════════
//  Snack Bazaar — Cloudflare Worker Proxy
//  Proxies all requests to Railway backend so Indian
//  users on Jio/Airtel can access without VPN
//
//  Deploy: wrangler deploy  OR  paste in CF dashboard
//  Free tier: 100,000 req/day — enough for production
// ═══════════════════════════════════════════════════════

const BACKEND = 'https://snacks-bazaar-production.up.railway.app';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Build target URL: swap worker host → Railway host
    const targetUrl = `${BACKEND}${url.pathname}${url.search}`;

    // Clone request with new URL
    const modifiedRequest = new Request(targetUrl, {
      method:  request.method,
      headers: request.headers,
      body:    request.method !== 'GET' && request.method !== 'HEAD'
               ? request.body
               : undefined,
      redirect: 'follow',
    });

    try {
      const response = await fetch(modifiedRequest);

      // Clone response and inject CORS headers so browsers
      // accept it regardless of origin
      const newHeaders = new Headers(response.headers);
      newHeaders.set('Access-Control-Allow-Origin', '*');
      newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      newHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      // Handle OPTIONS preflight
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: newHeaders });
      }

      return new Response(response.body, {
        status:  response.status,
        headers: newHeaders,
      });

    } catch (err) {
      return new Response(
        JSON.stringify({ success: false, error: 'Proxy error', detail: err.message }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },
};
