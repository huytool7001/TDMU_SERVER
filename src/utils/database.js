import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

class Database {
  constructor() {}

  load = () => {
    mongoose.set('autoIndex', true);

    return mongoose
      .connect(process.env.DATABASE_URL, {
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
