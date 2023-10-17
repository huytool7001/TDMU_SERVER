import { scheduleJob } from 'node-schedule';
import notificationController from '../controllers/notification.controller.js';

class Schedule {
  constructor() {}

  load = () => {
    scheduleJob('schedule', '0 55 10 * * *', () =>
      notificationController.notifyAllStudentSchedule()
    );

    scheduleJob('article', '59 59 23 * * *', () =>
      notificationController.notifyArticle()
    );
  };
}

const schedule = new Schedule();
export default schedule;
