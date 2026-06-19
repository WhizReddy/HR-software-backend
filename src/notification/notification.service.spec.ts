import { Types } from 'mongoose';
import { NotificationService } from './notification.service';

jest.mock('mongoose-unique-validator', () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe('NotificationService', () => {
  const createService = (
    notificationModel: Record<string, unknown> = {},
    userModel: Record<string, unknown> = {},
  ) => new NotificationService(notificationModel as never, userModel as never);

  it('does not save event notifications while reading unread state for a user', async () => {
    const userId = new Types.ObjectId();
    const save = jest.fn();
    const eventNotification = {
      readers: [userId],
      isRead: true,
      save,
    };
    const sort = jest.fn().mockResolvedValue([eventNotification]);
    const find = jest.fn().mockReturnValue({ sort });
    const service = createService({ find });

    const result = await (
      service as unknown as {
        getEventNotifications: (
          userObjectId: Types.ObjectId,
          startDate: Date,
          endDate: Date,
        ) => Promise<Array<typeof eventNotification>>;
      }
    ).getEventNotifications(userId, new Date('2026-01-01'), new Date());

    expect(result[0].isRead).toBe(false);
    expect(save).not.toHaveBeenCalled();
  });

  it('returns applicant notifications without deleting or creating summary notifications on read', async () => {
    const notifications = Array.from({ length: 6 }, () => ({
      isDeleted: false,
      isRead: false,
      save: jest.fn(),
    }));
    const sort = jest.fn().mockResolvedValue(notifications);
    const find = jest.fn().mockReturnValue({ sort });
    const service = createService({ find });
    const createNotification = jest.spyOn(service, 'createNotification');

    const result = await (
      service as unknown as {
        getNotificationsOfApplicants: (
          user: { role: string },
          startDate: Date,
          endDate: Date,
        ) => Promise<typeof notifications>;
      }
    ).getNotificationsOfApplicants(
      { role: 'hr' },
      new Date('2026-01-01'),
      new Date(),
    );

    expect(result).toHaveLength(6);
    expect(createNotification).not.toHaveBeenCalled();
    notifications.forEach((notification) => {
      expect(notification.isDeleted).toBe(false);
      expect(notification.isRead).toBe(false);
      expect(notification.save).not.toHaveBeenCalled();
    });
  });

  it('marks only unread notifications as read in bulk', async () => {
    const unreadId = new Types.ObjectId();
    const readId = new Types.ObjectId();
    const service = createService();
    const getNotificationsByUserId = jest
      .spyOn(service, 'getNotificationsByUserId')
      .mockResolvedValue([
        { _id: unreadId, isRead: false },
        { _id: readId, isRead: true },
      ] as never);
    const update = jest.spyOn(service, 'update').mockResolvedValue({} as never);

    const result = await service.markAllAsRead('user-1', 'week');

    expect(result).toEqual({ updated: 1 });
    expect(getNotificationsByUserId).toHaveBeenCalledWith('user-1', 'week');
    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith(unreadId.toString(), 'user-1');
  });

  it('returns no applicant notifications for non-HR users', async () => {
    const find = jest.fn();
    const service = createService({ find });

    const result = await (
      service as unknown as {
        getNotificationsOfApplicants: (
          user: { role: string },
          startDate: Date,
          endDate: Date,
        ) => Promise<unknown[]>;
      }
    ).getNotificationsOfApplicants(
      { role: 'dev' },
      new Date('2026-01-01'),
      new Date(),
    );

    expect(result).toEqual([]);
    expect(find).not.toHaveBeenCalled();
  });
});
