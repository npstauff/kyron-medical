const request = require('supertest');
const app = require('../app');
const sequelize = require('../models');

describe('Availability routes', () => {
  let createdSlotId;

  afterAll(async () => {
    if (createdSlotId) {
      await sequelize.query(
        `DELETE FROM availability_slots WHERE id = :id`,
        { replacements: { id: createdSlotId } }
      );
    }
    await sequelize.close();
  });

  it('GET /api/availability returns slots', async () => {
    const res = await request(app).get('/api/availability');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('slots');
    expect(Array.isArray(res.body.slots)).toBe(true);
    expect(res.body.slots.length).toBeGreaterThan(0);
  });

  it('GET /api/availability/providers returns providers with stats', async () => {
    const res = await request(app).get('/api/availability/providers');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('providers');
    expect(res.body.providers.length).toBe(4);
    res.body.providers.forEach(p => {
      expect(p).toHaveProperty('name');
      expect(p).toHaveProperty('specialty');
      expect(p).toHaveProperty('available');
      expect(p).toHaveProperty('booked');
    });
  });

  it('POST /api/availability creates a new slot', async () => {
    const res = await request(app)
      .post('/api/availability')
      .send({ provider_id: 1, slot_time: '2026-06-01T10:00:00Z' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const [rows] = await sequelize.query(
      `SELECT * FROM availability_slots WHERE provider_id = 1 AND slot_time = '2026-06-01T10:00:00Z'`
    );
    expect(rows.length).toBe(1);
    createdSlotId = rows[0].id;
  });

  it('PATCH /api/availability/:slotId toggles booking status', async () => {
    const res = await request(app)
      .patch(`/api/availability/${createdSlotId}`)
      .send({ is_booked: true });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const [rows] = await sequelize.query(
      `SELECT is_booked FROM availability_slots WHERE id = :id`,
      { replacements: { id: createdSlotId } }
    );
    expect(rows[0].is_booked).toBe(true);
  });

  it('PATCH /api/availability/:slotId/cancel unbooks a slot', async () => {
    const res = await request(app)
      .patch(`/api/availability/${createdSlotId}/cancel`);

    expect(res.statusCode).toBe(200);

    const [rows] = await sequelize.query(
      `SELECT is_booked FROM availability_slots WHERE id = :id`,
      { replacements: { id: createdSlotId } }
    );
    expect(rows[0].is_booked).toBe(false);
  });

  it('DELETE /api/availability/:slotId removes a slot', async () => {
    const res = await request(app)
      .delete(`/api/availability/${createdSlotId}`);

    expect(res.statusCode).toBe(200);

    const [rows] = await sequelize.query(
      `SELECT * FROM availability_slots WHERE id = :id`,
      { replacements: { id: createdSlotId } }
    );
    expect(rows.length).toBe(0);
    createdSlotId = null;
  });
});