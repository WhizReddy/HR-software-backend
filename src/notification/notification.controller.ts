import { Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { Notification } from '../common/schema/notification.schema';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  findAll(): Promise<Notification[]> {
    return this.notificationService.findAll();
  }
  @Get('user/:id')
  findByUserId(
    @Param('id') id: string,
    @Query('period') period: string,
  ): Promise<Notification[]> {
    return this.notificationService.getNotificationsByUserId(id, period);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Notification> {
    return this.notificationService.findOne(id);
  }
  @Patch(':id/user/:userId')
  updateNotification(
    @Param('id') id: string,
    @Param('userId') userId: string,
  ): Promise<Notification> {
    return this.notificationService.update(id, userId);
  }
}
