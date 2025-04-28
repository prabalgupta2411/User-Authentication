import dotenv from 'dotenv';
dotenv.config();


import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { signup, login } from './controllers/authController';
import { githubAuth } from './controllers/githubAuthController';
import { validateSignup, validateLogin } from './middleware/validation';

// Debug logging for environment variables with actual values (masked)

const app = express();
const PORT = process.env.PORT;
const MONGODB_URI = process.env.MONGODB_URI;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not defined');
}

mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.post('/api/auth/signup', validateSignup, signup);
app.post('/api/auth/login', validateLogin, login);
app.get('/api/auth/github/callback', githubAuth);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 