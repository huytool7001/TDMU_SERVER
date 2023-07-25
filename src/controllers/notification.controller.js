import tokenController from './token.controller.js';
import queue from '../utils/queue.js';
import services from '../utils/services.js';

class NotificationController {
  constructor() {}

  scheduleNotify = async (req, res) => {
    const { schedule, userId } = req.body;

    let deviceTokens = await tokenController.findByUserIds([userId]);
    deviceTokens = deviceTokens[0].deviceTokens;

    try {
      schedule?.ds_tuan_tkb.forEach((tuan) => {
        tuan.ds_thoi_khoa_bieu.forEach(async (thoi_khoa_bieu) => {
          const gio_bat_dau = schedule.ds_tiet_trong_ngay.find(
            (tiet) => tiet.tiet === thoi_khoa_bieu.tiet_bat_dau
          ).gio_bat_dau;

          let startTime = gio_bat_dau.split(':');
          startTime =
            parseInt(startTime[0], 10) * 3600000 +
            parseInt(startTime[1], 10) * 60000;

          const date = new Date(thoi_khoa_bieu.ngay_hoc);
          const delay = date.getTime() + startTime - Date.now() - 15 * 60000;

          if (delay > 0) {
            await queue.schedule.add(
              {
                schedule: thoi_khoa_bieu,
                deviceTokens,
                startTime: gio_bat_dau,
              },
              {
                delay,
              }
            );
          }
        });
      });
    } catch (err) {
      console.log(err);
      return res.status(400).json(err);
    }

    return res.status(400).json({ message: 'successfully' });
  };

  handleScheduleNotificationJob = async (job) => {
    const { schedule, startTime, deviceTokens } = job.data;
    await services.firebaseMessaging
      .sendEachForMulticast({
        tokens: deviceTokens,
        notification: {
          title: 'TDMU',
          body: `Bạn sắp có môn học ${schedule.ten_mon} vào lúc ${startTime} tại phòng ${schedule.ma_phong}`,
        },
      })
      .catch((err) => {
        console.log(err);
      });
  };
}

const notificationController = new NotificationController();
export default notificationController;
