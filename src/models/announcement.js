import { Schema, model } from 'mongoose';
import { ANNOUNCEMENT_STATUS } from '../configs/constant.js';

const { Mixed } = Schema.Types;

const schema = new Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    from: {
      type: String,
      required: true,
    },
    faculties: Mixed,
    classes: Mixed,
    at: {
      type: Number,
      required: true,
    },
    status: {
      type:String,
      enum: Object.values(ANNOUNCEMENT_STATUS),
      default: ANNOUNCEMENT_STATUS.UNSENT
    },
    showing: {
      type: Boolean,
      default: true,
    }
  },
  {
    collection: 'announcements',
    timestamps: true,
  }
);

const Announcement = model('announcements', schema);
export default Announcement;
