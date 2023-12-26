import Bull from 'bull';
import notificationController from '../controllers/notification.controller.js';
import announcementController from '../controllers/announcement.controller.js';
import { REDIS_HOST, REDIS_PASSWORD, REDIS_PORT } from '../configs/constant.js';

class Queue {
  constructor() {
    this.completed = null;
    this.failed = null;
    this.schedule = null;
    this.examSchedule = null;
    this.scheduleUpdate = null;
    this.event = null;
  }

  load = () => {
    const redisConnection = {
      redis: {
        port: REDIS_PORT,
        host: REDIS_HOST,
        password: REDIS_PASSWORD,
        tls: {},
        // keepAlive: 10000,
      },
    };

    this.completed = new Bull('completed', redisConnection);
    this.completed.process(this.removeJob);

    this.failed = new Bull('failed', redisConnection);
    this.failed.process(this.removeJob);

    this.schedule = new Bull('schedule', redisConnection);
    this.schedule.process(
      notificationController.handleScheduleNotificationJobQueue
    );

    this.examSchedule = new Bull('examSchedule', redisConnection);
    this.examSchedule.process(
      notificationController.handleExamScheduleNotificationJobQueue
    );

    this.announcement = new Bull('announcement', redisConnection);
    this.announcement.process(
      announcementController.handleAnnouncementJobQueue
    );

    this.scheduleUpdate = new Bull('scheduleUpdate', redisConnection);
    this.scheduleUpdate.process(
      notificationController.handleScheduleUpdateNotificationJobQueue
    );

    this.event = new Bull('event', redisConnection);
    this.event.process(
      notificationController.handleEventNotificationJobQueue
    );

    this.setUpListeners('schedule');
    this.setUpListeners('examSchedule');
    this.setUpListeners('announcement');
    this.setUpListeners('scheduleUpdate');
    this.setUpListeners('event');
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

    this[queue].on('error', (error) => {
      throw error;
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
