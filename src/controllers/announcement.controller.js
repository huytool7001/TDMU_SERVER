import mongoose from 'mongoose';
import Announcement from '../models/announcement.js';
import services from '../utils/services.js';
import User from '../models/user.js';
import queue from '../utils/queue.js';
import { ANNOUNCEMENT_STATUS } from '../configs/constant.js';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

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
    let { query } = req;
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

    if (query.userId) {
      const user = await User.findOne({ userId: query.userId }).lean();
      if (user) {
        query = {
          ...query,
          $or: [
            { faculties: { $in: [user.faculty, 'ALL'] } },
            { classes: { $in: [user.class, 'ALL'] } },
          ],
          at: { $lte: new Date().getTime() },
        };
      }
      delete query.userId;
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

      const files = [];
      for await (let file of req.files) {
        file.originalname = Buffer.from(file.originalname, 'latin1').toString(
          'utf8'
        );
        const storageRef = ref(
          services.firebaseStorage,
          `${file.originalname + '_' + Date.now()}`
        );
        const snapshot = await uploadBytes(
          storageRef,
          file.buffer,
          file.mimetype
        );

        const path = await getDownloadURL(snapshot.ref);
        files.push({
          name: file.originalname,
          path,
        });
      }

      const announcement = await Announcement.create({
        ...req.body,
        id: Date.now(),
        files,
      });

      const query = {};
      if (faculties?.length && !faculties.includes('ALL')) {
        query.faculty = { $in: faculties };
      }

      if (classes?.length && !classes.includes('ALL')) {
        query.class = { $in: classes };
      }

      const deviceTokens = await User.find(
        { ...query },
        { _id: 0, deviceToken: 1 }
      );

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
      return res.status(400).json(err);
    }
  };

  update = async (req, res) => {
    const { id } = req.params;
    console.log(req.body);

    const { title, body, from, at, curFiles } = req.body;
    if (!title || !body || !from || !at) {
      return res.status(400).json({
        error: 'Please fill in all fields',
      });
    }

    const files = [];
    curFiles?.forEach((curFile) => files.push(JSON.parse(curFile)));

    for await (let file of req.files) {
      file.originalname = Buffer.from(file.originalname, 'latin1').toString(
        'utf8'
      );
      const storageRef = ref(
        services.firebaseStorage,
        `${Date.now() + '_' + file.originalname}`
      );
      const snapshot = await uploadBytes(
        storageRef,
        file.buffer,
        file.mimetype
      );

      const path = await getDownloadURL(snapshot.ref);
      files.push({
        name: file.originalname,
        path,
      });
    }

    const announcement = await Announcement.findOneAndUpdate(
      { id },
      { ...req.body, files },
      {
        new: true,
      }
    );

    if (!announcement) {
      return res.status(400).json({ error: 'Announcement not found' });
    }

    const job = await queue.announcement.getJob(id);
    if (job) {
      await job.remove();

      const deviceTokens = await User.find(
        { userId: { $in: announcement.to } },
        { _id: 0, deviceToken: 1 }
      );

      await queue.announcement.add(
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
      await job.remove();
    }

    return res.status(200).json(announcement);
  };

  deleteMany = async (req, res) => {
    let { ids } = req.query;
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
    const { id, title, deviceTokens } = job.data;

    await services.firebaseMessaging
      .sendEachForMulticast({
        tokens: deviceTokens,
        notification: {
          title: 'Thông báo',
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

  studentReply = async (req, res) => {
    const { id } = req.params;
    const { studentId } = req.body;
    const announcement = await Announcement.findOneAndUpdate(
      {
        id,
      },
      [
        {
          $set: {
            replies: {
              $cond: [
                {
                  $in: [
                    studentId,
                    {
                      $ifNull: ['$replies.studentId', []],
                    },
                  ],
                },
                {
                  $map: {
                    input: '$replies',
                    in: {
                      $mergeObjects: [
                        '$$this',
                        {
                          $cond: [
                            {
                              $eq: ['$$this.studentId', studentId],
                            },
                            req.body,
                            {},
                          ],
                        },
                      ],
                    },
                  },
                },
                {
                  $concatArrays: [
                    {
                      $ifNull: ['$replies', []],
                    },
                    [req.body],
                  ],
                },
              ],
            },
          },
        },
      ],
      {
        upsert: true,
        new: true,
      }
    );

    return res.status(200).json(announcement);
  };
}

const announcementController = new AnnouncementController();
export default announcementController;
