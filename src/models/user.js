import { Schema, model } from 'mongoose';
import { NOTIFICATION_TIMER } from '../configs/constant.js';

const { Mixed } = Schema.Types;

const schema = new Schema(
  {
    deviceToken: {
      type: String,
      required: true,
      unique: true,
    },
    userId: String,
    faculty: String,
    class: String,
    appId: String,
    schedule: Mixed,
    examSchedule: Mixed,
    timer: {
      schedule: {
        type: Number,
        default: NOTIFICATION_TIMER.SCHEDULE,
      },
      exam: {
        type: Number,
        default: NOTIFICATION_TIMER.EXAM,
      },
    },
  },
  {
    collection: 'users',
  }
);

const User = model('users', schema);
export default User;
