import express from 'express';
import userRouter from './user.js';
import notificationRouter from './notification.js';

const app = express();
app.use('/users', userRouter);
app.use('/notifications', notificationRouter);

export default app;
