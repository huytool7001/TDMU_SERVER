import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import http from 'http';
import router from './src/routes/index.js';
import Database from './src/utils/database.js';
import Services from './src/utils/services.js';
import Queue from './src/utils/queue.js';
import Schedule from './src/utils/schedule.js';

const load = async () => {
  const app = express();

  app.use(cors());
  app.use(cookieParser());
  app.use(express.json());
  app.use([bodyParser.json(), bodyParser.urlencoded({ extended: false })]);
  app.use('/v1', router);

  await Database.load();
  await   Services.load();
  await   Queue.load();
  await Schedule.load();
  const server = http.createServer(app);

  server.listen(process.env.PORT || 8000);
};

load()
  .then(() => {
    console.log('Server started !');
  })
  .catch((error) => {
    console.log('Server is crashed: ', error);
    process.exit(1);
  });
