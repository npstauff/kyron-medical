const express = require("express");
const router = express.Router();
const sequelize = require("../models");

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
Hours: Monday through Friday 8am to 6pm, Saturday 9am to 1pm

When the patient wants to check availability, use the get_availability function with the body_part parameter.

When the patient confirms an appointment, use the book_appointment function with these parameters:
- slot_id (number)
- first_name (string)
- last_name (string)
- dob (string, format YYYY-MM-DD)
- phone (string)
- email (string)
- reason (string)

Always collect the patient's email before booking so they receive a confirmation email.`;

function formatHistoryForVoice(messages) {
  return messages
    .filter((m) => typeof m.content === "string" || Array.isArray(m.content))
    .map((m) => {
      if (typeof m.content === "string") {
        return `${m.role === "user" ? "Patient" : "Assistant"}: ${m.content}`;
      }
      if (Array.isArray(m.content)) {
        const textBlock = m.content.find((b) => b.type === "text");
        return textBlock ? `Assistant: ${textBlock.text}` : null;
      }
      return null;
    })
    .filter(Boolean)
    .join("\n");
}

router.post("/initiate", async (req, res) => {
  const { sessionId, phoneNumber } = req.body;

  if (!sessionId || !phoneNumber) {
    return res
      .status(400)
      .json({ error: "sessionId and phoneNumber are required" });
  }

  try {
    // Load conversation history
    const [
      rows,
    ] = await sequelize.query(
      `SELECT * FROM conversations WHERE session_id = $1`,
      { bind: [sessionId] }
    );

    const messages = rows[0]?.messages || [];
    const historyText = formatHistoryForVoice(messages);

    const fullPrompt =
      historyText.length > 0
        ? `${BASE_PROMPT}\n\nPRIOR WEB CHAT CONTEXT:\n${historyText}\n\nYou are continuing this conversation by phone. Greet the patient by name if you know it and pick up naturally from where the chat left off. Do not re-ask for information already provided.`
        : `${BASE_PROMPT}\n\nThis patient is starting fresh by phone. Greet them warmly and ask how you can help.`;

    const promptRes = await fetch(
      `https://api.vogent.ai/api/agents/${process.env.VOGENT_AGENT_ID}/versioned_prompts/${process.env.VOGENT_PROMPT_ID}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${process.env.VOGENT_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agentType: "STANDARD",
          prompt: fullPrompt,
          name: "kyron-medical-prompt",
        }),
      }
    );

    const promptText = await promptRes.text();
    console.log("Vogent prompt response:", promptRes.status, promptText);

    if (!promptRes.ok) {
      return res
        .status(500)
        .json({ error: "Failed to update agent prompt", detail: promptText });
    }

    // Create the dial
    const dialRes = await fetch("https://api.vogent.ai/api/dials", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.VOGENT_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        callAgentId: process.env.VOGENT_AGENT_ID,
        fromNumberId: process.env.VOGENT_PHONE_NUMBER_ID,
        toNumber: phoneNumber,
        browserCall: false,
        timeoutMinutes: 10,
        webhookUrl: `${process.env.BASE_URL}/api/voice/webhook`
      }),
    });

    const dialText = await dialRes.text();
    console.log("Vogent dial response:", dialRes.status, dialText);

    if (!dialRes.ok) {
      return res
        .status(500)
        .json({ error: "Failed to initiate call", detail: dialText });
    }

    const data = JSON.parse(dialText);
    res.json({ success: true, dialId: data.dialId });

    if (!dialRes.ok) {
      console.error("Vogent dial error:", data);
      return res
        .status(500)
        .json({ error: data.message || "Failed to initiate call" });
    }

    res.json({ success: true, dialId: data.dialId });
  } catch (err) {
    console.error("Voice initiate error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/voice/get-availability (Vogent calls this directly)
router.post('/get-availability', async (req, res) => {
  console.log('get_availability called:', JSON.stringify(req.body, null, 2));
  const body_part = req.body.body_part || req.body.params?.body_part;

  try {
    const slots = await getAvailability(body_part);
    const formatted = slots.length > 0
      ? slots.map(s => `${s.provider_name} on ${new Date(s.slot_time).toLocaleString('en-US', {
          weekday: 'long', month: 'long', day: 'numeric',
          hour: 'numeric', minute: '2-digit', hour12: true
        })}, slot ID ${s.id}`).join('. ')
      : 'No available slots for that specialty.';

    console.log('Availability result:', formatted);
    return res.json({ result: formatted });
  } catch (err) {
    console.error('get_availability error:', err);
    return res.json({ result: 'Unable to fetch availability right now.' });
  }
});

// POST /api/voice/book-appointment
router.post('/book-appointment', async (req, res) => {
  console.log('book_appointment called:', JSON.stringify(req.body, null, 2));
  const p = req.body.params || req.body;

  try {
    const result = await bookAppointment({
      slotId: p.slot_id,
      firstName: p.first_name,
      lastName: p.last_name,
      dob: p.dob,
      phone: p.phone,
      email: p.email,
      smsOptIn: p.sms_opt_in || false,
      reason: p.reason
    });

    return res.json({
      result: `Appointment confirmed for ${result.patient.first_name} ${result.patient.last_name} with ${result.appointment.provider_name}. A confirmation email has been sent to ${result.patient.email}.`
    });
  } catch (err) {
    console.error('book_appointment error:', err);
    return res.json({ result: 'Sorry, there was an issue booking. Please try again.' });
  }
});

module.exports = router;
