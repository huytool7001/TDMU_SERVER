import mongoose from 'mongoose';
import { DATABASE_URL } from '../configs/constant.js';
class Database {
  constructor() {}

  load = () => {
    mongoose.set('autoIndex', true);
    mongoose.set('debug', true);

    return mongoose
      .connect(DATABASE_URL, {
        useNewUrlParser: true,
        dbName: 'TDMU',
        autoIndex: true,
      })
      .then(async () => {
        console.log('[MongoDB] Database connected');
        return Promise.resolve();
      })
      .catch((error) => {
        console.log(error);
        return Promise.reject(error);
      });
  }
}

const database = new Database();
export default database;
