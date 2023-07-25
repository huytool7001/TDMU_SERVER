import express from 'express';
import tokenRouter from './token.js';
import notificationRouter from './notification.js';

const app = express();
app.use('/tokens', tokenRouter);
app.use('/notifications', notificationRouter);

export default app;
