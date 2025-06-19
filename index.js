require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/chat', async (req, res) => {
  const userQuery = req.body.message;

  const messages = [
    { role: "system", content: "You are SmartCart AI, a shopping assistant." },
    { role: "user", content: userQuery }
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
    res.json({ reply });

  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).send('AI error');
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`SmartCart AI (DeepSeek FINAL version) Backend running on port ${PORT}`));
