require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/chat', async (req, res) => {
  const userQuery = req.body.message;

  // Craft strict system prompt for perfect structured response
  const systemPrompt = `
You are SmartCart AI, a shopping assistant. Your task is to recommend products based on user queries.

**IMPORTANT INSTRUCTIONS:**

- Return your response strictly as valid JSON only.
- Do NOT include any explanation, markdown, or extra text outside JSON.
- Format:

[
  {
    "name": "Product Name",
    "price": Product_Price_in_Integer_Rupees,
    "stock": Stock_Availability_Integer (random between 5 and 20)
  },
  ...
]

- Always give minimum 3 and maximum 6 products.

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
        temperature: 0.7
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
        }
      }
    );

    const reply = response.data.choices[0].message.content;
    console.log("AI Raw Response:\n", reply);
    res.json(JSON.parse(reply));

  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).send('AI error');
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`SmartCart AI (DeepSeek JSON version) Backend running on port ${PORT}`));
