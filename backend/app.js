require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({
  origin: ['http://localhost:5173', 'https://kyronassessment.org'],
  credentials: true
}))
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/chat', require('./routes/chat'));


module.exports = app;