// ═══════════════════════════════════════════════════════════════
//  SNACK BAZAAR — Express Backend
//  • Full Product CRUD with filters/search
//  • COD Order Flow (Default)
//  • Order management with delivery status & stock auto-restore
//  • Online Payment Blocks (Razorpay & PhonePe) commented for later
// ═══════════════════════════════════════════════════════════════

require('dotenv').config();
const { sendOrderConfirmationToCustomer, sendNewOrderAlertToAdmin, sendStatusUpdateToCustomer, sendTestEmail } = require('./mailer');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'snackbazaar_secret_2026';

const app = express();
const PORT = process.env.PORT || 5001;

// ──────────────────── Middleware ────────────────────
const allowedOrigins = [
  'https://snacks-bazaar.vercel.app',
  'https://snacks-bazaar-5yf07axd4-kuldeep5.vercel.app',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:3000',
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ──────────────────── MongoDB Connection ────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅  MongoDB connected'))
  .catch((err) => {
    console.warn(
      '⚠️   MongoDB not connected:',
      err.message,
      '\n    → Set MONGODB_URI in bakend/.env to enable DB routes.'
    );
  });

// ──────────────────── Mongoose Schemas ────────────────────

// Product Schema
const productSchema = new mongoose.Schema(
  {
    productId: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    category: { type: String, required: true, index: true },
    price: { type: Number, required: true },
    weight: { type: String },
    image: { type: String },
    description: { type: String, default: '' },
    stock: { type: Number, default: 100 },
    isActive: { type: Boolean, default: true },
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text', category: 'text' });
const Product = mongoose.model('Product', productSchema);

// Order Schema
const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true }, // e.g. SB-1001
    amount: { type: Number, required: true },          // in ₹
    currency: { type: String, default: 'INR' },
    paymentMethod: { type: String, default: 'COD' },
    items: [
      {
        productId: Number,
        name: String,
        price: Number,
        qty: Number,
      },
    ],
    customer: {
      name: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      address: { type: String, default: '' },
    },
    deliveryStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'],
      default: 'pending',
    },
    paymentStatus: { type: String, default: 'pending' }, // pending for COD, updated to paid when delivered

    // Optional fields for online payment gateways later
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
  },
  { timestamps: true }
);

const Order = mongoose.model('Order', orderSchema);

// Customer Schema
const customerSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  phone:    { type: String, required: true },
  password: { type: String, required: true },
  savedAddress: {
    line1:   String,
    city:    String,
    state:   String,
    pincode: String,
  },
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
}, { timestamps: true });

const Customer = mongoose.model('Customer', customerSchema);

// Review Schema
const reviewSchema = new mongoose.Schema({
  customerId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  customerName: { type: String, required: true },
  productId:    { type: Number, required: true, index: true },
  rating:       { type: Number, required: true, min: 1, max: 5 },
  comment:      { type: String, default: '' },
}, { timestamps: true });

// One review per customer per product
reviewSchema.index({ customerId: 1, productId: 1 }, { unique: true });
const Review = mongoose.model('Review', reviewSchema);

// Helper: recalculate product average rating
async function recalcAvgRating(productId) {
  const result = await Review.aggregate([
    { $match: { productId: productId } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);
  const avg = result.length ? Math.round(result[0].avg * 10) / 10 : 0;
  const count = result.length ? result[0].count : 0;
  await Product.findOneAndUpdate({ productId }, { averageRating: avg, reviewCount: count });
}

// ── Auth Middleware ───────────────────────────────────────────
function verifyCustomer(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Please login first' });
  try {
    req.customer = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Session expired, please login again' });
  }
}

// Helper to generate unique Order ID (e.g. SB-1001)
async function generateOrderId() {
  const lastOrder = await Order.findOne().sort({ createdAt: -1 });
  if (!lastOrder || !lastOrder.orderId || !lastOrder.orderId.startsWith('SB-')) {
    return 'SB-1001';
  }
  const lastNum = parseInt(lastOrder.orderId.split('-')[1]);
  return `SB-${lastNum + 1}`;
}


// ═══════════════════════════════════════════════════════════════
//  PRODUCT ROUTES
// ═══════════════════════════════════════════════════════════════

// GET /api/products — list with optional filters
app.get('/api/products', async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, sort, page = 1, limit = 50 } = req.query;
    const filter = { isActive: true };

    if (category && category !== 'all') filter.category = category;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (search) filter.$text = { $search: search };

    let sortOption = { productId: 1 };
    if (sort === 'price_asc') sortOption = { price: 1 };
    else if (sort === 'price_desc') sortOption = { price: -1 };
    else if (sort === 'name_asc') sortOption = { name: 1 };
    else if (sort === 'name_desc') sortOption = { name: -1 };
    else if (sort === 'newest') sortOption = { createdAt: -1 };

    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(filter).sort(sortOption).skip(skip).limit(Number(limit)),
      Product.countDocuments(filter),
    ]);

    res.json({
      success: true,
      count: products.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      data: products,
    });
  } catch (err) {
    console.error('GET /api/products error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/products/:id — single product
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findOne({ productId: Number(req.params.id) });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (err) {
    console.error('GET /api/products/:id error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/products — add new product
// GET /api/test-email — Diagnose Resend email config
app.get('/api/test-email', async (req, res) => {
  try {
    console.log('[TEST-EMAIL] Route hit');
    const result = await sendTestEmail();
    res.json({
      success: true,
      message: 'Test email sent! Check kuldeepkumar784986@gmail.com',
      resend_response: result,
      env_check: {
        RESEND_API_KEY_set: !!process.env.RESEND_API_KEY,
        ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'kuldeepkumar784986@gmail.com (fallback)',
        RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev (sandbox fallback)',
      }
    });
  } catch (err) {
    console.error('[TEST-EMAIL] FAILED:', err);
    res.status(500).json({
      success: false,
      error: err.message,
      full_error: JSON.stringify(err, null, 2),
      env_check: {
        RESEND_API_KEY_set: !!process.env.RESEND_API_KEY,
        ADMIN_EMAIL: process.env.ADMIN_EMAIL || '(not set)',
        RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL || '(not set)',
      }
    });
  }
});

// POST /api/products — add new product
app.post('/api/products', async (req, res) => {
  try {
    const { productId, name, category, price, weight, image, description, stock } = req.body;
    if (!productId || !name || !category || price == null) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const existing = await Product.findOne({ productId });
    if (existing) return res.status(409).json({ success: false, message: `Product ${productId} exists` });

    const product = await Product.create({ productId, name, category, price, weight, image, description, stock });
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    console.error('POST /api/products error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/products/:id — update product
app.put('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { productId: Number(req.params.id) },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/products/:id — soft-delete
app.delete('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { productId: Number(req.params.id) },
      { isActive: false },
      { new: true }
    );
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product deleted', data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// ═══════════════════════════════════════════════════════════════
//  ORDER MANAGEMENT ROUTES (COD FLOW)
// ═══════════════════════════════════════════════════════════════

// POST /api/orders — Place COD order
app.post('/api/orders', async (req, res) => {
  try {
    const { amount, items, customer } = req.body;

    if (!amount || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Valid amount and items are required' });
    }

    const orderId = await generateOrderId();

    const order = await Order.create({
      orderId,
      amount,
      items,
      customer: customer || {},
      paymentMethod: 'COD',
      paymentStatus: 'pending',
      deliveryStatus: 'pending',
    });

    // ── Email Logging & Sending ──
    console.log('[ORDER] Saved:', orderId, '| Customer email:', order.customer?.email || '(none)');
    console.log('[ORDER] RESEND_API_KEY set:', !!process.env.RESEND_API_KEY);
    console.log('[ORDER] ADMIN_EMAIL:', process.env.ADMIN_EMAIL || '(not set)');

    try {
      if (order.customer?.email) {
        console.log('[EMAIL] Sending confirmation to customer:', order.customer.email);
        const custResult = await sendOrderConfirmationToCustomer(order);
        console.log('[EMAIL] Customer email result:', JSON.stringify(custResult));
      } else {
        console.warn('[EMAIL] Skipping customer email — no email address provided');
      }

      console.log('[EMAIL] Sending admin alert to:', process.env.ADMIN_EMAIL);
      const adminResult = await sendNewOrderAlertToAdmin(order);
      console.log('[EMAIL] Admin email result:', JSON.stringify(adminResult));
    } catch (emailErr) {
      console.error('[EMAIL] SEND FAILED:', emailErr.message);
      console.error('[EMAIL] Full error:', JSON.stringify(emailErr, null, 2));
    }

    // Reduce stock for each item
    if (items && items.length > 0) {
      const stockUpdates = items.map((item) =>
        Product.findOneAndUpdate(
          { productId: item.productId, stock: { $gte: item.qty } },
          { $inc: { stock: -item.qty } }
        )
      );
      await Promise.all(stockUpdates);
    }

    res.json({
      success: true,
      message: 'Order placed successfully via COD',
      orderId: order.orderId,
      order
    });
  } catch (err) {
    console.error('POST /api/orders error:', err);
    res.status(500).json({ success: false, message: 'Failed to place order' });
  }
});


// GET /api/orders/:id — Track order by number (e.g. SB-1001)
app.get('/api/orders/:id', async (req, res) => {
  try {
    // Try finding by custom orderId first, then fallback to _id
    let order = await Order.findOne({ orderId: req.params.id });
    if (!order && mongoose.Types.ObjectId.isValid(req.params.id)) {
      order = await Order.findById(req.params.id);
    }
    
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (err) {
    console.error('GET /api/orders/:id error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/orders — List all orders
app.get('/api/orders', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.deliveryStatus = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Order.countDocuments(filter),
    ]);

    res.json({
      success: true,
      count: orders.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      data: orders,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/orders/:id/status — Update delivery status (Admin)
app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status` });
    }

    const updatePlayload = { deliveryStatus: status };
    
    // Auto payment update logic: if delivered, set paid.
    if (status === 'delivered') {
      updatePlayload.paymentStatus = 'paid';
    }

    let order = await Order.findOneAndUpdate(
      { orderId: req.params.id },
      { $set: updatePlayload },
      { new: true }
    );

    // Fallback to _id if needed
    if (!order && mongoose.Types.ObjectId.isValid(req.params.id)) {
      order = await Order.findByIdAndUpdate(
        req.params.id,
        { $set: updatePlayload },
        { new: true }
      );
    }

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    try { 
      await sendStatusUpdateToCustomer(order, status); 
    } catch(e) { 
      console.warn('Email error:', e.message); 
    }

    res.json({ success: true, data: order, message: `Order updated to ${status}` });
  } catch (err) {
    console.error('PUT /api/orders/:id/status error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/orders/:id/cancel — Cancel order + restore stock
app.put('/api/orders/:id/cancel', async (req, res) => {
  try {
    let order = await Order.findOne({ orderId: req.params.id });
    if (!order && mongoose.Types.ObjectId.isValid(req.params.id)) {
      order = await Order.findById(req.params.id);
    }

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (order.deliveryStatus === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Order is already cancelled' });
    }

    // Cancel the order
    order.deliveryStatus = 'cancelled';
    await order.save();

    // Restore stock
    if (order.items && order.items.length > 0) {
      const stockUpdates = order.items.map((item) =>
        Product.findOneAndUpdate(
          { productId: item.productId },
          { $inc: { stock: item.qty } }
        )
      );
      await Promise.all(stockUpdates);
    }

    res.json({ success: true, message: 'Order cancelled successfully and stock restored', data: order });
  } catch (err) {
    console.error('PUT /api/orders/:id/cancel error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// ═══════════════════════════════════════════════════════════════
//  ONLINE PAYMENT BLOCKS (Uncomment when needed)
// ═══════════════════════════════════════════════════════════════

/* 
// 1. RAZORPAY BLOCK
const Razorpay = require('razorpay');

function getRazorpay() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in .env');
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

app.get('/api/payment/razorpay/key', (req, res) => {
  res.json({ success: true, key: process.env.RAZORPAY_KEY_ID });
});

app.post('/api/payment/razorpay/create-order', async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ success: false, message: 'Valid amount is required' });

    const razorpay = getRazorpay();
    const options = {
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: \`receipt_\${Date.now()}\`,
    };

    const order = await razorpay.orders.create(options);
    res.json({ success: true, order: { id: order.id, amount: order.amount, currency: order.currency }, key: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Could not create Razorpay order' });
  }
});

app.post('/api/payment/razorpay/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, items, customer } = req.body;
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(body).digest('hex');

    if (expectedSignature !== razorpay_signature) return res.status(400).json({ success: false, message: 'Invalid signature' });

    const orderId = await generateOrderId();
    const order = await Order.create({
      orderId,
      paymentMethod: 'Razorpay',
      paymentStatus: 'paid',
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      amount: amount || 0,
      items: items || [],
      customer: customer || {},
    });

    if (items && items.length > 0) {
      const stockUpdates = items.map((item) => Product.findOneAndUpdate({ productId: item.productId, stock: { $gte: item.qty } }, { $inc: { stock: -item.qty } }));
      await Promise.all(stockUpdates);
    }
    res.json({ success: true, message: 'Payment verified & order saved!', orderId: order.orderId });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
});
*/

/*
// 2. PHONEPE BLOCK (Ready for GST approval)
app.post('/api/payment/phonepe/create-order', async (req, res) => {
  // Logic for PhonePe goes here
  res.json({ success: true, message: 'PhonePe integration ready' });
});
*/

// ═══════════════════════════════════════════════════════════════
//  CUSTOMER AUTH ROUTES
// ═══════════════════════════════════════════════════════════════

// ── REGISTER ─────────────────────────────────────────────────
app.post('/api/customers/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    const exists = await Customer.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: 'Email already registered. Please login.' });
    const hashed  = await bcrypt.hash(password, 10);
    const customer = await Customer.create({ name, email, phone, password: hashed });
    const token = jwt.sign({ id: customer._id, email: customer.email, name: customer.name }, JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({ success: true, token, customer: { id: customer._id, name: customer.name, email: customer.email, phone: customer.phone } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── LOGIN ─────────────────────────────────────────────────────
app.post('/api/customers/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const customer = await Customer.findOne({ email });
    if (!customer) return res.status(400).json({ success: false, message: 'No account found with this email.' });
    const match = await bcrypt.compare(password, customer.password);
    if (!match) return res.status(400).json({ success: false, message: 'Wrong password. Try again.' });
    const token = jwt.sign({ id: customer._id, email: customer.email, name: customer.name }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ success: true, token, customer: { id: customer._id, name: customer.name, email: customer.email, phone: customer.phone, savedAddress: customer.savedAddress } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── GET PROFILE ───────────────────────────────────────────────
app.get('/api/customers/profile', verifyCustomer, async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer.id).select('-password').populate('wishlist', 'name price images discountPrice');
    res.json({ success: true, customer });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── UPDATE PROFILE ────────────────────────────────────────────
app.put('/api/customers/profile', verifyCustomer, async (req, res) => {
  try {
    const { name, phone } = req.body;
    const customer = await Customer.findByIdAndUpdate(req.customer.id, { name, phone }, { new: true }).select('-password');
    res.json({ success: true, customer });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── SAVE ADDRESS ──────────────────────────────────────────────
app.put('/api/customers/address', verifyCustomer, async (req, res) => {
  try {
    const { line1, city, state, pincode } = req.body;
    const customer = await Customer.findByIdAndUpdate(req.customer.id, { savedAddress: { line1, city, state, pincode } }, { new: true }).select('-password');
    res.json({ success: true, message: 'Address saved!', customer });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── GET MY ORDERS ─────────────────────────────────────────────
app.get('/api/customers/my-orders', verifyCustomer, async (req, res) => {
  try {
    const orders = await Order.find({ 'customer.email': req.customer.email }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── WISHLIST: ADD/REMOVE ──────────────────────────────────────
app.post('/api/customers/wishlist/:productId', verifyCustomer, async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer.id);
    const pid = req.params.productId;
    const idx = customer.wishlist.map(String).indexOf(pid);
    if (idx > -1) customer.wishlist.splice(idx, 1);
    else customer.wishlist.push(pid);
    await customer.save();
    res.json({ success: true, wishlist: customer.wishlist, action: idx > -1 ? 'removed' : 'added' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── GET WISHLIST ──────────────────────────────────────────────
app.get('/api/customers/wishlist', verifyCustomer, async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer.id).populate('wishlist', 'name price discountPrice images category');
    res.json({ success: true, wishlist: customer.wishlist });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── CHANGE PASSWORD ───────────────────────────────────────────
app.put('/api/customers/change-password', verifyCustomer, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const customer = await Customer.findById(req.customer.id);
    const match = await bcrypt.compare(currentPassword, customer.password);
    if (!match) return res.status(400).json({ success: false, message: 'Current password is wrong' });
    customer.password = await bcrypt.hash(newPassword, 10);
    await customer.save();
    res.json({ success: true, message: 'Password changed successfully!' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});


// ═══════════════════════════════════════════════════════════════
//  REVIEW ROUTES
// ═══════════════════════════════════════════════════════════════

// POST /api/products/:id/reviews — add review (auth required)
app.post('/api/products/:id/reviews', verifyCustomer, async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const product = await Product.findOne({ productId });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    // Check if already reviewed
    const existing = await Review.findOne({ customerId: req.customer.id, productId });
    if (existing) {
      // Update existing review
      existing.rating = rating;
      existing.comment = comment || '';
      existing.customerName = req.customer.name;
      await existing.save();
      await recalcAvgRating(productId);
      return res.json({ success: true, message: 'Review updated!', review: existing });
    }

    const review = await Review.create({
      customerId: req.customer.id,
      customerName: req.customer.name,
      productId,
      rating,
      comment: comment || '',
    });

    await recalcAvgRating(productId);
    res.status(201).json({ success: true, message: 'Review added!', review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/products/:id/reviews — get all reviews for a product
app.get('/api/products/:id/reviews', async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const reviews = await Review.find({ productId }).sort({ createdAt: -1 });
    
    // Also return the product's aggregate rating
    const product = await Product.findOne({ productId }).select('averageRating reviewCount');
    
    res.json({
      success: true,
      averageRating: product?.averageRating || 0,
      reviewCount: product?.reviewCount || 0,
      reviews,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/reviews/:id — delete review (admin use)
app.delete('/api/reviews/:id', async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    await recalcAvgRating(review.productId);
    res.json({ success: true, message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// ──────────────────── Health Check ────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '🚀 Snack Bazaar API is running (COD Flow Active)!',
    timestamp: new Date().toISOString(),
  });
});

// ──────────────────── Start Server ────────────────────
app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════╗
  ║   🍿 Snack Bazaar API                    ║
  ║   Running on http://localhost:${PORT}        ║
  ║   Health: http://localhost:${PORT}/api/health ║
  ╚═══════════════════════════════════════════╝
  `);
});
