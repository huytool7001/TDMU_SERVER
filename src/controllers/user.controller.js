import mongoose from 'mongoose';
import User from '../models/user.js';
import Services from '../utils/services.js';
import dkmhController from './dkmh.controller.js';

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
    const { deviceToken, userId, userToken, appId } = req.body;
    if (!deviceToken || !userId || !userToken) {
      return res
        .status(400)
        .json({ message: 'deviceToken, userId and userToken is required' });
    }

    return Services.firebaseMessaging
      .send({
        token: deviceToken,
        notification: { title: 'TDMU', body: 'Hello' },
      }, true)
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

          examSchedule = await dkmhController.getExamSchedule(userToken, semester.hoc_ky);
        }

        const existed = await User.findOne({ deviceToken });
        if (existed) {
          existed.userId = userId;
          existed.appId = appId || '';
          existed.schedule = schedule;
          existed.examSchedule = examSchedule;
          existed.class = profile.lop || '';
          existed.faculty = profile.khoa || '';

          await existed.save();
          return res.status(200).json(existed);
        } else {
          const user = await User.create({
            _id: new ObjectId(),
            deviceToken,
            userId,
            appId: appId || '',
            schedule,
            examSchedule,
            class: profile.lop,
            faculty: profile.khoa,
          });

          if (!user) {
            return res.status(400).json({ message: 'Create user failed' });
          }

          return res.status(200).json(user);
        }
      })
      .catch((err) => {
        return res.status(400).json({ message: err });
      });
  };

  update = async (req, res) => {
    const { deviceToken } = req.params;
    console.log(req.body);
    const user = await User.findOneAndUpdate({ deviceToken }, req.body);

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }
    
    return res.status(200).json(user);
  };

  delete = async (req, res) => {
    const { deviceToken } = req.params;
    const user = await User.findOneAndDelete({ deviceToken });
    return res.status(200).json(user);
  };
}

const userController = new UserController();
export default userController;
