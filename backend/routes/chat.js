const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const sequelize = require('../models');
const getAvailability = require('../tools/getAvailability');
const bookAppointment = require('../tools/bookAppointment');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a friendly, professional medical scheduling assistant for Kyron Medical.
You help patients schedule appointments, check office information, and answer general practice questions.

IMPORTANT RULES:
- Never provide medical advice, diagnoses, or treatment recommendations
- Never say anything that could be construed as a medical opinion
- You only schedule appointments and provide practice information

The practice has four specialists:
- Dr. Sarah Chen — Cardiologist (heart)
- Dr. James Ortega — Orthopedist (bones, joints, muscles)
- Dr. Priya Patel — Dermatologist (skin)
- Dr. Michael Torres — Neurologist (brain, nerves, headaches)

Office address: 123 Medical Plaza, Suite 400, New York, NY 10001
Hours: Monday–Friday 8am–6pm, Saturday 9am–1pm

To schedule an appointment:
1. Collect first name, last name, date of birth, phone number, email, and reason for visit
2. Use get_availability to find open slots matching their condition
3. Let the patient choose a time
4. Use book_appointment to confirm
5. Confirm the booking with a clear summary

If the patient asks about a body part or condition not covered by our specialists, politely let them know.`;

const tools = [
  {
    name: 'get_availability',
    description: 'Get available appointment slots for a given body part or condition',
    input_schema: {
      type: 'object',
      properties: {
        body_part: { type: 'string', description: 'The body part e.g. heart, skin, bones, brain' },
        date_preference: { type: 'string', description: 'Optional date preference e.g. Tuesday, next week' }
      },
      required: ['body_part']
    }
  },
  {
    name: 'book_appointment',
    description: 'Book an appointment slot for a patient',
    input_schema: {
      type: 'object',
      properties: {
        slot_id: { type: 'number' },
        first_name: { type: 'string' },
        last_name: { type: 'string' },
        dob: { type: 'string' },
        phone: { type: 'string' },
        email: { type: 'string' },
        sms_opt_in: { type: 'boolean' },
        reason: { type: 'string' }
      },
      required: ['slot_id', 'first_name', 'last_name', 'dob', 'phone', 'email']
    }
  }
];

router.post('/', async (req, res) => {
    const {sessionId, message} = req.body;

    try {
        let [conv] = await sequelize.query(
        `SELECT * FROM conversations WHERE session_id = $1`,
            { bind: [sessionId] }
        );

        let messages = conv[0] ? conv[0].messages : [];
        messages.push({ role: 'user', content: message });

        let response;
        while(true) {
            response = await client.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 1024,
                system: SYSTEM_PROMPT,
                tools,
                messages
            });

            messages.push({ role: 'assistant', content: response.content });

            if(response.stop_reason !== 'tool_use') break;

            const toolResults = [];
            for(const block of response.content) {
                if(block.type !== 'tool_use') continue;
                
                let result;
                if(block.name === 'get_availability') {
                    result = await getAvailability(block.input.body_part, block.input.date_preference);
                } else if(block.name === 'book_appointment') {
                    result = await bookAppointment({
                        slotId: block.input.slot_id,
                        firstName: block.input.first_name,
                        lastName: block.input.last_name,
                        dob: block.input.dob,
                        phone: block.input.phone,
                        email: block.input.email,
                        smsOptIn: block.input.sms_opt_in,
                        reason: block.input.reason
                    });
                }

                toolResults.push({
                    type: 'tool_result',
                    tool_use_id: block.id,
                    content: JSON.stringify(result)
                })
            }

            messages.push({role: "user", content: toolResults});
        }

        await sequelize.query(`
            INSERT INTO conversations (session_id, messages, updated_at)
            VALUES ($1, $2, NOW())
            ON CONFLICT (session_id) DO UPDATE SET messages = $2, updated_at = NOW()
        `, { bind: [sessionId, JSON.stringify(messages)] });

        const textBlock = response.content.find(b => b.type === 'text');
        res.json({ reply: textBlock?.text || 'Sorry, something went wrong.' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
    
});

module.exports = router;