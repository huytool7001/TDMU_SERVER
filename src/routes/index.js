import express from 'express';
import userRouter from './user.js';
import notificationRouter from './notification.js';
import announcementRouter from './announcement.js';
import adminRouter from './admin.js';
import scheduleNoteRouter from './schedule-note.js';
import eventRouter from './event.js';
import firebaseRouter from './firebase.js';

const app = express();
app.use('/users', userRouter);
app.use('/notifications', notificationRouter);
app.use('/announcements', announcementRouter);
app.use('/admins', adminRouter);
app.use('/schedule-notes', scheduleNoteRouter);
app.use('/events', eventRouter);
app.use('/firebase', firebaseRouter);

export default app;
