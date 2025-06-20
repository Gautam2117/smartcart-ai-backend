require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/chat', async (req, res) => {
  const userQuery = req.body.message;

  const systemPrompt = `
You are SmartCart AI, a highly skilled product recommendation system for e-commerce.

❗ STRICT INSTRUCTIONS:
- Output STRICTLY valid JSON only.
- NO extra explanation, no markdown, no surrounding text.
- Format: 
[
  {
    "name": "Product Name",
    "brand": "Brand Name",
    "price": integer_price_in_INR,
    "stock": estimated_stock_available (integer between 0 and 100),
    "rating": float between 3.5 and 5.0 (more realistic values),
    "description": "Short 1-2 line description",
    "features": ["Feature 1", "Feature 2", ...],
    "url": "Valid product link (dummy allowed)"
  }
]

- Minimum 3 products, maximum 6.
- Use real brands available in India (Amazon, Flipkart, Myntra, etc.).
- Prices should match Indian market.
- Features should be very short 3-5 bullet points per product.
- Output ONLY valid JSON.

User Query: "${userQuery}"
  `;

  const messages = [{ role: "system", content: systemPrompt }];

  try {
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: "deepseek-chat",
        messages: messages,
        temperature: 0.5
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
        }
      }
    );

    const rawReply = response.data.choices[0].message.content;
    console.log("AI Raw Reply:\n", rawReply);

    let parsed;
    try {
      parsed = JSON.parse(rawReply);
    } catch (parseError) {
      console.error("JSON Parsing Failed:", parseError);
      return res.status(500).send("AI returned invalid JSON.");
    }

    if (!Array.isArray(parsed)) {
      return res.status(500).send("AI returned unexpected format.");
    }

    res.json(parsed);

  } catch (error) {
    console.error("DeepSeek API Error:", error.response?.data || error.message);
    res.status(500).send('AI processing failed.');
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ SmartCart AI Backend running on port ${PORT}`));
