const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
// Increased limit to 10mb since it will sync your entire trip history at once
app.use(express.json({ limit: '10mb' })); 

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB successfully'))
  .catch((err) => console.error('Failed to connect to MongoDB:', err));

// New Master Schema: Stores everything in one document
const syncSchema = new mongoose.Schema({
  profile: { type: Object, default: {} },
  expenses: { type: Array, default: [] },
  trips: { type: Array, default: [] }
}, { timestamps: true });

const AppData = mongoose.model('AppData', syncSchema);

// API Routes

// GET: Send all data to the React frontend on initial load
app.get('/api/expenses', async (req, res) => {
  try {
    let data = await AppData.findOne();
    if (!data) {
      data = await AppData.create({});
    }
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST: Receive the bulk sync from React and overwrite the old save
app.post('/api/expenses', async (req, res) => {
  try {
    const { profile, expenses, trips } = req.body;
    let data = await AppData.findOne();
    
    if (!data) {
      data = new AppData({ profile, expenses, trips });
    } else {
      data.profile = profile;
      data.expenses = expenses;
      data.trips = trips;
    }
    
    await data.save();
    res.status(200).json({ message: 'Cloud synced successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});