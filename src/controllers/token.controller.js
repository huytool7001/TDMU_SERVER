import mongoose from 'mongoose';
import Token from '../models/token.js';
import Services from '../utils/services.js';
import dkmhController from './dkmh.controller.js';

const { ObjectId } = mongoose.Types;

class TokenController {
  constructor() {}

  search = async () => {
    return Token.find().lean();
  };

  findByToken = async (deviceToken) => {
    const token = await Token.findOne({ deviceToken });
    return token;
  };

  findByUserIds = async (userIds) => {
    const tokens = await Token.aggregate([
      { $match: { userId: { $in: userIds } } },
      {
        $group: {
          _id: null,
          deviceTokens: { $addToSet: '$deviceToken' },
        },
      },
    ]);

    return tokens;
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
          const token = await Token.create({
            _id: new ObjectId(),
            deviceToken,
            userId,
            appId: appId || '',
            schedule: formattedSchedule,
          });

          if (!token) {
            return res.status(404).json({ message: 'Create token failed' });
          }

          return res.status(200).json(token);
        }
      })
      .catch((err) => {
        return res.status(404).json({ message: err });
      });
  };

  update = async (userId, data) => {
    return Token.findOneAndUpdate(userId, data);
  };

  delete = async (req, res) => {
    const { deviceToken } = req.params;

    const token = await Token.findOneAndDelete({ deviceToken });
    return res.status(200).json(token);
  };
}

const tokenController = new TokenController();
export default tokenController;
