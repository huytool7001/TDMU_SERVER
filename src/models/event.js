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
    title: String,
    summary: String,
    color: String,
    notified: Boolean,
    timer: Number,
    start: Number,
    end: Number,
  },
  {
    collection: 'event',
    timestamps: true,
  }
);

const ScheduleNote = model('event', schema);
export default ScheduleNote;
