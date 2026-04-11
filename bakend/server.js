// ═══════════════════════════════════════════════════════════════
//  SNACK BAZAAR — Express Backend
//  • Full Product CRUD with filters/search
//  • COD Order Flow (Default)
//  • Order management with delivery status & stock auto-restore
//  • Online Payment Blocks (Razorpay & PhonePe) commented for later
// ═══════════════════════════════════════════════════════════════

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 5001;

// ──────────────────── Middleware ────────────────────
app.use(cors());
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
