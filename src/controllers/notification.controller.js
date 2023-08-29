import tokenController from './token.controller.js';
import queue from '../utils/queue.js';
import services from '../utils/services.js';

class NotificationController {
  constructor() {}

  scheduleAllStudents = async () => {
    const date = new Date();
    const students = await tokenController.search();
    for await (let student of students) {
      student.schedule.forEach((subject) => {
        if (date.toDateString() === subject.ngay_hoc.toDateString()) {
          console.log('🚀 ~ Job queue added');
          queue.schedule.add(
            { ...subject, deviceToken: student.deviceToken },
            { delay: subject.delay }
          );
        }
      });
    }
  };

  handleScheduleNotificationJobQueue = async (job) => {
    console.log("🚀 ~ file: notification.controller.js:28 ~ NotificationController ~ handleScheduleNotificationJobQueue= ~ job.data:", job.data)
    const { subject, room, time, deviceToken } = job.data;
    await services.firebaseMessaging
      .send({
        token: deviceToken,
        notification: {
          title: 'TDMU',
          body: `Bạn sắp có môn học ${subject} vào lúc ${time} tại phòng ${room}`,
        },
      })
      .catch((err) => {
        console.log(err);
      });
  };
}

const notificationController = new NotificationController();
export default notificationController;
