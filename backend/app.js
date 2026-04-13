require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./models');

const app = express();
app.use(cors({
  origin: ['http://localhost:5173', 'https://kyronassessment.org', 'http://kyronassessment.org'],
  credentials: true
}));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/conversations', require('./routes/conversations'));
app.use('/api/availability', require('./routes/availability'));
app.use('/api/voice', require('./routes/voice'));

module.exports = app;