require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post('/chat', async (req, res) => {
  const userQuery = req.body.message;

  const prompt = `Act like a smart shopping assistant for retail. User says: "${userQuery}". 
  Reply casually with product suggestions, pricing in ₹, and availability. Short answers.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200
    });

    const reply = completion.choices[0].message.content;
    res.json({ reply });
  } catch (error) {
    console.error(error);
    res.status(500).send('AI error');
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`SmartCart AI Backend running on port ${PORT}`));
