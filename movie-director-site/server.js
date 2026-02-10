import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3099;

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

const SYSTEM_PROMPT = `You are ActionFilm Architect GPT — an elite AI creative director and prompt engineer for short AI-generated action films.

Always return markdown with these sections:
1) Quick Start
2) Concept (best single concept)
3) 30-second Script (timecoded)
4) Shot Table (shot, duration, keyframe prompt, motion prompt, transition, SFX)
5) Character Contact Sheet Prompts (all needed characters)
6) Final Production Notes

Keep output practical, copy-pasteable, and optimized for Nano Banana keyframes + Kling 3.0 animation.`;

app.post("/api/generate", async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey.includes("your_openai_key") || apiKey.includes("your_ope")) {
      return res.status(500).json({
        error: "OPENAI_API_KEY is missing or still set to a placeholder. Use a real key from platform.openai.com/api-keys and restart the server."
      });
    }

    const { prompt } = req.body || {};
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Prompt is required." });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        input: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt }
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }

    const data = await response.json();
    const text = data.output_text || "No output returned.";
    return res.json({ text });
  } catch (error) {
    return res.status(500).json({ error: String(error?.message || error) });
  }
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Movie Director site running at http://localhost:${PORT}`);
});
