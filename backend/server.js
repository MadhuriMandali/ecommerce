const express = require('express');
const cors = require('cors');
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();

app.use(cors({
  origin: 'https://ecommerce-ecru-one-18.vercel.app/',
  credentials:true
}));
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Backend is running!');
});

app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
