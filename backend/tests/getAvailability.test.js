const sequelize = require('../models');
const getAvailability = require('../tools/getAvailability');

describe('getAvailability', () => {
  afterAll(async () => await sequelize.close());

  it('returns slots for heart', async () => {
    const slots = await getAvailability('heart');
    expect(Array.isArray(slots)).toBe(true);
    expect(slots.length).toBeGreaterThan(0);
    expect(slots[0]).toHaveProperty('provider_name');
    expect(slots[0]).toHaveProperty('slot_time');
  });

  it('returns slots for skin', async () => {
    const slots = await getAvailability('skin');
    expect(slots.length).toBeGreaterThan(0);
    expect(slots[0].body_part.toLowerCase()).toContain('skin');
  });

  it('returns empty array for unrecognized body part', async () => {
    const slots = await getAvailability('lungs');
    expect(Array.isArray(slots)).toBe(true);
    expect(slots.length).toBe(0);
  });

  it('only returns unbooked slots', async () => {
    const slots = await getAvailability('heart');
    slots.forEach(slot => {
      expect(slot.is_booked).not.toBe(true);
    });
  });

  it('only returns future slots', async () => {
    const slots = await getAvailability('heart');
    const now = new Date();
    slots.forEach(slot => {
      expect(new Date(slot.slot_time)).toBeGreaterThan(now);
    });
  });
});