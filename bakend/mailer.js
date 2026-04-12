// ═══════════════════════════════════════════════════════
//  SNACK BAZAAR — Mailer (Brevo REST API via native fetch)
//  No SDK dependency — works on any Node 18+ environment
// ═══════════════════════════════════════════════════════

if (!process.env.BREVO_API_KEY) {
  console.error('[MAILER] WARNING: BREVO_API_KEY is not set! Emails will fail.');
}

const FROM_EMAIL  = process.env.BREVO_FROM_EMAIL || 'kuldeepkumar784986@gmail.com';
const FROM_NAME   = process.env.BREVO_FROM_NAME  || 'Snack Bazaar';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL      || 'kuldeepkumar784986@gmail.com';
const REPLY_TO    = 'kuldeepkumar784986@gmail.com';

// ── Shared email sender (Brevo REST API) ─────────────────────────
async function sendEmail({ to, subject, html, tags = [] }) {
  const body = {
    sender:      { name: FROM_NAME, email: FROM_EMAIL },
    to:          Array.isArray(to) ? to : [{ email: to }],
    replyTo:     { email: REPLY_TO },
    subject,
    htmlContent: html,
  };
  if (tags.length) body.tags = tags;

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method:  'POST',
    headers: {
      'api-key':      process.env.BREVO_API_KEY,
      'Content-Type': 'application/json',
      'Accept':       'application/json',
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let result;
  try { result = JSON.parse(text); } catch { result = { raw: text }; }

  if (!response.ok) {
    console.error('[MAILER] Brevo API error:', response.status, JSON.stringify(result));
    throw new Error(`Brevo send failed (${response.status}): ${text}`);
  }

  console.log('[MAILER] Email sent via Brevo:', JSON.stringify(result));
  return result;
}

// ── Email style ───────────────────────────────────────────────────
const getEmailStyle = () => `
  <style>
    body { font-family:'Helvetica Neue',Arial,sans-serif; background:#f4f6f8; padding:20px; margin:0; }
    .container { max-width:600px; margin:0 auto; background:#fff; padding:30px; border-radius:12px; border:1px solid #eee; }
    h1 { color:#511b8b; font-size:24px; margin-bottom:20px; }
    h2 { color:#333; font-size:18px; margin-top:30px; border-bottom:2px solid #511b8b; padding-bottom:10px; }
    p  { color:#555; line-height:1.6; font-size:16px; }
    .order-details { width:100%; border-collapse:collapse; margin-top:20px; }
    .order-details th { text-align:left; padding:12px; background:#fafafa; color:#888; font-size:12px; text-transform:uppercase; border-bottom:2px solid #eee; }
    .order-details td { padding:12px; border-bottom:1px solid #eee; color:#333; }
    .total-row { font-weight:bold; font-size:18px; color:#511b8b; }
    .badge { display:inline-block; background:#511b8b; color:white; padding:4px 12px; border-radius:20px; font-size:14px; }
    .footer { text-align:center; margin-top:40px; font-size:12px; color:#aaa; }
  </style>
`;

const getItemsHtml = (items = [], totalAmount = 0) => {
  const rows = items.map(i =>
    `<tr><td>${i.name}</td><td>${i.qty}</td><td>&#8377;${i.price}</td></tr>`
  ).join('');
  return `
    <table class="order-details">
      <tr><th>Item</th><th>Qty</th><th>Price</th></tr>
      ${rows}
      <tr class="total-row"><td colspan="2">Total</td><td>&#8377;${totalAmount}</td></tr>
    </table>`;
};

// ── 1. Order Confirmation → Customer ─────────────────────────────
const sendOrderConfirmationToCustomer = async (order) => {
  if (!order.customer?.email) {
    console.warn('[MAILER] No customer email — skipping confirmation');
    return { skipped: true };
  }

  const html = `<html><head>${getEmailStyle()}</head><body>
    <div class="container">
      <h1>&#127881; Order Confirmed, ${order.customer.name || 'Snack Lover'}!</h1>
      <p>Your order <strong>${order.orderId}</strong> has been received and is being packed.</p>
      <p>Payment: <span class="badge">${order.paymentMethod}</span></p>
      <h2>Your Items</h2>
      ${getItemsHtml(order.items, order.amount)}
      <h2>Delivery Address</h2>
      <p>${order.customer.address || 'N/A'}</p>
      <p>Questions? Just reply to this email!</p>
      <div class="footer">Snack Bazaar &mdash; India's Premium Snack Hub &#127871;</div>
    </div>
  </body></html>`;

  return sendEmail({
    to:      [{ email: order.customer.email, name: order.customer.name || 'Customer' }],
    subject: `✅ Order Confirmed: ${order.orderId} — Snack Bazaar`,
    html,
    tags:    ['order_confirmation'],
  });
};

// ── 2. New Order Alert → Admin ───────────────────────────────────
const sendNewOrderAlertToAdmin = async (order) => {
  const html = `<html><head>${getEmailStyle()}</head><body>
    <div class="container">
      <h1>&#128165; New Order: ${order.orderId}</h1>
      <p>Payment via <strong>${order.paymentMethod}</strong></p>
      <h2>Customer Details</h2>
      <p>
        <strong>Name:</strong> ${order.customer?.name || 'N/A'}<br>
        <strong>Email:</strong> ${order.customer?.email || 'N/A'}<br>
        <strong>Phone:</strong> ${order.customer?.phone || 'N/A'}<br>
        <strong>Address:</strong> ${order.customer?.address || 'N/A'}
      </p>
      <h2>Items Ordered</h2>
      ${getItemsHtml(order.items, order.amount)}
      <div class="footer">Snack Bazaar Admin Alert</div>
    </div>
  </body></html>`;

  return sendEmail({
    to:      [{ email: ADMIN_EMAIL, name: 'Snack Bazaar Admin' }],
    subject: `💥 NEW ORDER: ${order.orderId} — ₹${order.amount}`,
    html,
    tags:    ['admin_alert'],
  });
};

// ── 3. Status Update → Customer ──────────────────────────────────
const sendStatusUpdateToCustomer = async (order, status) => {
  if (!order.customer?.email) return { skipped: true };

  const formattedStatus = status.replace('_', ' ').toUpperCase();

  const html = `<html><head>${getEmailStyle()}</head><body>
    <div class="container">
      <h1>Hi ${order.customer.name || 'there'}!</h1>
      <p>Your order <strong>${order.orderId}</strong> has been updated.</p>
      <p style="font-size:20px;font-weight:bold;color:#ff5e8a;text-align:center;
         padding:20px;border:2px dashed #ff5e8a;border-radius:8px;">
        STATUS: ${formattedStatus}
      </p>
      <p>Questions? Just reply to this email!</p>
      <div class="footer">Snack Bazaar &mdash; India's Premium Snack Hub &#127871;</div>
    </div>
  </body></html>`;

  return sendEmail({
    to:      [{ email: order.customer.email, name: order.customer.name || 'Customer' }],
    subject: `📦 Order Update: ${order.orderId} — ${formattedStatus}`,
    html,
    tags:    ['status_update'],
  });
};

// ── 4. Test Email ─────────────────────────────────────────────────
const sendTestEmail = async () => {
  console.log('[MAILER] sendTestEmail → FROM:', FROM_EMAIL, '| TO:', ADMIN_EMAIL);
  console.log('[MAILER] BREVO_API_KEY set:', !!process.env.BREVO_API_KEY);

  return sendEmail({
    to:      [{ email: ADMIN_EMAIL, name: 'Snack Bazaar Admin' }],
    subject: '🧪 Snack Bazaar — Brevo Email Test',
    html: `<html><body style="font-family:sans-serif;padding:20px;">
      <h2 style="color:#511b8b;">✅ Brevo Email Working!</h2>
      <p>Brevo REST API is correctly configured on Railway.</p>
      <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
      <p><strong>From:</strong> ${FROM_EMAIL} (${FROM_NAME})</p>
      <p><strong>To:</strong> ${ADMIN_EMAIL}</p>
      <p style="color:#888;font-size:12px;">Snack Bazaar — snacks-bazaar-production.up.railway.app</p>
    </body></html>`,
    tags: ['test'],
  });
};

module.exports = {
  sendOrderConfirmationToCustomer,
  sendNewOrderAlertToAdmin,
  sendStatusUpdateToCustomer,
  sendTestEmail,
};
