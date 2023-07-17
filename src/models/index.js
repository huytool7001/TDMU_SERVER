import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const loadDatabase = async () => {
  mongoose.set('autoIndex', true);

  return mongoose
    .connect(process.env.DATABASE_URL, {
      useNewUrlParser: true,
      dbName: 'TDMU',
      autoIndex: true,
    })
    .then(async () => {
      console.log('[MongoDB] Database Transport connected');
      return Promise.resolve();
    })
    .catch((error) => {
      console.log(error);
      return Promise.reject(error);
    });
};

export default loadDatabase;
