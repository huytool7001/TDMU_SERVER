import { Schema, model } from 'mongoose';

const { Mixed } = Schema.Types;

const schema = new Schema(
  {
    scheduleId: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    text: String,
  },
  {
    collection: 'scheduleNote',
    timestamps: true,
  }
);

schema.index({ scheduleId: 1, userId: 1 }, { unique: true });

const ScheduleNote = model('scheduleNote', schema);
export default ScheduleNote;
