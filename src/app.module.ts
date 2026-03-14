import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { AssetModule } from './asset/asset.module';
import { AuthModule } from './auth/auth.module';
import { EventsModule } from './events/events.module';
import { VacationModule } from './vacation/vacation.module';
import { NotificationModule } from './notification/notification.module';
import { NoteModule } from './note/note.module';
import { ApplicantsModule } from './applicants/applicant.module';
import { MailModule } from './mail/mail.module';
import { FirebaseModule } from './firebase/firebase.module';
import { SalaryModule } from './salary/salary.module';
import { ProjectModule } from './project/project.module';
import { RatingsModule } from './ratings/ratings.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 20, // Increased from 5 to 20
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 100, // Increased from 25 to 100
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 500, // Increased from 200 to 500
      },
    ]),
    ScheduleModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGODB_URI),
    UserModule,
    AssetModule,
    AuthModule,
    EventsModule,
    NotificationModule,
    NoteModule,
    VacationModule,
    ApplicantsModule,
    MailModule,
    FirebaseModule,
    SalaryModule,
    ProjectModule,
    RatingsModule,
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
