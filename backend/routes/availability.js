const express = require('express');
const router = express.Router();
const sequelize = require('../models');

router.get('/', async (req, res) => {
  try {
    const [slots] = await sequelize.query(`
      SELECT s.id, s.slot_time, s.is_booked,
             p.id as provider_id, p.name as provider_name, p.specialty
      FROM availability_slots s
      JOIN providers p ON s.provider_id = p.id
      ORDER BY p.name, s.slot_time
    `);
    res.json({ slots });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:slotId', async (req, res) => {
  const { slotId } = req.params;
  const { is_booked } = req.body;
  try {
    await sequelize.query(
      `UPDATE availability_slots SET is_booked = :is_booked WHERE id = :slotId`,
      { replacements: { is_booked, slotId } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;