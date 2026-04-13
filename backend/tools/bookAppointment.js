const sequelize = require('../models')

async function bookAppointment({slotId, firstName, lastName, dob, phone, email, smsOptIn, reason}) {
    //return the object of the patient inserted into the database
    const [patient] = await sequelize.query(`
    INSERT INTO patients (first_name, last_name, dob, phone, email, sms_opt_in)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (email) DO UPDATE SET phone = $4
    RETURNING *
    `, { bind: [firstName, lastName, dob, phone, email, smsOptIn || false] });

    await sequelize.query(`
    UPDATE availability_slots SET is_booked = true WHERE id = $1
    `, { bind: [slotId] });

    const [slotDetails] = await sequelize.query(`
        SELECT s.slot_time, p.name as provider_name, p.specialty
        FROM availability_slots s
        JOIN providers p ON s.provider_id = p.id
        WHERE s.id = $1
    `, { bind: [slotId] });

    return {
        patient: patient[0],
        appointment: slotDetails[0]
    };
}

module.exports = bookAppointment;