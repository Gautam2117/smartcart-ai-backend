require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mongoose = require('mongoose');  // ✅ Added MongoDB for behavioral engine

const app = express();
const corsOptions = {
  origin: ['http://localhost:5173', 'https://smartcart-beige.vercel.app/'],
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

// ✅ MongoDB connection
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// ✅ Search history schema
const searchHistorySchema = new mongoose.Schema({
  userId: String,
  query: String,
  timestamp: { type: Date, default: Date.now }
});
const SearchHistory = mongoose.model('SearchHistory', searchHistorySchema);

// ✅ Save history endpoint
app.post('/save-history', async (req, res) => {
  const { userId, query } = req.body;
  if (!query) return res.status(400).send('Missing query');
  await SearchHistory.create({ userId, query });
  res.sendStatus(200);
});

// ✅ Get history endpoint
app.get('/get-history/:userId', async (req, res) => {
  const userId = req.params.userId;
  const history = await SearchHistory.find({ userId }).sort({ timestamp: -1 }).limit(10);
  res.json(history.map(item => item.query));
});

// ✅ AI Product Search with Real-Time Inventory
app.post('/chat', async (req, res) => {
  const userQuery = req.body.message;
  const userId = req.body.userId || "default-user";

  const systemPrompt = `
You are SmartCart AI, a highly skilled product recommendation system for e-commerce.

STRICT INSTRUCTIONS:
- Output STRICT valid JSON only.
- Format:
[
  {
    "name": "Product Name",
    "brand": "Brand Name",
    "price": integer_price_in_INR,
    "stock": -1,
    "rating": float_between_3.5_and_5.0,
    "description": "Short 1-2 line description",
    "features": ["Feature 1", "Feature 2", ...],
    "url": "Valid product link (dummy allowed)"
  }
]
- Minimum 3 products, maximum 6.
- Use real brands available in India.
- Prices should match Indian market.
- Output ONLY valid JSON.

User Query: "${userQuery}"
`;

  try {
    const aiResponse = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: "deepseek-chat",
        messages: [{ role: "system", content: systemPrompt }],
        temperature: 0.5
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
        }
      }
    );

    const rawReply = aiResponse.data.choices[0].message.content;
    let products = JSON.parse(rawReply);

    // ✅ Enrich products with inventory using DummyJSON
    const enrichedProducts = await Promise.all(products.map(async (product) => {
      try {
        const inventoryResp = await axios.get(
          `https://dummyjson.com/products/search?q=${encodeURIComponent(product.name)}`
        );

        if (inventoryResp.data?.products?.length > 0) {
          const stock = inventoryResp.data.products[0].stock;
          return { ...product, stock };
        } else {
          return { ...product, stock: Math.floor(Math.random() * 40 + 10) };
        }
      } catch {
        return { ...product, stock: Math.floor(Math.random() * 40 + 10) };
      }
    }));

    // ✅ Save search query into MongoDB after successful response
    await SearchHistory.create({ userId, query: userQuery });

    res.json(enrichedProducts);

  } catch (error) {
    console.error("AI Error:", error.message);
    res.status(500).send('AI processing failed.');
  }
});

// ✅ AI Bundle Suggestion Endpoint
app.post('/bundle', async (req, res) => {
  const product = req.body.product;

  const bundlePrompt = `
You are SmartCart AI Bundle Expert.
Given this product: ${JSON.stringify(product)}

Suggest 3-4 highly relevant accessories for bundling.

STRICT FORMAT:
[
  {
    "name": "Accessory Name",
    "description": "Short one-line description",
    "price": integer_price_in_INR,
    "url": "Valid URL (dummy allowed)"
  }
]
Output ONLY valid JSON. No extra explanation.
`;

  try {
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: "deepseek-chat",
        messages: [{ role: "system", content: bundlePrompt }],
        temperature: 0.4
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
        }
      }
    );

    const rawReply = response.data.choices[0].message.content;
    const bundles = JSON.parse(rawReply);
    res.json(bundles);

  } catch (error) {
    console.error("Bundle AI Error:", error.message);
    res.status(500).send("Bundle AI processing failed.");
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ SmartCart AI backend fully running on port ${PORT}`));
