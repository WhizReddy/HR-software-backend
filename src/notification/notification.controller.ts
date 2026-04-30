import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Query,
  Req,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { Notification } from '../common/schema/notification.schema';
import { Roles } from 'src/common/decorator/roles.decorator';
import { Role } from 'src/common/enum/role.enum';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Roles(Role.ADMIN, Role.HR)
  @Get()
  findAll(): Promise<Notification[]> {
    return this.notificationService.findAll();
  }

  @Get('user/:id')
  findByUserId(
    @Param('id') id: string,
    @Query('period') period: string,
    @Req() req: any,
  ): Promise<Notification[]> {
    const requester = req['user'];
    const hasElevatedAccess =
      requester?.role === Role.ADMIN || requester?.role === Role.HR;

    if (!hasElevatedAccess && requester?.sub !== id) {
      throw new ForbiddenException('You can only view your own notifications');
    }

    return this.notificationService.getNotificationsByUserId(id, period);
  }

  @Roles(Role.ADMIN, Role.HR)
  @Get(':id')
  findOne(@Param('id') id: string): Promise<Notification> {
    return this.notificationService.findOne(id);
  }

  @Patch(':id/user/:userId')
  updateNotification(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Req() req: any,
  ): Promise<Notification> {
    const requester = req['user'];
    const hasElevatedAccess =
      requester?.role === Role.ADMIN || requester?.role === Role.HR;

    if (!hasElevatedAccess && requester?.sub !== userId) {
      throw new ForbiddenException(
        'You can only update your own notifications',
      );
    }

    return this.notificationService.update(id, userId);
  }
}
