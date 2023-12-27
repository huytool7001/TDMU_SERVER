import mongoose from 'mongoose';
import User from '../models/user.js';
import Services from '../utils/services.js';
import dkmhController from './dkmh.controller.js';
import { MS_DIFF, TEST_SCHEDULE, TEST_USER_ID } from '../configs/constant.js';
import Event from '../models/event.js';
import queue from '../utils/queue.js';

const { ObjectId } = mongoose.Types;

class UserController {
  constructor() {}

  get = async (req, res) => {
    const { deviceToken } = req.params;
    const user = await User.findOne({ deviceToken });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }
    return res.status(200).json(user);
  };

  create = async (req, res) => {
    const { deviceToken, userId, userToken, appId, email, name } = req.body;
    if (!deviceToken || !userId || !userToken || !email) {
      return res
        .status(400)
        .json({ message: 'deviceToken, userId, userToken, email is required' });
    }

    return Services.firebaseMessaging
      .send(
        {
          token: deviceToken,
          notification: { title: 'TDMU', body: 'Hello' },
        },
        true
      )
      .then(async () => {
        const profile = await dkmhController.getProfile(userToken);

        const semester = await dkmhController.getSemester(userToken);
        let schedule = [];
        let examSchedule = [];
        if (semester) {
          schedule = await dkmhController.getSchedule(
            userToken,
            semester.hoc_ky
          );

          examSchedule = await dkmhController.getExamSchedule(
            userToken,
            semester.hoc_ky
          );
        }

        const existed = await User.findOne({ deviceToken });
        if (existed) {
          try {
            existed.userId = userId;
            existed.appId = appId || '';
            existed.email = email || '';
            existed.name = name || '';
            if (userId === TEST_USER_ID) {
              const testSchedule = TEST_SCHEDULE;
              const date = new Date();
              date.setHours(0, 0, 0, 0);
              let startTime = testSchedule.time.split(':');
              startTime =
                parseInt(startTime[0], 10) * 3600000 +
                parseInt(startTime[1], 10) * 60000;

              testSchedule.delay = date.getTime() + startTime;
              schedule.push(testSchedule);
            }
            existed.schedule = schedule;
            existed.examSchedule = examSchedule;
            existed.class = profile?.lop || '';
            existed.faculty = profile?.khoa || '';

            await existed.save();
          } catch (err) {
            console.log(err);
          }

          await User.deleteMany({
            userId,
            deviceToken: { $ne: deviceToken },
          });
          return res.status(200).json(existed);
        } else {
          const user = await User.create({
            _id: new ObjectId(),
            deviceToken,
            userId,
            email,
            name,
            appId: appId || '',
            schedule,
            examSchedule,
            class: profile.lop,
            faculty: profile.khoa,
          });

          if (!user) {
            return res.status(400).json({ message: 'Create user failed' });
          }

          await User.deleteMany({
            userId,
            deviceToken: { $ne: deviceToken },
          });
          return res.status(200).json(user);
        }
      })
      .catch((err) => {
        return res.status(400).json({ message: err });
      });
  };

  update = async (req, res) => {
    const { deviceToken } = req.params;
    const user = await User.findOneAndUpdate({ deviceToken }, req.body);

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (
      req.body.timer?.event !== null &&
      req.body.timer?.event !== undefined &&
      req.body.timer?.event !== NaN &&
      req.body.timer?.event !== user.timer.event
    ) {
      const notes = await Event.find({ userId: user.userId });
      notes.forEach(async (note) => {
        const job = await queue.event.getJob(note.id);
        if (job) {
          await job.remove();
        }

        const delay =
          note.start - new Date().getTime() - MS_DIFF - req.body.timer.event;

        if (delay > 0) {
          queue.event.add(
            { title: note.title, userId: user.userId },
            {
              jobId: note.id,
              delay,
              removeOnComplete: true,
              removeOnFail: true,
            }
          );
        }
      });
    }

    if (
      req.body.timer?.schedule !== null &&
      req.body.timer?.schedule !== undefined &&
      req.body.timer?.schedule !== NaN &&
      req.body.timer?.schedule !== user.timer.schedule
    ) {
      const date = new Date();
      user.schedule.forEach(async (subject) => {
        if (
          date.toDateString() === subject.ngay_hoc.toDateString() &&
          subject.delay > 0
        ) {
          const job = await queue.schedule.getJob(
            `${subject.ngay_hoc}-${subject.time}`
          );
          if (job) {
            await job.remove();
          }

          const delay =
            subject.delay - req.body.timer.schedule - date.getTime();
          if (delay > 0) {
            queue.schedule.add(
              { ...subject, userId: user.userId },
              {
                jobId: `${subject.ngay_hoc}-${subject.time}`,
                delay,
                removeOnComplete: true,
                removeOnFail: true,
              }
            );
          }
        }
      });
    }

    return res.status(200).json(user);
  };

  delete = async (req, res) => {
    const { deviceToken } = req.params;
    const user = await User.findOneAndDelete({ deviceToken });

    const notes = await Event.find({ userId: user.userId });
    notes.forEach(async (note) => {
      const job = await queue.event.getJob(note.id);
      if (job) {
        await job.remove();
      }
    });

    return res.status(200).json(user);
  };
}

const userController = new UserController();
export default userController;
