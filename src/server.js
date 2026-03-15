import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { connectMongoDB } from './db/connectMongoDB.js';

const requiredEnvVars = ['MONGO_URL', 'JWT_SECRET'];
const missing = requiredEnvVars.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Missing required env: ${missing.join(', ')}`);
  process.exit(1);
}
import { logger } from './middleware/logger.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errors } from 'celebrate';
import { errorHandler } from './middleware/errorHandler.js';

import notesRoutes from './routes/notesRoutes.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import cookieParser from 'cookie-parser';

const app = express();
const PORT = Number.parseInt(process.env.PORT, 10) || 3000;

const isProduction = process.env.NODE_ENV === 'production';

app.use(logger);
app.use(express.json());
app.use(
  cors({
    origin: isProduction && process.env.FRONTEND_DOMAIN
      ? process.env.FRONTEND_DOMAIN
      : true,
    credentials: true,
  }),
);
app.use(cookieParser());

app.use(authRoutes);
app.use(notesRoutes);
app.use(userRoutes);

app.use(notFoundHandler);
app.use(errors());
app.use(errorHandler);

await connectMongoDB();

app.listen(PORT, (error) => {
  if (error) {
    throw error;
  }
  console.log(`Server is running on port ${PORT}`);
});
