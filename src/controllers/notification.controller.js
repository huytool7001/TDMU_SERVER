import userController from './user.controller.js';
import queue from '../utils/queue.js';
import services from '../utils/services.js';
import dkmhController from './dkmh.controller.js';
import User from '../models/user.js';
import ScheduleNote from '../models/schedule-note.js';

class NotificationController {
  constructor() {}

  notifyAllStudentSchedule = async () => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    console.log(date.toDateString());
    const students = await User.find();
    for await (let student of students) {
      student.schedule.forEach((subject) => {
        if (
          date.toDateString() === subject.ngay_hoc.toDateString() &&
          subject.delay > 0
        ) {
          console.log(subject.ngay_hoc)

          queue.schedule.add(
            { ...subject, deviceToken: student.deviceToken },
            { delay: subject.delay - student.timer.schedule - date.getTime() }
          );

          let lastWeek = new Date(subject.ngay_hoc);
          lastWeek = new Date(lastWeek.getTime() - 3600000 * 24 * 7);

          const lastWeekSchedule = student.schedule.filter(
            (item) => item.ngay_hoc.toDateString() === lastWeek.toDateString()
          );

          if (
            !lastWeekSchedule.find(
              (sameSubject) =>
                sameSubject.subject === subject.subject &&
                sameSubject.room === subject.room &&
                sameSubject.time === subject.time
            )
          ) {
            queue.scheduleUpdate.add({
              ...subject,
              deviceToken: student.deviceToken,
            });
          }
        }
      });

      student.examSchedule.forEach((subject) => {
        if (date.toDateString() === subject.ngay_thi.toDateString()) {
          queue.examSchedule.add(
            { ...subject, deviceToken: student.deviceToken },
            { delay: subject.delay - student.timer.exam - date.getTime() }
          );
        }
      });
    }

    const notes = await ScheduleNote.aggregate([
      {
        $match: { notified: true, date },
      },
      {
        $lookup: {
          from: 'user',
          let: { userId: '$userId' },
          pipeline: [
            { $match: { $expr: { $eq: ['$userId', '$$userId'] } } },
            { $project: { _id: 0, deviceToken: 1 } },
          ],
          as: 'user',
        },
      },
      {
        $unwind: '$user',
      },
    ]);

    notes.forEach((note) => {
      let startTime = note.startTime.split(':');
      startTime = startTime[0] * 3600000 + startTime[1] * 60000;
      queue.noteSchedule.add(
        { title: note.note, deviceToken: note.user.deviceToken },
        { delay: note.date.getTime() + startTime - date.getTime() }
      );
    });
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
          title: 'Thời khóa biểu',
          body: `Bạn sắp có môn học ${subject} vào lúc ${time} tại phòng ${room}`,
        },
      })
      .catch((err) => {
        console.log(err);
      });
  };

  handleExamScheduleNotificationJobQueue = async (job) => {
    console.log(
      '🚀 ~ file: notification.controller.js:28 ~ NotificationController ~ handleExamScheduleNotificationJobQueue= ~ job.data:',
      job.data
    );
    const { subject, time, deviceToken } = job.data;
    await services.firebaseMessaging
      .send({
        token: deviceToken,
        notification: {
          title: 'Lịch thi',
          body: `Bạn có lịch thi môn ${subject} vào lúc ${time}`,
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
              title: 'Thông báo',
              body: article.tieu_de,
            },
          })
          .catch((err) => {
            console.log(err);
          });
      }
    }
  };

  handleScheduleUpdateNotificationJobQueue = async (job) => {
    console.log(
      '🚀 ~ file: notification.controller.js:28 ~ NotificationController ~ handleScheduleUpdateNotificationJobQueue= ~ job.data:',
      job.data
    );
    const { subject, room, time, deviceToken } = job.data;
    await services.firebaseMessaging
      .send({
        token: deviceToken,
        notification: {
          title: 'Thời khóa biểu thay đổi với tuần trước',
          body: `Bạn có môn học ${subject} vào lúc ${time} tại phòng ${room} hôm nay`,
        },
      })
      .catch((err) => {
        console.log(err);
      });
  };

  handleScheduleNoteNotificationJobQueue = async (job) => {
    console.log(
      '🚀 ~ file: notification.controller.js:28 ~ NotificationController ~ handleScheduleNoteNotificationJobQueue= ~ job.data:',
      job.data
    );
    const { title, deviceToken } = job.data;
    await services.firebaseMessaging
      .send({
        token: deviceToken,
        notification: {
          title: 'Ghi chú',
          body: `${title}`,
        },
      })
      .catch((err) => {
        console.log(err);
      });
  };
}

const notificationController = new NotificationController();
export default notificationController;
