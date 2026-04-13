require('dotenv').config()
const express = require('express');
const cors = require('cors');
const sequelize = require('./models');

const app = express();
app.use(express.json());
app.use(cors());

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
})

app.use('/api/chat', require('./routes/chat'));

const PORT = process.env.PORT || 3001;

sequelize.authenticate()
    .then(() => {
        console.log("DB Connected");
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    
    })
    .catch((err) => {
        console.error('Unable to connect to the database:', err);
    });