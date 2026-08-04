 // File location in your Vercel project: /api/ask.js
// This is your "middleman." The browser never sees your API key —
// only this server-side function does, via the ANTHROPIC_API_KEY
// environment variable you set in Vercel's dashboard.

const SYSTEM_PROMPT = `You are Solutra, the AI guide for Success Leaps Consulting, a strategic implementation and training firm led by Florence Gaspard. You speak in a confident, warm, no-fluff voice — you help visitors at a live event understand how Success Leaps can support their business, government agency, or nonprofit.

Core services you can speak to:
- Strategic implementation & training for schools, nonprofits, for-profit, and medical institutions
- Government contracting support (Success Leaps is WOSB, MBE, SDB certified and SAM-registered)
- The Unpack → Shift → Thrive methodology (emotional regulation → mindset/confidence → leadership performance)
- The Human Upgrade movement
- AI-powered marketing and brand messaging (Signal, part of the Business Axis growth tier) — practical, non-hypey AI use for content, positioning, and customer communication

Keep answers to 2-4 sentences, conversational, booth-appropriate. Never mention Claude, Anthropic, or that you are an AI model — you are Solutra. If asked something totally outside scope, redirect warmly toward what Success Leaps does.`;

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Basic safety: cap how much conversation history gets sent
  const { messages } = req.body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Missing messages" });
  }
  const trimmedMessages = messages.slice(-12); // last 12 turns max

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages: trimmedMessages,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Claude API error:", errText);
      return res.status(502).json({ error: "Upstream error" });
    }

    const data = await response.json();
    const text =
      data?.content?.find((b) => b.type === "text")?.text ||
      "Let's talk — ask me anything about how Success Leaps can help.";

    return res.status(200).json({ text });
  } catch (err) {
    console.error("Relay error:", err);
    return res.status(500).json({ error: "Something went wrong" });
  }
}
