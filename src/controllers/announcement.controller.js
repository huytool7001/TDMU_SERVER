import mongoose from 'mongoose';
import Announcement from '../models/announcement.js';
import services from '../utils/services.js';
import User from '../models/user.js';
import queue from '../utils/queue.js';
import { ANNOUNCEMENT_STATUS } from '../configs/constant.js';

class AnnouncementController {
  constructor() {}

  get = async (req, res) => {
    const { id } = req.params;
    const announcement = await Announcement.findOne({ id });
    if (!announcement) {
      return res.status(400).json({ message: 'Announcement not found' });
    }
    return res.status(200).json(announcement);
  };

  search = async (req, res) => {
    const { query } = req;
    if (query.showing) {
      const showing = query.showing.toString().trim().toLowerCase();
      query.showing = showing === 'true';
    }
    const announcements = await Announcement.find(query);
    return res.status(200).json(announcements);
  };

  create = async (req, res) => {
    try {
      const { title, body, from, to, at } = req.body;
      if (!title || !body || !from || !to || !at) {
        return res.status(404).json({
          message: 'title, body, from, to and at fields are required',
        });
      }

      const deviceTokens = await User.find(
        { userId: { $in: to } },
        { _id: 0, deviceToken: 1 }
      );

      const announcement = await Announcement.create({
        ...req.body,
        id: Date.now(),
      });

      if (deviceTokens.length) {
        await queue.announcement.add(
          {
            id: announcement.id,
            title,
            deviceTokens: deviceTokens.map((item) => item.deviceToken),
          },
          { jobId: announcement.id, delay: at - Date.now() }
        );
      }

      return res.status(200).json(announcement);
    } catch (e) {
      return res.status(400).json(e);
    }
  };

  update = async (req, res) => {
    const { id } = req.params;
    console.log(req.body);
    const announcement = await Announcement.findOneAndUpdate({ id }, req.body, {
      new: true,
    });

    if (!announcement) {
      return res.status(400).json({ message: 'Announcement not found' });
    }

    const job = await queue.announcement.getJob(id);
    if (job) {
      job.remove();

      const deviceTokens = await User.find(
        { userId: { $in: announcement.to } },
        { _id: 0, deviceToken: 1 }
      );

      queue.announcement.add(
        {
          id: announcement.id,
          title: announcement.title,
          deviceTokens: deviceTokens.map((item) => item.deviceToken),
        },
        { jobId: announcement.id, delay: announcement.at - Date.now() }
      );
    }

    return res.status(200).json(announcement);
  };

  delete = async (req, res) => {
    const { id } = req.params;
    const announcement = await Announcement.findOneAndDelete({ id });

    const job = await queue.announcement.getJob(id);
    if (job) {
      job.remove();
    }

    return res.status(200).json(announcement);
  };

  handleAnnouncementJobQueue = async (job) => {
    const { title, deviceTokens } = job.data;

    await services.firebaseMessaging
      .sendEachForMulticast({
        tokens: deviceTokens,
        notification: {
          title: 'TDMU',
          body: title,
        },
      })
      .catch((err) => {
        console.log(err);
      });

    await Announcement.findOneAndUpdate(
      { id },
      { status: ANNOUNCEMENT_STATUS.SENT }
    );
  };
}

const announcementController = new AnnouncementController();
export default announcementController;
