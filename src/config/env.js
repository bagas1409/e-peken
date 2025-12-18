import dotenv from 'dotenv';
import path from 'path';

// Load .env file
dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
};

export const isProd = env.NODE_ENV === 'production';
