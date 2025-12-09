import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/db';
import routes from './routes';
import { errorHandler } from './middleware/errorMiddleware';

dotenv.config();
console.log(`NODE_ENV is set to: ${process.env.NODE_ENV}`);

// Connect to DB only if not in test environment
if (process.env.NODE_ENV !== 'test') {
    connectDB();
}

const app = express();
const port = process.env.PORT || 5000;

// CORS Configuration
const allowedOrigins = [
    'https://teacher-evaluation-eta.vercel.app',
    'http://localhost:3000', // for local frontend development
    'http://localhost:5173', // Vite's default port, just in case
];

const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    }
};

app.set('trust proxy', 1); // Trust the first hop from the proxy

// Security Middleware
app.use(cors(corsOptions));
app.use(helmet());

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 900, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api', limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);

// Custom Error Handler
app.use(errorHandler);

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
