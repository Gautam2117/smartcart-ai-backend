require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/chat', async (req, res) => {
  const userQuery = req.body.message;

  // Strict system prompt
  const systemPrompt = `
You are SmartCart AI, a shopping assistant. 

❗ STRICT INSTRUCTIONS:

- Your entire reply must be ONLY valid JSON.
- DO NOT add any text, intro, markdown, or explanations.
- Format: 
[
  {
    "name": "Product Name",
    "price": price_in_INR_as_integer,
    "stock": stock_as_integer_between_5_and_20
  },
  ...
]

- Minimum 3 products, maximum 6.
- Use real products relevant to user's query.
- Prices should be realistic for Indian market.
- Output PURE valid JSON without any surrounding text.

User Query: "${userQuery}"
  `;

  const messages = [
    { role: "system", content: systemPrompt }
  ];

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
      console.error("❌ JSON Parsing Failed:", parseError);
      return res.status(500).send("AI returned invalid JSON.");
    }

    if (!Array.isArray(parsed)) {
      console.error("❌ Invalid structure (not array).");
      return res.status(500).send("AI returned unexpected format.");
    }

    res.json(parsed);  // ✅ Directly send pure JSON array to frontend

  } catch (error) {
    console.error("❌ DeepSeek API Error:", error.response?.data || error.message);
    res.status(500).send('AI processing failed.');
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ SmartCart AI Backend running on port ${PORT}`));
