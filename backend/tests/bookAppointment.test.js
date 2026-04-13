const sequelize = require('../models');
const bookAppointment = require('../tools/bookAppointment');
const getAvailability = require('../tools/getAvailability');

describe('bookAppointment', () => {
  let bookedSlotId;

  afterAll(async () => {
    // Clean up test data
    if (bookedSlotId) {
      await sequelize.query(
        `UPDATE availability_slots SET is_booked = false WHERE id = $1`,
        { bind: [bookedSlotId] }
      );
    }
    await sequelize.query(
      `DELETE FROM patients WHERE email = $1`,
      { bind: ['testpatient@example.com'] }
    );
    await sequelize.close();
  });

  it('successfully books an appointment', async () => {
    const slots = await getAvailability('skin');
    expect(slots.length).toBeGreaterThan(0);
    const slot = slots[0];
    bookedSlotId = slot.id;

    const result = await bookAppointment({
      slotId: slot.id,
      firstName: 'Jane',
      lastName: 'Doe',
      dob: '1990-01-15',
      phone: '555-123-4567',
      email: 'testpatient@example.com',
      smsOptIn: false,
      reason: 'Skin checkup'
    });

    expect(result).toHaveProperty('patient');
    expect(result).toHaveProperty('appointment');
    expect(result.patient.first_name).toBe('Jane');
    expect(result.patient.email).toBe('testpatient@example.com');
    expect(result.appointment.provider_name).toBe('Dr. Priya Patel');
  });

  it('marks slot as booked after booking', async () => {
    const [rows] = await sequelize.query(
      `SELECT is_booked FROM availability_slots WHERE id = $1`,
      { bind: [bookedSlotId] }
    );
    expect(rows[0].is_booked).toBe(true);
  });

  it('booked slot no longer appears in availability', async () => {
    const slots = await getAvailability('skin');
    const ids = slots.map(s => s.id);
    expect(ids).not.toContain(bookedSlotId);
  });
});