const sequelize = require('../models');

async function bookAppointment({ slotId, firstName, lastName, dob, phone, email, smsOptIn, reason }) {
  const [patient] = await sequelize.query(`
    INSERT INTO patients (first_name, last_name, dob, phone, email, sms_opt_in)
    VALUES (:firstName, :lastName, :dob, :phone, :email, :smsOptIn)
    ON CONFLICT (email) DO UPDATE SET phone = :phone
    RETURNING *
  `, { replacements: { firstName, lastName, dob, phone, email, smsOptIn: smsOptIn || false } });

  await sequelize.query(`
    UPDATE availability_slots SET is_booked = true WHERE id = :slotId
  `, { replacements: { slotId } });

  const [slotDetails] = await sequelize.query(`
    SELECT s.slot_time, p.name as provider_name, p.specialty
    FROM availability_slots s
    JOIN providers p ON s.provider_id = p.id
    WHERE s.id = :slotId
  `, { replacements: { slotId } });

  return {
    patient: patient[0],
    appointment: slotDetails[0]
  };
}

module.exports = bookAppointment;