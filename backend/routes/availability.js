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

router.get('/providers', async (req, res) => {
  try {
    const [providers] = await sequelize.query(`
      SELECT p.id, p.name, p.specialty, p.body_part,
             COUNT(s.id)::int as total_slots,
             COUNT(CASE WHEN s.is_booked = false THEN 1 END)::int as available,
             COUNT(CASE WHEN s.is_booked = true THEN 1 END)::int as booked
      FROM providers p
      LEFT JOIN availability_slots s ON p.id = s.provider_id
      GROUP BY p.id, p.name, p.specialty, p.body_part
      ORDER BY p.name
    `);
    res.json({ providers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { provider_id, slot_time } = req.body;
  try {
    await sequelize.query(
      `INSERT INTO availability_slots (provider_id, slot_time) VALUES (:provider_id, :slot_time)`,
      { replacements: { provider_id, slot_time } }
    );
    res.json({ success: true });
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

// Cancel a booked appointment (set back to available)
router.patch('/:slotId/cancel', async (req, res) => {
  const { slotId } = req.params;
  try {
    await sequelize.query(
      `UPDATE availability_slots SET is_booked = false WHERE id = :slotId`,
      { replacements: { slotId } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/book', async (req, res) => {
  const { slot_id, first_name, last_name, dob, phone, email, sms_opt_in, reason } = req.body;
  try {
    const bookAppointment = require('../tools/bookAppointment');
    const result = await bookAppointment({
      slotId: slot_id,
      firstName: first_name,
      lastName: last_name,
      dob,
      phone,
      email,
      smsOptIn: sms_opt_in || false,
      reason
    });
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a slot entirely
router.delete('/:slotId', async (req, res) => {
  const { slotId } = req.params;
  try {
    await sequelize.query(
      `DELETE FROM availability_slots WHERE id = :slotId`,
      { replacements: { slotId } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;