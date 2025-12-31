import express from 'express';
import healthRouter from './routes/health.js';
import apiPastesRouter from './routes/pastes.js';
import htmlRouter from './routes/html.js';
import { connectDB } from './config/db.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// API routes
app.use('/api', healthRouter);
app.use('/api', apiPastesRouter);

// HTML route
app.use('/p', htmlRouter);

// Optional root page
app.get('/', (req, res) => {
  res.send('<h1>Pastebin Lite (MongoDB)</h1>');
});

export default app;