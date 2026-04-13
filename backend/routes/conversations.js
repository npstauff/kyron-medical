const express = require('express');
const router = express.Router();
const sequelize = require('../models');

// GET /api/conversations/:sessionId
router.get('/:sessionId', async (req, res) => {
  const { sessionId } = req.params;

  try {
    const [rows] = await sequelize.query(
      `SELECT * FROM conversations WHERE session_id = $1`,
      { bind: [sessionId] }
    );

    if (!rows[0]) {
      return res.json({ messages: [], appointment: null });
    }

    // Filter to only user/assistant text messages for the frontend
    const messages = rows[0].messages
      .filter(m => typeof m.content === 'string')
      .map(m => ({
        role: m.role,
        text: m.content
      }));

    res.json({ messages, appointment: rows[0].appointment_id });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;