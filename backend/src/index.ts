import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/db';
import routes from './routes';
import { scheduleNightlyAggregation } from './jobs/scheduler';

dotenv.config();

console.log(`NODE_ENV is set to: ${process.env.NODE_ENV}`);

// Connect to DB only if not in test environment
if (process.env.NODE_ENV !== 'test') {
    connectDB();
}

const app = express();
const port = process.env.PORT || 5000;

// Security Middleware
app.use(cors());
app.use(helmet());

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api', limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);

// Start the cron job for nightly aggregations
if (process.env.NODE_ENV !== 'test') {
    scheduleNightlyAggregation();
}

app.get('/', (req, res) => {
  res.send('Teacher Evaluation System API is running!');
});

const server = app.listen(port, () => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`Server is running on port ${port}`);
  }
});

export { app, server };

export default app;
