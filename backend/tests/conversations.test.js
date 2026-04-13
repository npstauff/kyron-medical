const request = require('supertest');
const app = require('../app');
const sequelize = require('../models');

describe('Conversations route', () => {
  const sessionId = `conv-test-${Date.now()}`;

  afterAll(async () => {
    await sequelize.query(
      `DELETE FROM conversations WHERE session_id = :sessionId`,
      { replacements: { sessionId } }
    );
    await sequelize.close();
  });

  it('GET /api/conversations/:sessionId returns empty for new session', async () => {
    const res = await request(app).get(`/api/conversations/${sessionId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.messages).toEqual([]);
  });

  it('returns messages after a chat interaction', async () => {
    await request(app)
      .post('/api/chat')
      .send({ sessionId, message: 'Hello' });

    const res = await request(app).get(`/api/conversations/${sessionId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.messages.length).toBeGreaterThan(0);
  }, 15000);

  it('messages have correct role and text fields', async () => {
    const res = await request(app).get(`/api/conversations/${sessionId}`);
    res.body.messages.forEach(m => {
      expect(m).toHaveProperty('role');
      expect(m).toHaveProperty('text');
      expect(['user', 'assistant']).toContain(m.role);
      expect(typeof m.text).toBe('string');
    });
  });
});