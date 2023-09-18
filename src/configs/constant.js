import dotenv from 'dotenv';

dotenv.config();

export const DATABASE_URL = process.env.DATABASE_URL;

export const DKMH_API_URL = process.env.DKMH_API_URL;

export const NOTIFICATION_TIMER = {
  SCHEDULE: 15 * 60000, // 15 minutes
  EXAM: 60 * 60000, // 60 minutes
};

export const ANNOUNCEMENT_STATUS = {
  UNSENT: '0',
  SENT: '1'
}
