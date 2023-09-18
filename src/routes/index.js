import express from 'express';
import userRouter from './user.js';
import notificationRouter from './notification.js';
import announcementRouter from './announcement.js';

const app = express();
app.use('/users', userRouter);
app.use('/notifications', notificationRouter);
app.use('/announcements', announcementRouter);

export default app;
