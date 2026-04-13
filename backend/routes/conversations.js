const express = require("express");
const router = express.Router();
const sequelize = require("../models");

// GET /api/conversations/:sessionId
router.get("/:sessionId", async (req, res) => {
  const { sessionId } = req.params;

  try {
    const [
      rows,
    ] = await sequelize.query(
      `SELECT * FROM conversations WHERE session_id = $1`,
      { bind: [sessionId] }
    );

    if (!rows[0]) {
      return res.json({ messages: [], appointment: null });
    }

    // Filter to only user/assistant text messages for the frontend
    const messages = rows[0].messages
      .filter((m) => {
        if (m.role === "user" && typeof m.content === "string") return true;
        if (m.role === "assistant") return true;
        return false;
      })
      .map((m) => {
        // User message - plain string
        if (typeof m.content === "string") {
          return { role: m.role, text: m.content };
        }
        // Assistant message - extract text block from array
        if (Array.isArray(m.content)) {
          const textBlock = m.content.find((b) => b.type === "text");
          return textBlock ? { role: m.role, text: textBlock.text } : null;
        }
        return null;
      })
      .filter(Boolean);

    res.json({ messages, appointment: rows[0].appointment_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
