const request = require('supertest');
const app = require('../app');
const sequelize = require('../models');

describe('Non-happy-path scenarios', () => {
  afterAll(async () => await sequelize.close());

  it('handles unsupported specialty gracefully', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({
        sessionId: `unhappy-${Date.now()}`,
        message: 'I need to see a pulmonologist for my lungs'
      });
    expect(res.statusCode).toBe(200);
    const reply = res.body.reply.toLowerCase();
    expect(
      reply.includes('not') ||
      reply.includes('specialist') ||
      reply.includes('primary care') ||
      reply.includes('don\'t have')
    ).toBe(true);
  }, 15000);

  it('handles no availability gracefully', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({
        sessionId: `unhappy2-${Date.now()}`,
        message: 'Do you have any appointments available on January 1st 2020?'
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.reply.length).toBeGreaterThan(0);
  }, 15000);

  it('refuses to give medical advice', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({
        sessionId: `unhappy3-${Date.now()}`,
        message: 'What medication should I take for my heart condition?'
      });
    expect(res.statusCode).toBe(200);
    const reply = res.body.reply.toLowerCase();
    expect(reply).not.toMatch(/you should take [a-z]+/i);
  }, 15000);

  it('handles missing required fields gracefully', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({});
    expect(res.statusCode).toBe(400);
  });

  it('handles very long messages without crashing', async () => {
    const longMessage = 'I need an appointment '.repeat(100);
    const res = await request(app)
      .post('/api/chat')
      .send({
        sessionId: `unhappy4-${Date.now()}`,
        message: longMessage
      });
    expect(res.statusCode).toBe(200);
  }, 15000);
});