const express = require('express');
const router = express.Router();
const sequelize = require('../models');

const BASE_PROMPT = `You are a friendly, professional medical scheduling assistant for Kyron Medical. You are on a PHONE CALL with a patient. Keep responses concise and conversational.

IMPORTANT RULES:
- Never provide medical advice, diagnoses, or treatment recommendations
- Never say anything that could be construed as a medical opinion
- Keep responses short and natural for voice — no bullet points or markdown

The practice has four specialists:
- Dr. Sarah Chen — Cardiologist (heart)
- Dr. James Ortega — Orthopedist (bones, joints, muscles)
- Dr. Priya Patel — Dermatologist (skin)
- Dr. Michael Torres — Neurologist (brain, nerves, headaches)

Office: 123 Medical Plaza, Suite 400, New York, NY 10001
Hours: Monday through Friday 8am to 6pm, Saturday 9am to 1pm`;

function formatHistoryForVoice(messages) {
  return messages
    .filter(m => typeof m.content === 'string' || Array.isArray(m.content))
    .map(m => {
      if (typeof m.content === 'string') {
        return `${m.role === 'user' ? 'Patient' : 'Assistant'}: ${m.content}`
      }
      if (Array.isArray(m.content)) {
        const textBlock = m.content.find(b => b.type === 'text')
        return textBlock ? `Assistant: ${textBlock.text}` : null
      }
      return null
    })
    .filter(Boolean)
    .join('\n')
}

// POST /api/voice/initiate
router.post('/initiate', async (req, res) => {
  const { sessionId, phoneNumber } = req.body;

  if (!sessionId || !phoneNumber) {
    return res.status(400).json({ error: 'sessionId and phoneNumber are required' });
  }

  try {
    // Load conversation history
    const [rows] = await sequelize.query(
      `SELECT * FROM conversations WHERE session_id = $1`,
      { bind: [sessionId] }
    );

    const messages = rows[0]?.messages || [];
    const historyText = formatHistoryForVoice(messages);

    // Build the full prompt with context
    const fullPrompt = historyText.length > 0
      ? `${BASE_PROMPT}\n\nPRIOR WEB CHAT CONTEXT:\n${historyText}\n\nYou are continuing this conversation by phone. Greet the patient by name if you know it and pick up naturally from where the chat left off. Do not re-ask for information already provided.`
      : `${BASE_PROMPT}\n\nThis patient is starting fresh by phone. Greet them warmly and ask how you can help.`;

    // Update the agent prompt via Vogent API before dialing
    await fetch(`https://api.vogent.ai/api/agents/${process.env.VOGENT_AGENT_ID}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${process.env.VOGENT_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt: fullPrompt })
    });

    // Create the dial
    const response = await fetch('https://api.vogent.ai/api/dials', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VOGENT_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        callAgentId: process.env.VOGENT_AGENT_ID,
        fromNumberId: process.env.VOGENT_PHONE_NUMBER_ID,
        toNumber: phoneNumber,
        browserCall: false,
        timeoutMinutes: 10
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Vogent dial error:', data);
      return res.status(500).json({ error: data.message || 'Failed to initiate call' });
    }

    res.json({ success: true, dialId: data.dialId });

  } catch (err) {
    console.error('Voice initiate error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;