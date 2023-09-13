import mongoose from 'mongoose';
import User from '../models/user.js';
import Services from '../utils/services.js';
import dkmhController from './dkmh.controller.js';

const { ObjectId } = mongoose.Types;

class UserController {
  constructor() {}

  search = async () => {
    return User.find().lean();
  };

  findByToken = async (deviceToken) => {
    const user = await User.findOne({ deviceToken });
    return user;
  };

  findByUserIds = async (userIds) => {
    const users = await User.aggregate([
      { $match: { userId: { $in: userIds } } },
      {
        $group: {
          _id: null,
          deviceTokens: { $addToSet: '$deviceToken' },
        },
      },
    ]);

    return users;
  };

  create = async (req, res) => {
    const { deviceToken, userId, userToken, appId } = req.body;
    if (!deviceToken || !userId || !userToken) {
      return res
        .status(404)
        .json({ message: 'deviceToken, userId and userToken is required' });
    }

    return Services.firebaseMessaging
      .send({
        token: deviceToken,
        notification: { title: 'TDMU', body: 'Hello' },
      })
      .then(async () => {
        const semester = await dkmhController.getSemester(userToken);
        let formattedSchedule = [];
        if (semester) {
          const schedule = await dkmhController.getSchedule(
            userToken,
            semester.hoc_ky
          );

          formattedSchedule = await dkmhController.formatSchedule(schedule);
        }

        const existed = await this.findByToken(deviceToken);
        if (existed) {
          existed.userId = userId;
          existed.appId = appId || '';
          existed.schedule = formattedSchedule;

          await existed.save();
          return res.status(200).json(existed);
        } else {
          const user = await User.create({
            _id: new ObjectId(),
            deviceToken,
            userId,
            appId: appId || '',
            schedule: formattedSchedule,
          });

          if (!user) {
            return res.status(404).json({ message: 'Create user failed' });
          }

          return res.status(200).json(user);
        }
      })
      .catch((err) => {
        return res.status(404).json({ message: err });
      });
  };

  update = async (userId, data) => {
    return User.findOneAndUpdate(userId, data);
  };

  delete = async (req, res) => {
    const { deviceToken } = req.params;

    const user = await User.findOneAndDelete({ deviceToken });
    return res.status(200).json(user);
  };
}

const userController = new UserController();
export default userController;
