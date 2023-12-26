import ScheduleNote from '../models/schedule-note.js';

class ScheduleNoteController {
  constructor() {}

  get = async (req, res) => {
    const { scheduleId, userId } = req.params;
    const scheduleNote = await ScheduleNote.findOne(
      { scheduleId, userId },
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

  update = async (req, res) => {
    const { userId, scheduleId, text } = req.body;
    try {
      const scheduleNote = await ScheduleNote.findOne({
        userId,
        scheduleId,
      });

      if (scheduleNote) {
        if (text) {
          return res.status(200).json(
            await ScheduleNote.findOneAndUpdate(
              {
                userId,
                scheduleId,
              },
              { text },
              { new: true }
            )
          );
        } else {
          return res.status(200).json(
            await ScheduleNote.findOneAndDelete({
              userId,
              scheduleId,
            })
          );
        }
      } else {
        return res.status(200).json(
          await ScheduleNote.create({
            ...req.body,
          })
        );
      }
    } catch (err) {
      console.log(
        '🚀 ~ file: scheduleNote.controller.js:98 ~ ScheduleNoteController ~ update= ~ err:',
        err
      );
      return res.status(400).json(err);
    }
  };
}

const scheduleNoteController = new ScheduleNoteController();
export default scheduleNoteController;
