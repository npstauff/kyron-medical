const express = require('express');
const router = express.Router();
const sequelize = require('../models');
const bookAppointment = require('../tools/bookAppointment');
const getAvailability = require('../tools/getAvailability');

const BASE_PROMPT = `You are a friendly, professional medical scheduling assistant for Kyron Medical. You are on a PHONE CALL. Keep all responses short, natural, and conversational — this is voice, not text. Never use bullet points, lists, or markdown.

CRITICAL RULES:
- Never provide medical advice, diagnoses, or treatment recommendations under any circumstances
- Never speculate about a patient's condition or suggest what they might have
- If asked for medical opinions, politely redirect to scheduling
- Keep responses to 1-3 sentences maximum

AVAILABILITY RULES:
- Always call get_availability before quoting any times to the patient
- Never quote times from memory — always fetch fresh availability first
- Before confirming a booking, call get_availability one more time to verify the slot is still open

SPECIALISTS:
- Dr. Sarah Chen — Cardiologist, treats heart conditions
- Dr. James Ortega — Orthopedist, treats bones, joints, and muscles
- Dr. Priya Patel — Dermatologist, treats skin conditions
- Dr. Michael Torres — Neurologist, treats brain, nerve, and headache conditions
- If the patient needs a specialty not listed, let them know kindly and suggest they contact their primary care physician

SCHEDULING FLOW:
1. Ask what brings them in today
2. Match their condition to the right specialist
3. Call get_availability with the relevant body part
4. Offer 2-3 times naturally — for example "I have Tuesday the 14th at 9am or Wednesday the 16th at 2pm, which works better?"
5. Collect first name, last name, date of birth, phone number, and email
6. Ask if they'd like a text confirmation
7. Call book_appointment to confirm
8. Confirm the booking warmly and wish them well

OFFICE INFO:
- Address: 123 Medical Plaza, Suite 400, New York, NY 10001
- Hours: Monday through Friday 8am to 6pm, Saturday 9am to 1pm
- Phone: 212-555-0100`;

function formatHistoryForVoice(messages) {
  return messages
    .filter(m => typeof m.content === 'string' || Array.isArray(m.content))
    .map(m => {
      if (typeof m.content === 'string') {
        return `${m.role === 'user' ? 'Patient' : 'Assistant'}: ${m.content}`;
      }
      if (Array.isArray(m.content)) {
        const textBlock = m.content.find(b => b.type === 'text');
        return textBlock ? `Assistant: ${textBlock.text}` : null;
      }
      return null;
    })
    .filter(Boolean)
    .join('\n');
}

// POST /api/voice/initiate
router.post('/initiate', async (req, res) => {
  const { sessionId, phoneNumber } = req.body;

  if (!sessionId || !phoneNumber) {
    return res.status(400).json({ error: 'sessionId and phoneNumber are required' });
  }

  try {
    const [rows] = await sequelize.query(
      `SELECT * FROM conversations WHERE session_id = $1`,
      { bind: [sessionId] }
    );

    const messages = rows[0]?.messages || [];
    const historyText = formatHistoryForVoice(messages);

    const fullPrompt = historyText.length > 0
      ? `${BASE_PROMPT}\n\nPRIOR WEB CHAT CONTEXT:\n${historyText}\n\nYou are continuing this conversation by phone. Greet the patient by name if you know it and pick up naturally from where the chat left off. Do not re-ask for information already provided.`
      : `${BASE_PROMPT}\n\nThis patient is starting fresh by phone. Greet them warmly and ask how you can help.`;

    const promptRes = await fetch(
      `https://api.vogent.ai/api/agents/${process.env.VOGENT_AGENT_ID}/versioned_prompts/${process.env.VOGENT_PROMPT_ID}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${process.env.VOGENT_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          agentType: 'STANDARD',
          prompt: fullPrompt,
          name: 'kyron-medical-prompt'
        })
      }
    );

    const promptText = await promptRes.text();
    console.log('Vogent prompt response:', promptRes.status, promptText);

    if (!promptRes.ok) {
      return res.status(500).json({ error: 'Failed to update agent prompt', detail: promptText });
    }

    const dialRes = await fetch('https://api.vogent.ai/api/dials', {
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
        timeoutMinutes: 10,
        webhookUrl: `${process.env.BASE_URL}/api/voice/webhook`
      })
    });

    const dialText = await dialRes.text();
    console.log('Vogent dial response:', dialRes.status, dialText);

    if (!dialRes.ok) {
      return res.status(500).json({ error: 'Failed to initiate call', detail: dialText });
    }

    const data = JSON.parse(dialText);
    return res.json({ success: true, dialId: data.dialId });

  } catch (err) {
    console.error('Voice initiate error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/voice/get-availability
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

// POST /api/voice/webhook (dial lifecycle events)
router.post('/webhook', async (req, res) => {
  console.log('WEBHOOK EVENT:', req.body.event);
  return res.json({ success: true });
});

module.exports = router;