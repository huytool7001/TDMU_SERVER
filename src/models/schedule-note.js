import { Schema, model } from 'mongoose';

const { Mixed } = Schema.Types;

const schema = new Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: String,
      required: true,
    },
    scheduleId: {
      type: String,
      required: true,
    },
    note: String,
    color: String,
    notified: Boolean,
    timer: Number,
  },
  {
    collection: 'scheduleNote',
    timestamps: true,
  }
);

schema.index({ userId: 1, scheduleId: 1 }, { unique: true });

const ScheduleNote = model('scheduleNote', schema);
export default ScheduleNote;
