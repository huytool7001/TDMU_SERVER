import ScheduleNote from '../models/schedule-note.js';

class ScheduleNoteController {
  constructor() {}

  get = async (req, res) => {
    const { id } = req.params;
    const scheduleNote = await ScheduleNote.findOne(
      { id },
      { _id: 0, createdAt: 0, updatedAt: 0, __v: 0 }
    );
    if (!scheduleNote) {
      return res.status(400).json({ error: 'Schedule note not found' });
    }
    return res.status(200).json(scheduleNote);
  };

  search = async (req, res) => {
    let { query } = req;
    console.log(
      '🚀 ~ file: schedule-note.controller.js:22 ~ ScheduleNoteController ~ search= ~ query:',
      query
    );

    const limit = query && query.limit ? parseInt(query.limit) : 0;
    const skip = query && query.skip ? parseInt(query.skip) : 0;
    const sort = query && query.sort ? JSON.parse(query.sort) : { id: 1 };

    delete query.limit;
    delete query.skip;
    delete query.sort;

    const scheduleNotes = await ScheduleNote.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    return res.status(200).json(scheduleNotes);
  };

  create = async (req, res) => {
    try {
      const { userId, scheduleId } = req.body;
      if (!userId || !scheduleId) {
        return res.status(400).json({
          error: 'Please fill in all fields',
        });
      }

      const scheduleNote = await ScheduleNote.create({
        ...req.body,
        id: Date.now(),
      });

      return res.status(200).json(scheduleNote);
    } catch (err) {
      console.log(
        '🚀 ~ file: scheduleNote.controller.js:98 ~ ScheduleNoteController ~ create= ~ err:',
        err
      );
      return res.status(400).json(err);
    }
  };

  update = async (req, res) => {
    const { id } = req.params;
    console.log(req.body);

    const { userId, scheduleId } = req.body;
    if (!userId || !scheduleId) {
      return res.status(400).json({
        error: 'Please fill in all fields',
      });
    }

    const scheduleNote = await ScheduleNote.findOneAndUpdate({ id }, req.body, {
      new: true,
    });

    if (!scheduleNote) {
      return res.status(400).json({ error: 'ScheduleNote not found' });
    }

    return res.status(200).json(scheduleNote);
  };

  delete = async (req, res) => {
    const { id } = req.params;
    const scheduleNote = await ScheduleNote.findOneAndDelete({ id });

    if (!scheduleNote) {
      return res.status(400).json({ error: 'ScheduleNote not found' });
    }

    return res.status(200).json(scheduleNote);
  };
}

const scheduleNoteController = new ScheduleNoteController();
export default scheduleNoteController;
