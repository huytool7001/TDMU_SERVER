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
    const sort = query && query.sort ? JSON.parse(query.sort) : { at: 1 };

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
            {
              faculties: {
                $in: [
                  user.faculty,
                  'ALL',
                  `${user.faculty} (${user.class.substring(0, 3)})`,
                ],
              },
            },
            { classes: { $in: [user.class, 'ALL'] } },
          ],
          at: { $lte: new Date().getTime() },
        };
      }
      delete query.userId;
    }

    let aggregate = [{ $match: query }, { $sort: sort }, { $skip: skip }];

    if (limit) {
      aggregate.push({ $limit: limit });
    }

    aggregate = [
      ...aggregate,
      {
        $lookup: {
          from: 'user',
          let: {
            userIds: {
              $map: { input: '$replies', as: 'reply', in: '$$reply.studentId' },
            },
          },
          pipeline: [
            {
              $match: {
                $expr: { $in: ['$userId', { $ifNull: ['$$userIds', []] }] },
              },
            },
            {
              $project: {
                _id: 0,
                userId: 1,
                name: 1,
                class: 1,
                faculty: 1,
              },
            },
            {
              $group: {
                _id: {
                  userId: '$userId',
                  name: '$name',
                  class: '$class',
                  faculty: '$faculty',
                },
              },
            },
            {
              $replaceRoot: {
                newRoot: {
                  userId: '$_id.userId',
                  name: '$_id.name',
                  class: '$_id.class',
                  faculty: '$_id.faculty',
                },
              },
            },
          ],
          as: 'read',
        },
      },
      {
        $addFields: {
          read: {
            $map: {
              input: '$read',
              as: 'c',
              in: {
                userId: '$$c.userId',
                name: '$$c.name',
                class: '$$c.class',
                faculty: '$$c.faculty',
                data: {
                  $arrayElemAt: [
                    '$replies.data',
                    {
                      $indexOfArray: ['$replies.userId', '$$c.userId'],
                    },
                  ],
                },
              },
            },
          },
        },
      },
    ];

    const announcements = await Announcement.aggregate(aggregate);
    // .sort(sort)
    // .skip(skip)
    // .limit(limit);

    const totalCount = await Announcement.count(query);

    return res.status(200).json({ announcements, totalCount });
  };

  create = async (req, res) => {
    try {
      let { title, body, from, at, faculties, classes, students } = req.body;
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

      const announcement = await Announcement.create({
        ...req.body,
        id: Date.now(),
        files,
      });

      const query = {};
      const coursesOfFaculties = faculties?.length
        ? faculties.filter((faculty) => faculty.includes('('))
        : [];

      faculties = faculties?.length
        ? faculties.filter((faculty) => !faculty.includes('('))
        : [];

      if (faculties?.length && !faculties.includes('ALL')) {
        query.faculty = { $in: faculties };
      }

      if (classes?.length && !classes.includes('ALL')) {
        query.class = { $in: classes };
      }

      if (students?.length) {
        query.userId = { $in: students };
      }

      const courseQuery = [];

      coursesOfFaculties.forEach((course) => {
        const part = course.split(' (');
        courseQuery.push({
          $and: [
            { faculty: part[0] },
            {
              class: {
                $regex: `${part[1].substring(0, 3)}.*`,
                $options: 'i',
              },
            },
          ],
        });
      });

      const queryString = [...courseQuery];
      if (Object.keys(query).length !== 0) {
        queryString.push(query);
      }

      const deviceTokens = await User.find(
        { $or: queryString },
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
      console.log(err);
      return res.status(400).json(err);
    }
  };

  update = async (req, res) => {
    const { id } = req.params;
    console.log(req.body);

    const { title, body, from, at, curFiles } = req.body;
    let faculties = req.body.faculties || [];
    let classes = req.body.classes || [];
    delete req.body.replies;
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
      { ...req.body, files, faculties, classes },
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
    }

    const query = {};
    const coursesOfFaculties = announcement.faculties?.length
      ? announcement.faculties.filter((faculty) => faculty.includes('('))
      : [];

    faculties = announcement.faculties?.length
      ? announcement.faculties.filter((faculty) => !faculty.includes('('))
      : [];

    if (faculties?.length && !faculties.includes('ALL')) {
      query.faculty = { $in: faculties };
    }

    if (announcement.classes?.length && !announcement.classes.includes('ALL')) {
      query.class = { $in: announcement.classes };
    }

    if (announcement.students?.length) {
      query.userId = { $in: announcement.students };
    }

    const courseQuery = [];

    coursesOfFaculties.forEach((course) => {
      const part = course.split(' (');
      courseQuery.push({
        $and: [
          { faculty: part[0] },
          {
            class: {
              $regex: `${part[1].substring(0, 3)}.*`,
              $options: 'i',
            },
          },
        ],
      });
    });

    const queryString = [...courseQuery];
    if (Object.keys(query).length !== 0) {
      queryString.push(query);
    }

    const deviceTokens = await User.find(
      { $or: queryString },
      { _id: 0, deviceToken: 1 }
    );

    if (deviceTokens.length) {
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
