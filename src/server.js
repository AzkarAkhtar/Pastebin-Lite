import app from './app.js';
import { connectDB } from './config/db.js';
import dotenv from 'dotenv';
dotenv.config();

// Connect to the database before starting the server
await connectDB();

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});