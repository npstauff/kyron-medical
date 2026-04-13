const request = require('supertest');
const app = require('../app');
const sequelize = require('../models');

describe('Voice routes', () => {
  afterAll(async () => await sequelize.close());

  it('POST /api/voice/initiate returns 400 without sessionId', async () => {
    const res = await request(app)
      .post('/api/voice/initiate')
      .send({ phoneNumber: '+12155551234' });
    expect(res.statusCode).toBe(400);
  });

  it('POST /api/voice/initiate returns 400 without phoneNumber', async () => {
    const res = await request(app)
      .post('/api/voice/initiate')
      .send({ sessionId: 'test-session' });
    expect(res.statusCode).toBe(400);
  });

  it('POST /api/voice/get-availability returns slots', async () => {
    const res = await request(app)
      .post('/api/voice/get-availability')
      .send({ body_part: 'heart' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('result');
    expect(typeof res.body.result).toBe('string');
    expect(res.body.result.length).toBeGreaterThan(0);
  });

  it('POST /api/voice/get-availability returns no slots message for unknown specialty', async () => {
    const res = await request(app)
      .post('/api/voice/get-availability')
      .send({ body_part: 'lungs' });
    expect(res.statusCode).toBe(200);
    expect(res.body.result).toContain('No available slots');
  });

  it('POST /api/voice/webhook returns success for lifecycle events', async () => {
    const res = await request(app)
      .post('/api/voice/webhook')
      .send({ event: 'dial.updated', payload: {} });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});