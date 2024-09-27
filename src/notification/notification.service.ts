import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification } from '../common/schema/notification.schema';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationType } from 'src/common/enum/notification.enum';
import { User } from 'src/common/schema/user.schema';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<Notification>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async createNotification(
    title: string,
    content: string,
    type: NotificationType,
    date: Date,
    typeId?: Types.ObjectId,
    readers?: Types.ObjectId[],
  ): Promise<Notification> {
    try {
      const createNotificationDto: CreateNotificationDto = {
        title,
        content,
        type,
        typeId: typeId || new Types.ObjectId(),
        isRead: false,
        date,
        readers: readers || [],
      };
      const createdNotification = new this.notificationModel(
        createNotificationDto,
      );
      return createdNotification.save();
    } catch (error) {
      throw new ConflictException(
        'Failed to create notification',
        error.message,
      );
    }
  }

  async findAll(): Promise<Notification[]> {
    try {
      return this.notificationModel.find({ isDeleted: false });
    } catch (error) {
      throw new ConflictException(
        'Failed to fetch notifications',
        error.message,
      );
    }
  }

  async findOne(id: string): Promise<Notification> {
    try {
      const notification = await this.notificationModel.findById(id);
      if (!notification || notification.isDeleted) {
        throw new NotFoundException('Notification not found');
      }
      return notification;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new ConflictException(
        'Failed to fetch notification',
        error.message,
      );
    }
  }

  async update(id: string, userId: string): Promise<Notification> {
    try {
      const updatedNotification = await this.notificationModel.findById(id);
      if (!updatedNotification) {
        throw new NotFoundException('Notification not found');
      }
      if (updatedNotification.type === NotificationType.EVENT) {
        updatedNotification.readers = updatedNotification.readers.filter(
          (reader) => !reader.equals(new Types.ObjectId(userId)),
        );
      }
      updatedNotification.isRead = true;
      updatedNotification.save();

      return updatedNotification;
    } catch (error) {
      throw new ConflictException(
        'Failed to update notification',
        error.message,
      );
    }
  }

  async updateNotification(
    title: string,
    content: string,
    type: NotificationType,
    typeId: Types.ObjectId,
    date: Date,
    isDeleted: boolean,
  ): Promise<Notification> {
    try {
      const updatedNotification = await this.notificationModel.findOneAndUpdate(
        { type, typeId },
        { title, content, date, isDeleted },
        { new: true },
      );

      if (!updatedNotification) {
        throw new NotFoundException(
          `Notification for ${type} with id ${typeId} not found`,
        );
      }

      return updatedNotification;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new ConflictException(
        'Failed to update notification',
        error.message,
      );
    }
  }

  async getNotificationsByUserId(
    id: string,
    period: string = 'today',
  ): Promise<Notification[]> {
    try {
      const user = await this.userModel.findById(id);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const { startDate, endDate } = this.getDateRange(period);
      const userObjectId = new Types.ObjectId(id);

      const noteNotifications = await this.getNoteNotifications(
        userObjectId,
        startDate,
        endDate,
      );
      const applicantNotifications = await this.getNotificationsOfApplicants(
        user,
        startDate,
        endDate,
      );
      const vacationNotifications = await this.getNotificationOfVacation(
        user._id,
        startDate,
        endDate,
      );

      const promotionNotifications = await this.getNotificationOfPromotion(
        user._id,
        startDate,
        endDate,
      );

      const eventNotifications = await this.getEventNotifications(
        userObjectId,
        startDate,
        endDate,
      );
      const allNotifications = [
        ...noteNotifications,
        ...eventNotifications,
        ...applicantNotifications,
        ...vacationNotifications,
        ...promotionNotifications,
      ];
      allNotifications.sort((a, b) => b.date.getTime() - a.date.getTime());
      return allNotifications;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new ConflictException('Failed to get notifications', error.message);
    }
  }

  private getDateRange(period: string): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setHours(0, 0, 0, 0);

    if (period === 'week') {
      startDate.setDate(endDate.getDate() - 7);
    }

    return { startDate, endDate };
  }

  private async getNoteNotifications(
    userObjectId: Types.ObjectId,
    startDate: Date,
    endDate: Date,
  ): Promise<Notification[]> {
    return this.notificationModel.aggregate([
      {
        $lookup: {
          from: 'notes',
          localField: 'typeId',
          foreignField: '_id',
          as: 'noteInfo',
        },
      },
      {
        $match: {
          'noteInfo.userId': userObjectId,
          isDeleted: false,
          date: { $gte: startDate, $lt: endDate },
        },
      },
      {
        $sort: { date: -1 },
      },
      {
        $project: {
          noteInfo: 0,
        },
      },
    ]);
  }
  private async getEventNotifications(
    userObjectId: Types.ObjectId,
    startDate: Date,
    endDate: Date,
  ): Promise<Notification[]> {
    const notification = await this.notificationModel
      .find({
        type: NotificationType.EVENT,
        isDeleted: false,
        date: { $gte: startDate, $lt: endDate },
      })
      .sort({ date: -1 });

    for (let i = 0; i < notification.length; i++) {
      if (notification[i].readers.includes(userObjectId)) {
        notification[i].isRead = false;
        await notification[i].save();
      }
    }
    return notification;
  }

  private async getNotificationsOfApplicants(
    user: User,
    startDate: Date,
    endDate: Date,
  ): Promise<Notification[]> {
    if (user.role !== 'hr') {
      return [];
    }

    const notifications = await this.notificationModel
      .find({
        type: NotificationType.APPLICANT,
        isDeleted: false,
        date: { $gte: startDate, $lt: endDate },
      })
      .sort({ date: -1 });
    if (notifications.length > 5) {
      for (let i = 0; i < notifications.length; i++) {
        notifications[i].isDeleted = true;
        notifications[i].isRead = true;
        await notifications[i].save();
      }
      const allCandidates = await this.createNotification(
        'More than 5 candidates applied',
        'Check the candidates list',
        NotificationType.ALLAPPLICANT,
        new Date(),
      );
      return [allCandidates];
    } else {
      return notifications;
    }
  }
  private async getNotificationOfPromotion(
    userId: Types.ObjectId,
    startDate: Date,
    endDate: Date,
  ): Promise<Notification[]> {
    return this.notificationModel.aggregate([
      {
        $lookup: {
          from: 'promotions',
          localField: 'typeId',
          foreignField: '_id',
          as: 'promotionInfo',
        },
      },
      {
        $match: {
          'promotionInfo.userId': userId,
          isDeleted: false,
          date: { $gte: startDate, $lt: endDate },
        },
      },
      {
        $project: {
          promotionInfo: 0,
        },
      },
    ]);
  }

  private async getNotificationOfVacation(
    userId: Types.ObjectId,
    startDate: Date,
    endDate: Date,
  ): Promise<Notification[]> {
    const user = await this.userModel.findById(userId);
    if (user.role === 'hr') {
      const notifications = await this.notificationModel
        .find({
          type: NotificationType.VACATION,
          title: { $in: ['On Leave Request', 'More than 5 leave requests'] },
          isDeleted: false,
          date: { $gte: startDate, $lte: endDate },
        })
        .sort({ date: -1 });

      if (notifications.length > 5) {
        for (let i = 0; i < notifications.length; i++) {
          notifications[i].isDeleted = true;
          notifications[i].isRead = true;
          await notifications[i].save();
        }
        const allLeaveRequests = await this.createNotification(
          'More than 5 leave requests',
          'Check the leave requests list',
          NotificationType.ALLVACATION,
          new Date(),
        );
        return [allLeaveRequests];
      } else {
        return notifications;
      }
    } else {
      return this.notificationModel.aggregate([
        {
          $lookup: {
            from: 'vacations',
            localField: 'typeId',
            foreignField: '_id',
            as: 'vacationInfo',
          },
        },
        {
          $match: {
            'vacationInfo.userId': userId,
            title: { $ne: 'On Leave Request' },
            isDeleted: false,
            date: { $gte: startDate, $lt: endDate },
          },
        },
        {
          $project: {
            vacationInfo: 0,
          },
        },
      ]);
    }
  }
}
