import { Module } from '@nestjs/common';
import { VacationService } from './vacation.service';
import { VacationController } from './vacation.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Vacation, VacationSchema } from 'src/common/schema/vacation.schema';
import { User, UserSchema } from 'src/common/schema/user.schema';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Vacation.name, schema: VacationSchema },
      { name: User.name, schema: UserSchema },
    ]),
    NotificationModule,
  ],
  providers: [VacationService],
  controllers: [VacationController],
})
export class VacationModule {}
