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
    const announcement = await Announcement.findOne(
      { id },
      { _id: 0, createdAt: 0, updatedAt: 0, __v: 0 }
    );
    if (!announcement) {
      return res.status(400).json({ error: 'Announcement not found' });
    }
    return res.status(200).json(announcement);
  };

  search = async (req, res) => {
    const { query } = req;
    console.log(
      '🚀 ~ file: announcement.controller.js:22 ~ AnnouncementController ~ search= ~ query:',
      query
    );

    const limit = query && query.limit ? parseInt(query.limit) : 0;
    const skip = query && query.skip ? parseInt(query.skip) : 0;
    const sort = query && query.sort ? JSON.parse(query.sort) : { id: 1 };

    delete query.limit;
    delete query.skip;
    delete query.sort;

    if (query.showing) {
      const showing = query.showing.toString().trim().toLowerCase();
      query.showing = showing === 'true';
    }

    if (query.title !== undefined) {
      query.title = { $regex: '.*' + query.title + '.*', $options: 'i' };
    }

    const announcements = await Announcement.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const totalCount = await Announcement.count(query);

    return res.status(200).json({ announcements, totalCount });
  };

  create = async (req, res) => {
    try {
      const { title, body, from, at, faculties, classes } = req.body;
      if (!title || !body || !from || !at) {
        return res.status(400).json({
          error: 'Please fill in all fields',
        });
      }
      
      const announcement = await Announcement.create({
        ...req.body,
        id: Date.now(),
      });

      const query = {};
      if (faculties?.length && !faculties.includes('ALL')) {
        query.faculty = { $in: faculties };
      }

      if (classes?.length && !classes.includes('ALL')) {
        query.class = { $in: classes };
      }
  
      const deviceTokens = await User.find({ ...query }, { _id: 0, deviceToken: 1 });

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
    } catch (err) {
      console.log("🚀 ~ file: announcement.controller.js:98 ~ AnnouncementController ~ create= ~ err:", err)
      return res.status(400).json(err);
    }
  };

  update = async (req, res) => {
    const { id } = req.params;
    console.log(req.body);

    const { title, body, from, at } = req.body;
    if (!title || !body || !from || !at) {
      return res.status(400).json({
        error: 'Please fill in all fields',
      });
    }

    const announcement = await Announcement.findOneAndUpdate({ id }, req.body, {
      new: true,
    });

    if (!announcement) {
      return res.status(400).json({ error: 'Announcement not found' });
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

  deleteMany = async (req, res) => {
    let { ids } = req.query;
    console.log(
      '🚀 ~ file: announcement.controller.js:130 ~ AnnouncementController ~ deleteMany ~ ids:',
      ids
    );
    ids = ids.split(',') || [];
    const announcements = await Announcement.deleteMany({ id: { $in: ids } });

    for await (let id of ids) {
      const job = await queue.announcement.getJob(id);
      if (job) {
        await job.remove();
      }
    }

    return res.status(200).json(announcements);
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
