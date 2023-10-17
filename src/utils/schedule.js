import { scheduleJob } from 'node-schedule';
import notificationController from '../controllers/notification.controller.js';

class Schedule {
  constructor() {}

  load = () => {
    scheduleJob(
      'schedule',
      { hour: 16, minute: 28, second: 0, tz: 'Asia/Ho_Chi_Minh' },
      () => notificationController.notifyAllStudentSchedule()
    );

    scheduleJob('article', '59 59 23 * * *', () =>
      notificationController.notifyArticle()
    );
  };
}

const schedule = new Schedule();
export default schedule;
