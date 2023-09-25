import { Schema, model } from 'mongoose';

const { Mixed } = Schema.Types;

const schema = new Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: String,
    avatar: String,
    permission: String,
  },
  {
    collection: 'admin',
    timestamps: true,
  }
);

const Admin = model('admin', schema);
export default Admin;
