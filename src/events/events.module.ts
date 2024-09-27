import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { Event, EventSchema } from '../common/schema/event.schema';
import { NotificationModule } from 'src/notification/notification.module';
import { User, UserSchema } from 'src/common/schema/user.schema';
import { MailModule } from 'src/mail/mail.module';
import { FirebaseModule } from 'src/firebase/firebase.module';
import { Auth, AuthSchema } from 'src/common/schema/auth.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Event.name, schema: EventSchema }]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: Auth.name, schema: AuthSchema }]),
    NotificationModule,
    MailModule,
    FirebaseModule,
  ],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
