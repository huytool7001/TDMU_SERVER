import { Schema, model } from 'mongoose';

const { Mixed } = Schema.Types;

const schema = new Schema(
  {
    deviceToken: {
      type: String,
      required: true,
      unique: true,
    },
    userId: String,
    appId: String,
    schedule: Mixed,
  },
  {
    collection: 'tokens',
  }
);

const Token = model('tokens', schema);
export default Token;
