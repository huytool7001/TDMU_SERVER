import { Schema, model } from 'mongoose';

const schema = new Schema(
  {
    deviceToken: {
      type: String,
      required: true,
      unique: true,
    },
    userId: String,
    appId: String,
  },
  {
    collection: 'tokens',
  }
);

const Token = model('tokens', schema);
export default Token;
