import mongoose from 'mongoose';
import Token from '../models/token.js';
import Services from '../utils/services.js';

const { ObjectId } = mongoose.Types;

class TokenController {
  constructor() {}

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
    console.log(
      '🚀 ~ file: token.controller.js:31 ~ TokenController ~ create= ~ deviceToken, userId, appId:',
      deviceToken,
      userId,
      appId
    );
    if (!deviceToken || !userId || !userToken) {
      return res
        .status(404)
        .json({ message: 'deviceToken, userId and userToken is required' });
    }

    return Services.firebaseMessaging
      .send({ token: deviceToken, notification: {title: 'TDMU', body: 'Hello'} })
      .then(async () => {
        const existed = await this.findByToken(deviceToken);
        if (existed) {
          existed.userId = userId;
          existed.appId = appId || '';

          await existed.save();
          return res.status(200).json(existed);
        } else {
          const token = await Token.create({
            _id: new ObjectId(),
            deviceToken,
            userId,
            appId: appId || '',
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

  delete = async (req, res) => {
    const { deviceToken } = req.params;

    const token = await Token.findOneAndDelete({ deviceToken });
    return res.status(200).json(token);
  };
}

const tokenController = new TokenController();
export default tokenController;
