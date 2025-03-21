const express = require("express");
const { OpenAI } = require("openai");
const dotenv = require("dotenv");

dotenv.config();
const router = express.Router();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post("/", async (req, res) => {
    try {
        const { skills } = req.body;

        if (!skills) {
            return res.status(400).json({ message: "Skills are required" });
        }

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: `Suggest 5 job roles for a person skilled in ${skills}` }],
            max_tokens: 100,
        });

        res.json({ recommendations: response.choices[0].message.content.trim().split("\n") });

    } catch (error) {
        console.error("OpenAI API Error:", error);
        res.status(500).json({ message: "Error generating recommendations" });
    }
});

module.exports = router;
