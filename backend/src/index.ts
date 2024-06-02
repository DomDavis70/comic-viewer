import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors'; // Import the CORS middleware

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;
const COMICVINE_API_KEY = process.env.COMICVINE_API_KEY;

// Use the CORS middleware
app.use(cors());

app.get('/api/volumes', async (req, res) => {
  try {
    const response = await fetch(`https://comicvine.gamespot.com/api/volumes/?api_key=${COMICVINE_API_KEY}&format=json&sort=name:asc&limit=10`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching data from Comic Vine API:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});


app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
