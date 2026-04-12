const { Resend } = require('resend');

// Validate API key on startup
if (!process.env.RESEND_API_KEY) {
  console.error('[MAILER] WARNING: RESEND_API_KEY is not set! Emails will fail.');
}

const resend = new Resend(process.env.RESEND_API_KEY);

// ── Sender address ───────────────────────────────────────────────
// In Resend sandbox (free tier), you can ONLY send FROM onboarding@resend.dev
// and ONLY TO your verified email. To send to any address, you must verify
// a domain in Resend dashboard and set RESEND_FROM_EMAIL in Railway.
const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL || 'Snack Bazaar <onboarding@resend.dev>';
const ADMIN_EMAIL  = process.env.ADMIN_EMAIL || 'kuldeepkumar784986@gmail.com';

// ── Email styling ─────────────────────────────────────────────────
const getEmailStyle = () => `
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background:#f4f6f8; padding:20px; margin:0; }
    .container { max-width:600px; margin:0 auto; background:#ffffff; padding:30px; border-radius:12px; border:1px solid #eeeeee; }
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
  let rows = items.map(item =>
    `<tr><td>${item.name}</td><td>${item.qty}</td><td>₹${item.price}</td></tr>`
  ).join('');
  return `
    <table class="order-details">
      <tr><th>Item</th><th>Qty</th><th>Price</th></tr>
      ${rows}
      <tr class="total-row"><td colspan="2">Total</td><td>₹${totalAmount}</td></tr>
    </table>`;
};

// ── 1. Order Confirmation → Customer ─────────────────────────────
const sendOrderConfirmationToCustomer = async (order) => {
  if (!order.customer?.email) {
    console.warn('[MAILER] sendOrderConfirmationToCustomer: no customer email, skipping');
    return { skipped: true, reason: 'no_email' };
  }

  const html = `<html><head>${getEmailStyle()}</head><body>
    <div class="container">
      <h1>🎉 Order Confirmed, ${order.customer.name || 'Snack Lover'}!</h1>
      <p>Your order <strong>${order.orderId}</strong> has been received and is being packed.</p>
      <p>Payment: <span class="badge">${order.paymentMethod}</span></p>
      <h2>Your Items</h2>
      ${getItemsHtml(order.items, order.amount)}
      <h2>Delivery To</h2>
      <p>${order.customer.address || 'N/A'}</p>
      <p>Questions? Reply to this email anytime!</p>
      <div class="footer">Snack Bazaar &mdash; India's Premium Snack Hub 🍿</div>
    </div>
  </body></html>`;

  const result = await resend.emails.send({
    from: FROM_ADDRESS,
    to:   [order.customer.email],
    subject: `✅ Order Confirmed: ${order.orderId} — Snack Bazaar`,
    html,
  });

  console.log('[MAILER] Customer email sent:', JSON.stringify(result));
  return result;
};

// ── 2. New Order Alert → Admin ───────────────────────────────────
const sendNewOrderAlertToAdmin = async (order) => {
  const to = ADMIN_EMAIL;
  if (!to) {
    console.warn('[MAILER] sendNewOrderAlertToAdmin: ADMIN_EMAIL not set, skipping');
    return { skipped: true, reason: 'no_admin_email' };
  }

  const html = `<html><head>${getEmailStyle()}</head><body>
    <div class="container">
      <h1>💥 New Order: ${order.orderId}</h1>
      <p>Payment via <strong>${order.paymentMethod}</strong></p>
      <h2>Customer</h2>
      <p>
        <strong>Name:</strong> ${order.customer?.name || 'N/A'}<br>
        <strong>Email:</strong> ${order.customer?.email || 'N/A'}<br>
        <strong>Phone:</strong> ${order.customer?.phone || 'N/A'}<br>
        <strong>Address:</strong> ${order.customer?.address || 'N/A'}
      </p>
      <h2>Items</h2>
      ${getItemsHtml(order.items, order.amount)}
      <div class="footer">Snack Bazaar Admin Alert</div>
    </div>
  </body></html>`;

  const result = await resend.emails.send({
    from: FROM_ADDRESS,
    to:   [to],
    subject: `💥 NEW ORDER: ${order.orderId} — ₹${order.amount}`,
    html,
  });

  console.log('[MAILER] Admin email sent:', JSON.stringify(result));
  return result;
};

// ── 3. Status Update → Customer ──────────────────────────────────
const sendStatusUpdateToCustomer = async (order, status) => {
  if (!order.customer?.email) return { skipped: true, reason: 'no_email' };

  const formattedStatus = status.replace('_', ' ').toUpperCase();

  const html = `<html><head>${getEmailStyle()}</head><body>
    <div class="container">
      <h1>Hi ${order.customer.name || 'there'}!</h1>
      <p>Your order <strong>${order.orderId}</strong> has been updated.</p>
      <p style="font-size:20px;font-weight:bold;color:#ff5e8a;text-align:center;
         padding:20px;border:2px dashed #ff5e8a;border-radius:8px;">
        STATUS: ${formattedStatus}
      </p>
      <p>Questions? Reply to this email.</p>
      <div class="footer">Snack Bazaar &mdash; India's Premium Snack Hub 🍿</div>
    </div>
  </body></html>`;

  const result = await resend.emails.send({
    from: FROM_ADDRESS,
    to:   [order.customer.email],
    subject: `📦 Order Update: ${order.orderId} — ${formattedStatus}`,
    html,
  });

  console.log('[MAILER] Status update email sent:', JSON.stringify(result));
  return result;
};

// ── 4. Test Email (for /api/test-email route) ─────────────────────
const sendTestEmail = async () => {
  const to = ADMIN_EMAIL;
  console.log('[MAILER] sendTestEmail → FROM:', FROM_ADDRESS, '| TO:', to);
  console.log('[MAILER] RESEND_API_KEY set:', !!process.env.RESEND_API_KEY);

  const result = await resend.emails.send({
    from: FROM_ADDRESS,
    to:   [to],
    subject: '🧪 Snack Bazaar — Email System Test',
    html: `<html><body style="font-family:sans-serif;padding:20px;">
      <h2 style="color:#511b8b;">✅ Email System Working!</h2>
      <p>If you received this, Resend is correctly configured on Railway.</p>
      <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
      <p><strong>From:</strong> ${FROM_ADDRESS}</p>
      <p><strong>To:</strong> ${to}</p>
      <p style="color:#888;font-size:12px;">Snack Bazaar — snacks-bazaar-production.up.railway.app</p>
    </body></html>`,
  });

  console.log('[MAILER] Test email result:', JSON.stringify(result));
  return result;
};

module.exports = {
  sendOrderConfirmationToCustomer,
  sendNewOrderAlertToAdmin,
  sendStatusUpdateToCustomer,
  sendTestEmail,
};
