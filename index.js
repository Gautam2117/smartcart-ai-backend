require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Configuration, OpenAIApi } = require("openai");

const app = express();
app.use(cors());
app.use(express.json());

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(configuration);

app.post('/chat', async (req, res) => {
  const userQuery = req.body.message;

  const prompt = `Act like a smart shopping assistant for retail. User says: "${userQuery}". 
  Reply casually with product suggestions, pricing in ₹, and availability. Short answers.`;

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200
    });

    const reply = completion.data.choices[0].message.content;
    res.json({ reply });
  } catch (error) {
    console.error(error);
    res.status(500).send('AI error');
  }
});

app.listen(5000, () => console.log("SmartCart AI Backend running on port 5000"));
