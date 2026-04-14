// ═══════════════════════════════════════════════════════════════
//  SNACK BAZAAR — Database Seed Script
//  Run:  node seed.js   (or: npm run seed)
//  Smart upsert — inserts new products, updates existing ones,
//  preserves stock, averageRating, and reviewCount.
// ═══════════════════════════════════════════════════════════════

require('dotenv').config();
const mongoose = require('mongoose');

// ── Product Schema (must match server.js) ──
const productSchema = new mongoose.Schema(
  {
    productId:     { type: Number, required: true, unique: true },
    name:          { type: String, required: true },
    category:      { type: String, required: true, index: true },
    price:         { type: Number, required: true },
    weight:        { type: String },
    image:         { type: String },
    description:   { type: String, default: '' },
    stock:         { type: Number, default: 100 },
    isActive:      { type: Boolean, default: true },
    averageRating: { type: Number, default: 0 },
    reviewCount:   { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text', category: 'text' });
const Product = mongoose.model('Product', productSchema);

// ═══════════════════════════════════════════════════════════════
//  ALL PRODUCTS (60 total across 9 categories)
// ═══════════════════════════════════════════════════════════════

const products = [

  // ─────────────────────── KURKURE (4) ───────────────────────
  {
    productId: 101, name: 'Masala Munch Kurkure', category: 'kurkure',
    price: 20, weight: '82g', image: '/images/kurkure_gen.png',
    description: "The OG crunchy Indian snack — Kurkure Masala Munch with bold masala seasoning. Impossible to eat just one.",
    stock: 200,
  },
  {
    productId: 201, name: 'Kurkure Green Chutney Rajasthani Style', category: 'kurkure',
    price: 20, weight: '82g', image: '/images/kurkure_green_chutney.png',
    description: "Tangy green chutney flavour inspired by Rajasthan street food. Boldly different, brilliantly crunchy.",
    stock: 100,
  },
  {
    productId: 202, name: 'Kurkure Naughty Tomato', category: 'kurkure',
    price: 20, weight: '82g', image: '/images/kurkure_naughty_tomato.png',
    description: 'A naughty twist of tangy tomato with a kick of spice. Every crunch is an adventure.',
    stock: 100,
  },
  {
    productId: 203, name: 'Kurkure Chilli Chatka', category: 'kurkure',
    price: 25, weight: '100g', image: '/images/kurkure_chilli_chatka.png',
    description: 'Red chilli chatka takes Kurkure to the next level of spice and crunch. Handle with care.',
    stock: 100,
  },

  // ─────────────────────── LAY'S (6) ───────────────────────
  {
    productId: 102, name: "Magic Masala Lay's", category: 'lays',
    price: 20, weight: '50g', image: '/images/lays_magic_masala.png',
    description: "India's favourite Lay's flavour — a magical blend of tangy, spicy, and zesty masala.",
    stock: 200,
  },
  {
    productId: 130, name: "Lay's Cream & Onion", category: 'lays',
    price: 20, weight: '50g', image: '/images/lays_cream_onion.png',
    description: 'American Style Cream & Onion with a smooth, creamy flavour on thin, crispy chips.',
    stock: 150,
  },
  {
    productId: 131, name: "Lay's Classic Salted", category: 'lays',
    price: 20, weight: '50g', image: '/images/lays_classic_salted.png',
    description: 'The timeless classic — perfectly salted golden potato chips. Pure and simple joy.',
    stock: 150,
  },
  {
    productId: 132, name: "Lay's Spanish Tomato Tango", category: 'lays',
    price: 20, weight: '50g', image: '/images/lays_tomato_tango.png',
    description: 'A tangy tomato twist with Spanish-inspired seasoning. Ole!',
    stock: 150,
  },
  {
    productId: 133, name: "Lay's Hot n Sweet Chilli", category: 'lays',
    price: 20, weight: '50g', image: '/images/lays_hot_chilli.png',
    description: "West Indies inspired Hot 'n' Sweet Chilli — the perfect spice-sweet balance.",
    stock: 150,
  },
  {
    productId: 134, name: "Lay's Chile Limon", category: 'lays',
    price: 20, weight: '50g', image: '/images/lays_chile_limon.png',
    description: 'Zesty lime meets fiery chili — a refreshing kick in every golden bite.',
    stock: 150,
  },

  // ─────────────────────── BINGO (3) ───────────────────────
  {
    productId: 204, name: 'Bingo Mad Angles Achaari Masti', category: 'bingo',
    price: 20, weight: '65g', image: '/images/bingo_mad_angles.png',
    description: 'Triangular chips with a tangy achaari (pickle) flavour — totally addictive and utterly Mad!',
    stock: 100,
  },
  {
    productId: 205, name: 'Bingo Tedhe Medhe Masala', category: 'bingo',
    price: 20, weight: '60g', image: '/images/bingo_tedhe_medhe.png',
    description: 'Quirky twisted shapes packed with bold masala flavour. Every piece is a crunchy surprise.',
    stock: 100,
  },
  {
    productId: 206, name: 'Bingo Original Style Salty', category: 'bingo',
    price: 20, weight: '60g', image: '/images/bingo_original_salty.png',
    description: 'Classic ridge-cut potato chips with just the right amount of sea salt.',
    stock: 100,
  },

  // ─────────────────────── UNCLE CHIPPS (3) ───────────────────────
  {
    productId: 114, name: 'Uncle Chipps Spicy Treat', category: 'uncle-chipps',
    price: 20, weight: '50g', image: '/images/uncle_chipps_gen.png',
    description: 'The legendary Uncle Chipps with a spicy Indian twist. A nostalgic crunch in every bite.',
    stock: 150,
  },
  {
    productId: 115, name: 'Uncle Chipps Classic Salted', category: 'uncle-chipps',
    price: 20, weight: '50g', image: '/images/uncle_chipps_classic.png',
    description: 'Simple, salted, and satisfying — the Uncle Chipps you grew up with.',
    stock: 150,
  },
  {
    productId: 116, name: 'Uncle Chipps Large Spicy Treat', category: 'uncle-chipps',
    price: 40, weight: '80g', image: '/images/uncle_chipps_large.png',
    description: 'Family-size pack of the beloved spicy treat. Share (or not — we understand).',
    stock: 100,
  },

  // ─────────────────────── NAMKEEN (7) ───────────────────────
  {
    productId: 104, name: "Haldiram's Aloo Bhujia", category: 'namkeen',
    price: 55, weight: '200g', image: '/images/aloo_bhujia.png',
    description: "Haldiram's classic Aloo Bhujia — crispy potato noodles seasoned with authentic Indian spices.",
    stock: 120,
  },
  {
    productId: 207, name: "Haldiram's Moong Dal", category: 'namkeen',
    price: 50, weight: '200g', image: '/images/haldirams_moong_dal.png',
    description: "Crunchy fried moong dal seasoned with cumin, black pepper, and dried mango powder. A tea-time classic.",
    stock: 100,
  },
  {
    productId: 208, name: "Haldiram's Khatta Meetha", category: 'namkeen',
    price: 55, weight: '200g', image: '/images/haldirams_khatta_meetha.png',
    description: "A sweet and tangy mix of sev, peanuts, and fried peas — India's ultimate party namkeen.",
    stock: 100,
  },
  {
    productId: 209, name: "Bikaji Bhujiyas", category: 'namkeen',
    price: 50, weight: '200g', image: '/images/bikaji_bhujiyas.png',
    description: "Bikaji's crispy gram flour sev with a perfect blend of authentic Rajasthani spices.",
    stock: 100,
  },
  {
    productId: 210, name: "Bikaji Chana Dal", category: 'namkeen',
    price: 45, weight: '150g', image: '/images/bikaji_chana_dal.png',
    description: 'Fried chana dal with light seasoning — high protein, maximum crunch, pure satisfaction.',
    stock: 100,
  },
  {
    productId: 211, name: "Balaji Gathiya", category: 'namkeen',
    price: 35, weight: '150g', image: '/images/balaji_gathiya.png',
    description: "Gujarat's favourite crispy gram flour gathiya — lightly spiced and incredibly moreish.",
    stock: 100,
  },
  {
    productId: 232, name: "Haldiram's Bhujia Sev", category: 'namkeen',
    price: 60, weight: '200g', image: '/images/haldirams_bhujia_sev.png',
    description: "Ultra-thin, crispy gram flour sev with a bold spice blend. The snacking essential of every Indian home.",
    stock: 100,
  },

  // ─────────────────────── HEALTHY SNACKS (6) ───────────────────────
  {
    productId: 212, name: 'Lotus Seeds Makhana (Classic Salted)', category: 'healthy',
    price: 80, weight: '100g', image: '/images/makhana_classic.png',
    description: 'Air-roasted lotus seeds — a Bollywood-approved superfood snack. Low calorie, high protein, 100% gluten-free.',
    stock: 100,
  },
  {
    productId: 213, name: 'Makhana Peri Peri', category: 'healthy',
    price: 85, weight: '100g', image: '/images/makhana_peri_peri.png',
    description: 'Spicy peri peri seasoned lotus seeds — guilt-free snacking with a fiery, unforgettable twist.',
    stock: 100,
  },
  {
    productId: 214, name: 'Roasted Chana Masala', category: 'healthy',
    price: 60, weight: '200g', image: '/images/roasted_chana.png',
    description: 'High-protein oven-roasted chickpeas with Indian chat masala seasoning. A powerhouse snack.',
    stock: 100,
  },
  {
    productId: 215, name: 'Quinoa Puffs Italian Herbs', category: 'healthy',
    price: 95, weight: '80g', image: '/images/quinoa_puffs.png',
    description: 'Light, airy quinoa puffs infused with Italian herbs — a wholesome, sophisticated snack.',
    stock: 100,
  },
  {
    productId: 103, name: 'Tomato Blast Too Yumm', category: 'healthy',
    price: 20, weight: '60g', image: '/images/too_yumm_gen.png',
    description: 'Baked, not fried! Tangy tomato blast with 40% less fat. Guilt-free snacking done right.',
    stock: 150,
  },
  {
    productId: 105, name: 'Masala Soya Chips', category: 'healthy',
    price: 50, weight: '100g', image: '/images/soya_chips.png',
    description: 'High-protein soya chips with Indian masala — the smart, crunchy choice for health-conscious snackers.',
    stock: 100,
  },

  // ─────────────────────── POPCORN & PUFFS (4) ───────────────────────
  {
    productId: 216, name: 'Act II Butter Popcorn', category: 'popcorn',
    price: 30, weight: '60g', image: '/images/actii_butter.png',
    description: "India's #1 popcorn brand — movie-theatre style buttery popcorn ready in minutes. Microwave magic.",
    stock: 100,
  },
  {
    productId: 217, name: 'Act II Tangy Masala Popcorn', category: 'popcorn',
    price: 30, weight: '60g', image: '/images/actii_masala.png',
    description: 'Tangy masala seasoned microwave popcorn for the bold Indian snacker.',
    stock: 100,
  },
  {
    productId: 218, name: 'Yellow Diamond Chings Popcorn', category: 'popcorn',
    price: 20, weight: '55g', image: '/images/yellow_diamond_popcorn.png',
    description: "Yellow Diamond's ready-to-eat popcorn with a light, crispy texture and bold seasoning.",
    stock: 100,
  },
  {
    productId: 219, name: 'Yellow Diamond Masala Rings', category: 'popcorn',
    price: 20, weight: '60g', image: '/images/yellow_diamond_rings.png',
    description: 'Crunchy corn ring puffs with a zingy Indian masala coating. Irresistible at any time of day.',
    stock: 100,
  },

  // ─────────────────────── DRY FRUITS & NUTS (5) ───────────────────────
  {
    productId: 220, name: 'Roasted & Salted Cashews', category: 'dry-fruits',
    price: 180, weight: '200g', image: '/images/cashews.png',
    description: 'Premium whole cashews roasted to perfection with a light sea salt coating. Rich, creamy, and satisfying.',
    stock: 100,
  },
  {
    productId: 221, name: 'Honey Roasted Almonds', category: 'dry-fruits',
    price: 160, weight: '200g', image: '/images/almonds.png',
    description: 'Crunchy almonds glazed with pure natural honey for a sweet, nutty treat. Packed with Vitamin E.',
    stock: 100,
  },
  {
    productId: 222, name: 'Roasted Pistachios (Salted)', category: 'dry-fruits',
    price: 250, weight: '200g', image: '/images/pistachios.png',
    description: 'Premium pistachios roasted and lightly salted — a protein-rich gourmet snack worth every rupee.',
    stock: 100,
  },
  {
    productId: 223, name: 'Mixed Nuts Trail Mix', category: 'dry-fruits',
    price: 200, weight: '250g', image: '/images/trail_mix.png',
    description: 'A premium blend of cashews, almonds, raisins, and dried cranberries. Perfect for on-the-go energy.',
    stock: 100,
  },
  {
    productId: 224, name: 'Walnuts Halves & Pieces', category: 'dry-fruits',
    price: 220, weight: '200g', image: '/images/walnuts.png',
    description: 'Premium California walnuts — rich in Omega-3 and antioxidants. Great for brain health and snacking.',
    stock: 100,
  },

  // ─────────────────────── SWEETS & MITHAI (4) ───────────────────────
  {
    productId: 225, name: "Haldiram's Soan Papdi", category: 'sweets',
    price: 120, weight: '400g', image: '/images/soan_papdi.png',
    description: "Haldiram's iconic flaky, melt-in-your-mouth soan papdi garnished with cardamom and pistachios.",
    stock: 100,
  },
  {
    productId: 226, name: "Bikaji Kaju Katli", category: 'sweets',
    price: 250, weight: '250g', image: '/images/kaju_katli.png',
    description: 'Diamond-shaped cashew fudge — a festive Indian sweet made with 100% pure cashews and sugar.',
    stock: 100,
  },
  {
    productId: 227, name: "Haldiram's Besan Ladoo", category: 'sweets',
    price: 150, weight: '250g', image: '/images/besan_ladoo.png',
    description: 'Traditional gram flour ladoos made with pure desi ghee, sugar, and fragrant green cardamom.',
    stock: 100,
  },
  {
    productId: 228, name: "Bikaji Gulab Jamun (Tin)", category: 'sweets',
    price: 90, weight: '500g', image: '/images/gulab_jamun.png',
    description: 'Soft, spongy gulab jamuns soaked in rose-flavoured sugar syrup. Ready-to-eat festive indulgence.',
    stock: 100,
  },

  // ─────────────────────── BISCUITS (11) ───────────────────────
  {
    productId: 106, name: 'Parle-G Original', category: 'biscuits',
    price: 25, weight: '250g', image: '/images/parle_g.png',
    description: "India's most iconic glucose biscuit — Parle-G. Trusted since 1939 by billions of Indians.",
    stock: 200,
  },
  {
    productId: 107, name: 'Marie Gold', category: 'biscuits',
    price: 45, weight: '250g', image: '/images/marie_gold.png',
    description: "Britannia Marie Gold — the perfect light, crunchy tea-time companion since the 1960s.",
    stock: 150,
  },
  {
    productId: 108, name: 'Good Day Cashew', category: 'biscuits',
    price: 40, weight: '200g', image: '/images/good_day.png',
    description: 'Britannia Good Day with real cashew pieces baked into every rich, buttery biscuit.',
    stock: 150,
  },
  {
    productId: 109, name: 'Hide & Seek', category: 'biscuits',
    price: 30, weight: '120g', image: '/images/hide_seek.png',
    description: "Parle Hide & Seek — premium chocolate chip cookies. India's favourite cookie for every mood.",
    stock: 150,
  },
  {
    productId: 110, name: 'Bourbon', category: 'biscuits',
    price: 30, weight: '150g', image: '/images/bourbon.png',
    description: 'Britannia Bourbon — rich chocolate cream sandwiched between two dark cocoa biscuits.',
    stock: 150,
  },
  {
    productId: 111, name: 'Dark Fantasy Choco Fills', category: 'biscuits',
    price: 30, weight: '75g', image: '/images/dark_fantasy.png',
    description: 'Sunfeast Dark Fantasy — indulgent dark chocolate filled cookies for your midnight craving.',
    stock: 120,
  },
  {
    productId: 112, name: 'Oreo Original', category: 'biscuits',
    price: 35, weight: '116g', image: '/images/oreo.png',
    description: "Cadbury Oreo — twist, lick, dunk! The world's #1 cookie, now with Indian-loved flavours.",
    stock: 150,
  },
  {
    productId: 113, name: 'Milk Bikis', category: 'biscuits',
    price: 30, weight: '150g', image: '/images/milk_bikis.png',
    description: 'Britannia Milk Bikis — milky, crunchy, and full of calcium. Great for kids and grown-ups alike.',
    stock: 150,
  },
  {
    productId: 229, name: "McVitie's Digestive Original", category: 'biscuits',
    price: 85, weight: '250g', image: '/images/mcvities_digestive.png',
    description: "McVitie's iconic wholegrain digestive biscuit — the perfect pairing with tea, coffee, or cheese.",
    stock: 100,
  },
  {
    productId: 230, name: "McVitie's Chocolate Digestive", category: 'biscuits',
    price: 90, weight: '250g', image: '/images/mcvities_chocolate.png',
    description: "McVitie's digestive biscuit half-coated in real milk chocolate. A British classic now loved across India.",
    stock: 100,
  },
  {
    productId: 231, name: "Parle Monaco Classic", category: 'biscuits',
    price: 20, weight: '200g', image: '/images/parle_monaco.png',
    description: 'Light, thin, crunchy crackers with a hint of salt — the perfect anytime-anywhere snack.',
    stock: 100,
  },

  // ─────────────────────── BALAJI WAFERS (8) ───────────────────────
  {
    productId: 120, name: 'Crunchem Masala Masti', category: 'balaji',
    price: 20, weight: '65g', image: '/images/balaji_masala_masti.png',
    description: "Balaji's Crunchem range — bold masala masti flavour on thick-cut wafers.",
    stock: 150,
  },
  {
    productId: 121, name: 'Crunches Chilli Tadka', category: 'balaji',
    price: 20, weight: '65g', image: '/images/balaji_chilli_tadka.png',
    description: 'Fiery chilli tadka seasoning on thick-cut Balaji crunches. Spice lovers rejoice.',
    stock: 150,
  },
  {
    productId: 122, name: 'Crunchem Chaat Chakra', category: 'balaji',
    price: 20, weight: '65g', image: '/images/balaji_chaat_chakra.png',
    description: 'Street-food inspired chaat masala on crispy Balaji wafers. A true Indian flavour explosion.',
    stock: 150,
  },
  {
    productId: 123, name: 'Crunched Cream & Onion', category: 'balaji',
    price: 20, weight: '65g', image: '/images/balaji_cream_onion.png',
    description: 'Smooth cream and onion seasoning on thick Balaji wafers. Mild, creamy, and completely addictive.',
    stock: 150,
  },
  {
    productId: 124, name: 'Crunched Peri Peri', category: 'balaji',
    price: 10, weight: '35g', image: '/images/balaji_peri_peri.png',
    description: 'Peri peri heat in a pocket-sized pack. Big flavour, small price.',
    stock: 200,
  },
  {
    productId: 125, name: 'Crunched Simply Salted', category: 'balaji',
    price: 20, weight: '65g', image: '/images/balaji_simply_salted.png',
    description: "Classic salted wafers done right — simple, clean, and completely addictive.",
    stock: 150,
  },
  {
    productId: 126, name: 'Rumbles Pudina Twist', category: 'balaji',
    price: 20, weight: '65g', image: '/images/balaji_pudina_twist.png',
    description: 'Cool pudina (mint) twist with a refreshing crunch. The ultimate summer snack.',
    stock: 150,
  },
  {
    productId: 127, name: 'Crunched Tomato Twist', category: 'balaji',
    price: 20, weight: '65g', image: '/images/balaji_tomato_twist.png',
    description: 'Tangy tomato seasoning on thick Balaji crunches. A tomato lover\'s dream.',
    stock: 150,
  },
];

// ═══════════════════════════════════════════════════════════════
//  SEED FUNCTION — Smart Upsert (insert new, update existing)
// ═══════════════════════════════════════════════════════════════

async function seed() {
  // Support both MONGO_URI and MONGODB_URI env key names
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoUri || mongoUri.includes('<username>') || mongoUri.includes('cluster0.xxxxx')) {
    console.error('\n❌  No valid MongoDB URI found in .env');
    console.error('   Add this to bakend/.env:');
    console.error('   MONGO_URI=mongodb+srv://youruser:yourpass@cluster.mongodb.net/snackbazaar\n');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('✅  Connected to MongoDB\n');

    let inserted = 0, updated = 0;

    for (const p of products) {
      const exists = await Product.findOne({ productId: p.productId });
      if (!exists) {
        await Product.create(p);
        inserted++;
        console.log(`  ➕ [${p.productId}] ${p.name}`);
      } else {
        // Update metadata, preserve stock/rating/reviewCount
        await Product.findOneAndUpdate(
          { productId: p.productId },
          {
            $set: {
              name: p.name,
              category: p.category,
              price: p.price,
              weight: p.weight,
              description: p.description,
              isActive: true,
              ...(p.image ? { image: p.image } : {}),
            },
          },
          { new: true }
        );
        updated++;
        console.log(`  ✏️  [${p.productId}] ${p.name} (updated)`);
      }
    }

    const categoryBreakdown = {};
    for (const p of products) {
      categoryBreakdown[p.category] = (categoryBreakdown[p.category] || 0) + 1;
    }

    console.log(`
╔════════════════════════════════════════════════╗
║  🌱  Snack Bazaar — Seeding Complete!         ║
╠════════════════════════════════════════════════╣
║  ➕ New products inserted : ${String(inserted).padEnd(18)}║
║  ✏️  Existing updated      : ${String(updated).padEnd(18)}║
║  📦 Total in seed file    : ${String(products.length).padEnd(18)}║
╚════════════════════════════════════════════════╝
`);
    console.log('📊  Products by category:');
    for (const [cat, count] of Object.entries(categoryBreakdown)) {
      console.log(`   • ${cat.padEnd(20)} ${count} products`);
    }
    console.log('\n🚀  Start the server: npm start\n');

  } catch (err) {
    console.error('❌  Seeding error:', err.message);
    if (err.message.includes('ENOTFOUND') || err.message.includes('connect')) {
      console.error('   → Check your MONGO_URI and network connection.');
    }
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
