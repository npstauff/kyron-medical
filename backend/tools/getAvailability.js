const sequelize = require('../models')

async function getAvailability(bodyPart, datePreference) {
    const [slots] = await sequelize.query(`
    SELECT s.id, s.slot_time, p.name as provider_name, p.specialty, p.body_part
    FROM availability_slots s
    JOIN providers p ON s.provider_id = p.id
    WHERE p.body_part ILIKE $1
    AND s.is_booked = false
    AND s.slot_time > NOW()
    ORDER BY s.slot_time
    LIMIT 10
    `, {bind: [`%${bodyPart}%`]})
    return slots;
}

module.exports = getAvailability;