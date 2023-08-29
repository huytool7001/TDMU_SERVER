import { scheduleJob } from 'node-schedule';
import notificationController from '../controllers/notification.controller.js';

class Schedule {
  constructor() {}

  load = () => {
    scheduleJob('notification', '0 0 0 * * *', () =>
      notificationController.scheduleAllStudents()
    );
  };
}

const schedule = new Schedule();
export default schedule;
