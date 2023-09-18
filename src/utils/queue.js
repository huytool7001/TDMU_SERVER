import Bull from 'bull';
import notificationController from '../controllers/notification.controller.js';
import announcementController from '../controllers/announcement.controller.js';

class Queue {
  constructor() {
    this.completed = null;
    this.failed = null;
    this.schedule = null;
    this.examSchedule = null;
  }

  load = () => {
    const redisConnection = 'redis://127.0.0.1:6379';

    this.completed = new Bull('completed', redisConnection);
    this.completed.process(this.removeJob);

    this.failed = new Bull('failed', redisConnection);
    this.failed.process(this.removeJob);

    this.schedule = new Bull('schedule', redisConnection);
    this.schedule.process(notificationController.handleScheduleNotificationJobQueue);

    this.examSchedule = new Bull('examSchedule', redisConnection);
    this.examSchedule.process(notificationController.handleExamScheduleNotificationJobQueue);

    this.announcement = new Bull('announcement', redisConnection);
    this.announcement.process(announcementController.handleAnnouncementJobQueue);

    this.setUpListeners('schedule');
    this.setUpListeners('examSchedule');
    this.setUpListeners('announcement');
  };

  setUpListeners = async (queue) => {
    this[queue].on('completed', (job) => {
      this.completed.add(
        { id: job?.id, queue },
        { delay: 1000 * 10 * 60, removeOnComplete: true }
      );
    });

    this[queue].on('failed', (job) => {
      this.failed.add(
        { id: job?.id, queue },
        { delay: 1000 * 10 * 60, removeOnComplete: true }
      );
    });
  };

  removeJob = async (job) => {
    const completedJob = await this[job.data.queue].getJob(job.data.id);
    if (!completedJob) {
      return;
    }
    completedJob.remove();
  };
}

const queue = new Queue();
export default queue;
