import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import http from 'http';
import router from './src/routes/index.js';
import loadDatabase from './src/models/index.js';

const app = express();
const server = http.createServer(app);
server.listen(8000, (req, res) => {
  console.log('Server is started');
});

app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use([bodyParser.json(), bodyParser.urlencoded({ extended: false })]);
app.use('/v1', router);

loadDatabase();