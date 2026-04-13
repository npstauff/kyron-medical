const request = require('supertest');
const app = require('../app');
const sequelize = require('../models');

describe('Chat endpoint', () => {
  const sessionId = `test-session-${Date.now()}`;

  afterAll(async () => {
    await sequelize.query(
      `DELETE FROM conversations WHERE session_id = $1`,
      { bind: [sessionId] }
    );
    await sequelize.close();
  });

  it('returns a reply for a basic message', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ sessionId, message: 'Hello' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('reply');
    expect(typeof res.body.reply).toBe('string');
    expect(res.body.reply.length).toBeGreaterThan(0);
  }, 15000);

  it('persists conversation to database', async () => {
    const [rows] = await sequelize.query(
      `SELECT * FROM conversations WHERE session_id = $1`,
      { bind: [sessionId] }
    );
    expect(rows.length).toBe(1);
    expect(rows[0].messages.length).toBeGreaterThan(0);
  });

  it('returns availability when heart is mentioned', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ sessionId: `heart-test-${Date.now()}`, message: 'I need to see someone about my heart' });

    expect(res.statusCode).toBe(200);
    expect(res.body.reply.toLowerCase()).toMatch(/dr\. sarah chen|cardiolog|appointment/);
  }, 15000);

  it('handles unknown specialty gracefully', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ sessionId: `lung-test-${Date.now()}`, message: 'I need a lung specialist' });

    expect(res.statusCode).toBe(200);
    expect(res.body.reply.length).toBeGreaterThan(0);
  }, 15000);

  it('returns 500 on missing sessionId', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ message: 'hello' });

    expect(res.statusCode).toBe(500);
  });

  it('retains conversation history across messages', async () => {
    const sid = `history-test-${Date.now()}`;

    await request(app)
      .post('/api/chat')
      .send({ sessionId: sid, message: 'My name is John Smith' });

    const res = await request(app)
      .post('/api/chat')
      .send({ sessionId: sid, message: 'What is my name?' });

    expect(res.body.reply.toLowerCase()).toContain('john');

    await sequelize.query(
      `DELETE FROM conversations WHERE session_id = $1`,
      { bind: [sid] }
    );
  }, 30000);
});