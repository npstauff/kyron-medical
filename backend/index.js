const app = require('./app');
const sequelize = require('./models');

app.use('/api/conversations', require('./routes/conversations'));

const PORT = process.env.PORT || 3001;

sequelize.authenticate()
  .then(() => {
    console.log('DB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error('DB connection failed:', err));