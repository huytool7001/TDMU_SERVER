import Event from '../models/event.js';
import User from '../models/user.js';
import queue from '../utils/queue.js';
import { MS_DIFF } from '../configs/constant.js';
class EventController {
  constructor() {}

  get = async (req, res) => {
    const { id } = req.params;
    const event = await Event.findOne(
      { id },
      { _id: 0, createdAt: 0, updatedAt: 0, __v: 0 }
    );
    if (!event) {
      return res.status(400).json({ error: 'Schedule note not found' });
    }
    return res.status(200).json(event);
  };

  search = async (req, res) => {
    let { query } = req;
    console.log(
      '🚀 ~ file: event.controller.js:22 ~ EventController ~ search= ~ query:',
      query
    );

    const limit = query && query.limit ? parseInt(query.limit) : 0;
    const skip = query && query.skip ? parseInt(query.skip) : 0;
    const sort = query && query.sort ? JSON.parse(query.sort) : { id: 1 };

    delete query.limit;
    delete query.skip;
    delete query.sort;

    const events = await Event.find(query).sort(sort).skip(skip).limit(limit);

    return res.status(200).json(events);
  };

  create = async (req, res) => {
    try {
      const event = await Event.create({
        ...req.body,
        id: Date.now(),
      });

      const user = await User.findOne({ userId: event.userId });
      if (user) {
        if (
          event.start - new Date().getTime() - MS_DIFF - user.timer.event >
          0
        ) {
          queue.event.add(
            { title: event.title, deviceToken: user.deviceToken },
            {
              jobId: event.id,
              delay:
                event.start - new Date().getTime() - MS_DIFF - user.timer.event,
            }
          );
        }
      }

      return res.status(200).json(event);
    } catch (err) {
      console.log(
        '🚀 ~ file: event.controller.js:98 ~ EventController ~ create= ~ err:',
        err
      );
      return res.status(400).json(err);
    }
  };

  update = async (req, res) => {
    const { id } = req.params;
    console.log(req.body);

    const event = await Event.findOneAndUpdate({ id }, req.body);

    if (!event) {
      return res.status(400).json({ error: 'Event not found' });
    }

    if (event.start !== req.body.start) {
      const user = await User.findOne({ userId: event.userId });
      if (user) {
        const job = await queue.event.getJob(id);
        if (job) {
          await job.remove();
        }

        if (
          event.start - new Date().getTime() - MS_DIFF - user.timer.event >
          0
        ) {
          queue.event.add(
            { title: event.title, deviceToken: user.deviceToken },
            {
              jobId: event.id,
              delay:
                event.start - new Date().getTime() - MS_DIFF - user.timer.event,
            }
          );
        }
      }
    }

    return res.status(200).json(event);
  };

  delete = async (req, res) => {
    const { id } = req.params;
    const event = await Event.findOneAndDelete({ id });

    if (!event) {
      return res.status(400).json({ error: 'Event not found' });
    }

    const job = await queue.event.getJob(id);
    if (job) {
      await job.remove();
    }

    return res.status(200).json(event);
  };
}

const eventController = new EventController();
export default eventController;
