import dotenv from 'dotenv';

dotenv.config();

export const DATABASE_URL = process.env.DATABASE_URL;

export const DKMH_API_URL = process.env.DKMH_API_URL;

export const SECRET_KEY = process.env.SECRET_KEY;

export const FIREBASE_DB_URL = process.env.FIREBASE_DB_URL;

export const REDIS_HOST = process.env.REDIS_HOST;

export const REDIS_PORT = process.env.REDIS_PORT;

export const REDIS_PASSWORD = process.env.REDIS_PASSWORD;

export const NOTIFICATION_TIMER = {
  SCHEDULE: 15 * 60000, // 15 minutes
  EXAM: 60 * 60000, // 60 minutes
};

export const ANNOUNCEMENT_STATUS = {
  UNSENT: '0',
  SENT: '1'
}

export const ADMIN_PERMISSION = {
  FULL: '0',
  ANNOUNCE: '1',
}
