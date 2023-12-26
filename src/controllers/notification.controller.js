import userController from './user.controller.js';
import queue from '../utils/queue.js';
import services from '../utils/services.js';
import dkmhController from './dkmh.controller.js';
import User from '../models/user.js';

class NotificationController {
  constructor() {}

  notifyAllStudentSchedule = async (req, res) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);

    const students = await User.find();
    for await (let student of students) {
      student.schedule.forEach((subject) => {
        if (
          date.toDateString() === subject.ngay_hoc.toDateString() &&
          subject.delay > 0
        ) {
          queue.schedule.add(
            { ...subject, deviceToken: student.deviceToken },
            {
              delay: subject.delay - student.timer.schedule - date.getTime(),
              jobId: `${subject.ngay_hoc}-${subject.time}`,
              removeOnComplete: true,
              removeOnFail: true,
            }
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
            queue.scheduleUpdate.add(
              {
                ...subject,
                deviceToken: student.deviceToken,
              },
              { removeOnComplete: true, removeOnFail: true }
            );
          }
        }
      });

      student.examSchedule.forEach((subject) => {
        if (
          date.toDateString() === subject.ngay_thi.toDateString() &&
          subject.delay > 0
        ) {
          queue.examSchedule.add(
            { ...subject, deviceToken: student.deviceToken },
            {
              delay: subject.delay - student.timer.exam - date.getTime(),
              jobId: `${subject.ngay_thi}-${subject.time}`,
              removeOnComplete: true,
              removeOnFail: true,
            }
          );
        }
      });
    }

    if (res) {
      return res.status(200).json({ success: true });
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

  handleEventNotificationJobQueue = async (job) => {
    console.log(
      '🚀 ~ file: notification.controller.js:28 ~ NotificationController ~ handleEventNotificationJobQueue= ~ job.data:',
      job.data
    );
    const { title, deviceToken } = job.data;
    await services.firebaseMessaging
      .send({
        token: deviceToken,
        notification: {
          title: 'Sự kiện',
          body: `${title}`,
        },
      })
      .catch((err) => {
        console.log(err);
      });
  };

  notifyChatMessage = async (req, res) => {
    const { channelId, text, userEmail, username } = req.body;
    console.log(
      '🚀 ~ file: notification.controller.js:195 ~ NotificationController ~ notifyChatMessage= ~ channelId, text, userEmail, username:',
      channelId,
      text,
      userEmail,
      username
    );
    const group = await services.firebaseFirestore
      .collection('GROUPS')
      .doc(channelId)
      .get();

    const members = group
      .data()
      .members.filter((member) => member !== userEmail);

    const users = await User.find({ email: { $in: members } }, 'deviceToken');

    if (users.length) {
      await services.firebaseMessaging
        .sendEachForMulticast({
          tokens: users.map((user) => user.deviceToken),
          notification: {
            title: group.data().name,
            body: `${username}: ${text}`,
          },
        })
        .catch((err) => {
          console.log(err);
        });
    }

    return res.status(200).json({ message: 'Send notification successfully' });
  };
}

const notificationController = new NotificationController();
export default notificationController;
