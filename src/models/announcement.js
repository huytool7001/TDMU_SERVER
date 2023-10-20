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
    faculties: {
      type: Mixed,
      default: [],
    },
    classes: {
      type: Mixed,
      default: [],
    },
    at: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ANNOUNCEMENT_STATUS),
      default: ANNOUNCEMENT_STATUS.UNSENT,
    },
    showing: {
      type: Boolean,
      default: true,
    },
    files: Mixed,
    replies: Mixed,
  },
  {
    collection: 'announcement',
    timestamps: true,
  }
);

const Announcement = model('announcement', schema);
export default Announcement;
