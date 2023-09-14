import userController from './user.controller.js';
import queue from '../utils/queue.js';
import services from '../utils/services.js';
import dkmhController from './dkmh.controller.js';

class NotificationController {
  constructor() {}

  notifyAllStudentSchedule = async () => {
    const date = new Date();
    const students = await userController.search();
    for await (let student of students) {
      student.schedule.forEach((subject) => {
        if (date.toDateString() === subject.ngay_hoc.toDateString()) {
          console.log('🚀 ~ Job queue added');
          queue.schedule.add(
            { ...subject, deviceToken: student.deviceToken },
            { delay: subject.delay - student.timer.schedule }
          );
        }
      });
    }
  };

  handleScheduleNotificationJobQueue = async (job) => {
    console.log(
      '🚀 ~ file: notification.controller.js:28 ~ NotificationController ~ handleScheduleNotificationJobQueue= ~ job.data:',
      job.data
    );
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

  notifyArticle = async () => {
    const date = new Date();
    const articles = await dkmhController.getArticle();
    const students = await userController.search();
    for (let article of articles) {
      if (
        new Date(article.ngay_hieu_chinh).toDateString() === date.toDateString()
      ) {
        await services.firebaseMessaging
          .sendEachForMulticast({
            tokens: students.map((student) => student.deviceToken),
            notification: {
              title: 'TDMU',
              body: article.tieu_de,
            },
          })
          .catch((err) => {
            console.log(err);
          });
      }
    }
  };
}

const notificationController = new NotificationController();
export default notificationController;
