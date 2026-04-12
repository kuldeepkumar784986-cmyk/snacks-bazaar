const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', // Assuming gmail based on the email provided
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Common styling for emails
const getEmailStyle = () => `
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f6f8; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 12px; border: 1px solid #eeeeee; }
    h1 { color: #511b8b; font-size: 24px; margin-bottom: 20px; }
    h2 { color: #333333; font-size: 18px; margin-top: 30px; border-bottom: 2px solid #511b8b; padding-bottom: 10px; }
    p { color: #555555; line-height: 1.6; font-size: 16px; }
    .order-details { width: 100%; border-collapse: collapse; margin-top: 20px; }
    .order-details th { text-align: left; padding: 12px; background-color: #fafafa; color: #888; font-size: 12px; text-transform: uppercase; border-bottom: 2px solid #eeeeee; }
    .order-details td { padding: 12px; border-bottom: 1px solid #eeeeee; color: #333; }
    .total-row { font-weight: bold; font-size: 18px; color: #511b8b; }
    .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #aaaaaa; }
  </style>
`;

// Helper to generate items HTML
const getItemsHtml = (items, totalAmount) => {
  let itemsHtml = `
    <table class="order-details">
      <tr><th>Item</th><th>Qty</th><th>Price</th></tr>
  `;
  items.forEach(item => {
    itemsHtml += `<tr><td>${item.name}</td><td>${item.qty}</td><td>₹${item.price}</td></tr>`;
  });
  itemsHtml += `<tr class="total-row"><td colspan="2">Total</td><td>₹${totalAmount}</td></tr></table>`;
  return itemsHtml;
};

// 1. Order Confirmation to Customer
const sendOrderConfirmationToCustomer = async (order) => {
  if (!order.customer || !order.customer.email) return;

  const mailOptions = {
    from: `"Snack Bazaar" <${process.env.EMAIL_USER}>`,
    to: order.customer.email,
    subject: `Order Confirmation - ${order.orderId}`,
    html: `
      <html>
        <head>${getEmailStyle()}</head>
        <body>
          <div class="container">
            <h1>Thank you for your order, ${order.customer.name || 'Snack Lover'}!</h1>
            <p>We've received your order <strong>${order.orderId}</strong> and are getting it ready for shipment. You chose <strong>${order.paymentMethod}</strong>.</p>
            <h2>Order Details</h2>
            ${getItemsHtml(order.items, order.amount)}
            <h2>Delivery Address</h2>
            <p>${order.customer.address || 'N/A'}</p>
            <p>If you have any questions, simply reply to this email!</p>
            <div class="footer">Snack Bazaar | India's Premium Snack Store</div>
          </div>
        </body>
      </html>
    `
  };
  return transporter.sendMail(mailOptions);
};

// 2. New Order Alert to Admin
const sendNewOrderAlertToAdmin = async (order) => {
  if (!process.env.ADMIN_EMAIL) return;

  const mailOptions = {
    from: `"Snack Bazaar Node" <${process.env.EMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL,
    subject: `💥 NEW ORDER RECEIVED: ${order.orderId}`,
    html: `
      <html>
        <head>${getEmailStyle()}</head>
        <body>
          <div class="container">
            <h1>New Order Alert!</h1>
            <p>A new order was just placed via <strong>${order.paymentMethod}</strong>.</p>
            <h2>Customer Details</h2>
            <p><strong>Name:</strong> ${order.customer.name || 'N/A'}<br>
            <strong>Email:</strong> ${order.customer.email || 'N/A'}<br>
            <strong>Phone:</strong> ${order.customer.phone || 'N/A'}<br>
            <strong>Address:</strong> ${order.customer.address || 'N/A'}</p>
            <h2>Order Items</h2>
            ${getItemsHtml(order.items, order.amount)}
          </div>
        </body>
      </html>
    `
  };
  return transporter.sendMail(mailOptions);
};

// 3. Status Update to Customer
const sendStatusUpdateToCustomer = async (order, status) => {
  if (!order.customer || !order.customer.email) return;
  
  // Format the status string visually
  const formattedStatus = status.replace('_', ' ').toUpperCase();

  const mailOptions = {
    from: `"Snack Bazaar Delivery" <${process.env.EMAIL_USER}>`,
    to: order.customer.email,
    subject: `Update on your order: ${order.orderId}`,
    html: `
      <html>
        <head>${getEmailStyle()}</head>
        <body>
          <div class="container">
            <h1>Hi ${order.customer.name || 'there'}!</h1>
            <p>Your order <strong>${order.orderId}</strong> has a new tracking update.</p>
            <p style="font-size: 20px; font-weight: bold; color: #ff5e8a; text-align: center; padding: 20px; border: 2px dashed #ff5e8a; border-radius: 8px;">
              STATUS: ${formattedStatus}
            </p>
            <p>If you have any questions about this update, simply reply to this email!</p>
            <div class="footer">Snack Bazaar | India's Premium Snack Store</div>
          </div>
        </body>
      </html>
    `
  };
  return transporter.sendMail(mailOptions);
};

module.exports = {
  sendOrderConfirmationToCustomer,
  sendNewOrderAlertToAdmin,
  sendStatusUpdateToCustomer
};
