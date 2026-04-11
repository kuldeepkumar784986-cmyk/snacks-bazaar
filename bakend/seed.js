// ═══════════════════════════════════════════════════════════════
//  SNACK BAZAAR — Database Seed Script
//  Run once:  npm run seed
//  Populates MongoDB with all products from the shop
// ═══════════════════════════════════════════════════════════════

require('dotenv').config();
const mongoose = require('mongoose');

// ── Product Schema (must match server.js) ──
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

// ═══════════════════════════════════════════════════════════════
//  ALL PRODUCTS — matches shop.html exactly
// ═══════════════════════════════════════════════════════════════

const products = [
  // ──────────── KURKURE ────────────
  {
    productId: 101,
    name: 'Masala Munch Kurkure',
    category: 'kurkure',
    price: 20,
    weight: '82g',
    image: '/images/kurkure_gen.png',
    description: 'The OG crunchy Indian snack — Kurkure Masala Munch with bold masala seasoning.',
    stock: 200,
  },

  // ──────────── LAY'S ────────────
  {
    productId: 102,
    name: "Magic Masala Lay's",
    category: 'lays',
    price: 20,
    weight: '50g',
    image: '/images/lays_magic_masala.png',
    description: "India's favourite Lay's flavour — a magical blend of tangy, spicy, and zesty masala.",
    stock: 200,
  },
  {
    productId: 130,
    name: "Lay's Cream & Onion",
    category: 'lays',
    price: 20,
    weight: '50g',
    image: '/images/lays_cream_onion.png',
    description: 'American Style Cream & Onion with a smooth, creamy flavour.',
    stock: 150,
  },
  {
    productId: 131,
    name: "Lay's Classic Salted",
    category: 'lays',
    price: 20,
    weight: '50g',
    image: '/images/lays_classic_salted.png',
    description: 'The timeless classic — perfectly salted golden potato chips.',
    stock: 150,
  },
  {
    productId: 132,
    name: "Lay's Spanish Tomato Tango",
    category: 'lays',
    price: 20,
    weight: '50g',
    image: '/images/lays_tomato_tango.png',
    description: 'A tangy tomato twist with Spanish-inspired seasoning.',
    stock: 150,
  },
  {
    productId: 133,
    name: "Lay's Hot n Sweet Chilli",
    category: 'lays',
    price: 20,
    weight: '50g',
    image: '/images/lays_hot_chilli.png',
    description: "West Indies inspired Hot 'n' Sweet Chilli — the perfect spice balance.",
    stock: 150,
  },
  {
    productId: 134,
    name: "Lay's Chile Limon",
    category: 'lays',
    price: 20,
    weight: '50g',
    image: '/images/lays_chile_limon.png',
    description: 'Zesty lime meets fiery chili — a refreshing kick in every bite.',
    stock: 150,
  },

  // ──────────── UNCLE CHIPPS ────────────
  {
    productId: 114,
    name: 'Uncle Chipps Spicy Treat',
    category: 'uncle-chipps',
    price: 20,
    weight: '50g',
    image: '/images/uncle_chipps_gen.png',
    description: 'The legendary Uncle Chipps with a spicy Indian twist.',
    stock: 150,
  },
  {
    productId: 115,
    name: 'Uncle Chipps Classic Salted',
    category: 'uncle-chipps',
    price: 20,
    weight: '50g',
    image: '/images/uncle_chipps_classic.png',
    description: 'Simple, salted, and satisfying — the Uncle Chipps you grew up with.',
    stock: 150,
  },
  {
    productId: 116,
    name: 'Uncle Chipps Large Spicy Treat',
    category: 'uncle-chipps',
    price: 40,
    weight: '80g',
    image: '/images/uncle_chipps_large.png',
    description: 'Family-size pack of the beloved spicy treat.',
    stock: 100,
  },

  // ──────────── TOO YUMM! ────────────
  {
    productId: 103,
    name: 'Tomato Blast Too Yumm',
    category: 'too-yumm',
    price: 20,
    weight: '60g',
    image: '/images/too_yumm_gen.png',
    description: 'Baked, not fried! Tangy tomato blast with 40% less fat.',
    stock: 150,
  },

  // ──────────── HALDIRAM'S ────────────
  {
    productId: 104,
    name: 'Aloo Bhujia',
    category: 'haldirams',
    price: 55,
    weight: '200g',
    image: '/images/aloo_bhujia.png',
    description: "Haldiram's classic Aloo Bhujia — crispy potato noodles with Indian spices.",
    stock: 120,
  },

  // ──────────── BALAJI WAFERS ────────────
  {
    productId: 120,
    name: 'Crunchem Masala Masti',
    category: 'balaji',
    price: 20,
    weight: '65g',
    image: '/images/balaji_masala_masti.png',
    description: "Balaji's Crunchem range — bold masala masti flavour.",
    stock: 150,
  },
  {
    productId: 121,
    name: 'Crunches Chilli Tadka',
    category: 'balaji',
    price: 20,
    weight: '65g',
    image: '/images/balaji_chilli_tadka.png',
    description: 'Fiery chilli tadka seasoning on thick-cut crunches.',
    stock: 150,
  },
  {
    productId: 122,
    name: 'Crunchem Chaat Chakra',
    category: 'balaji',
    price: 20,
    weight: '65g',
    image: '/images/balaji_chaat_chakra.png',
    description: 'Street-food inspired chaat masala on crispy wafers.',
    stock: 150,
  },
  {
    productId: 123,
    name: 'Crunched Cream & Onion',
    category: 'balaji',
    price: 20,
    weight: '65g',
    image: '/images/balaji_cream_onion.png',
    description: 'Smooth cream and onion seasoning on Balaji wafers.',
    stock: 150,
  },
  {
    productId: 124,
    name: 'Crunched Peri Peri',
    category: 'balaji',
    price: 10,
    weight: '35g',
    image: '/images/balaji_peri_peri.png',
    description: 'Peri peri heat in a pocket-sized pack.',
    stock: 200,
  },
  {
    productId: 125,
    name: 'Crunched Simply Salted',
    category: 'balaji',
    price: 20,
    weight: '65g',
    image: '/images/balaji_simply_salted.png',
    description: 'Classic salted wafers — simple and addictive.',
    stock: 150,
  },
  {
    productId: 126,
    name: 'Rumbles Pudina Twist',
    category: 'balaji',
    price: 20,
    weight: '65g',
    image: '/images/balaji_pudina_twist.png',
    description: 'Cool pudina (mint) twist with a refreshing crunch.',
    stock: 150,
  },
  {
    productId: 127,
    name: 'Crunched Tomato Twist',
    category: 'balaji',
    price: 20,
    weight: '65g',
    image: '/images/balaji_tomato_twist.png',
    description: 'Tangy tomato seasoning on thick Balaji crunches.',
    stock: 150,
  },

  // ──────────── SOYA CHIPS ────────────
  {
    productId: 105,
    name: 'Masala Soya Chips',
    category: 'soya-chips',
    price: 50,
    weight: '100g',
    image: '/images/soya_chips.png',
    description: 'High-protein soya chips with Indian masala — the healthy crunchy option.',
    stock: 100,
  },

  // ──────────── BISCUITS ────────────
  {
    productId: 106,
    name: 'Parle-G Original',
    category: 'biscuits',
    price: 25,
    weight: '250g',
    image: '/images/parle_g.png',
    description: "India's iconic glucose biscuit — Parle-G since 1939.",
    stock: 200,
  },
  {
    productId: 107,
    name: 'Marie Gold',
    category: 'biscuits',
    price: 45,
    weight: '250g',
    image: '/images/marie_gold.png',
    description: "Britannia Marie Gold — the perfect tea-time companion.",
    stock: 150,
  },
  {
    productId: 108,
    name: 'Good Day Cashew',
    category: 'biscuits',
    price: 40,
    weight: '200g',
    image: '/images/good_day.png',
    description: 'Britannia Good Day with real cashew pieces.',
    stock: 150,
  },
  {
    productId: 109,
    name: 'Hide & Seek',
    category: 'biscuits',
    price: 30,
    weight: '120g',
    image: '/images/hide_seek.png',
    description: 'Parle Hide & Seek — chocolate chip cookies for every mood.',
    stock: 150,
  },
  {
    productId: 110,
    name: 'Bourbon',
    category: 'biscuits',
    price: 30,
    weight: '150g',
    image: '/images/bourbon.png',
    description: 'Britannia Bourbon — chocolate cream sandwiched between cocoa biscuits.',
    stock: 150,
  },
  {
    productId: 111,
    name: 'Dark Fantasy',
    category: 'biscuits',
    price: 30,
    weight: '75g',
    image: '/images/dark_fantasy.png',
    description: 'Sunfeast Dark Fantasy — rich dark chocolate filled cookies.',
    stock: 120,
  },
  {
    productId: 112,
    name: 'Oreo Original',
    category: 'biscuits',
    price: 35,
    weight: '116g',
    image: '/images/oreo.png',
    description: 'Cadbury Oreo — twist, lick, dunk!',
    stock: 150,
  },
  {
    productId: 113,
    name: 'Milk Bikis',
    category: 'biscuits',
    price: 30,
    weight: '150g',
    image: '/images/milk_bikis.png',
    description: 'Britannia Milk Bikis — milky, crunchy, and full of calcium.',
    stock: 150,
  },
];

// ═══════════════════════════════════════════════════════════════
//  SEED FUNCTION
// ═══════════════════════════════════════════════════════════════

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅  Connected to MongoDB');

    // Clear existing products
    await Product.deleteMany({});
    console.log('🗑️   Cleared existing products');

    // Insert all products
    const inserted = await Product.insertMany(products);
    console.log(`🌱  Seeded ${inserted.length} products successfully!`);

    console.log('\n📦  Products by category:');
    const categories = [...new Set(products.map((p) => p.category))];
    for (const cat of categories) {
      const count = products.filter((p) => p.category === cat).length;
      console.log(`   • ${cat}: ${count} products`);
    }

    console.log('\n✅  Seeding complete! You can now start the server with: npm start');
  } catch (err) {
    console.error('❌  Seeding error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
