import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Applicant, ApplicantSchema } from 'src/common/schema/applicant.schema';
import { ApplicantsService } from './applicant.service';
import { ApplicantsController } from './applicant.controller';
import { MailModule } from 'src/mail/mail.module';
import { FirebaseModule } from 'src/firebase/firebase.module';
import { AuthModule } from 'src/auth/auth.module';
import { NotificationModule } from 'src/notification/notification.module';
import { Auth, AuthSchema } from 'src/common/schema/auth.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Applicant.name, schema: ApplicantSchema },
      { name: Auth.name, schema: AuthSchema },
    ]),
    MailModule,
    FirebaseModule,
    AuthModule,
    NotificationModule,
  ],
  controllers: [ApplicantsController],
  providers: [ApplicantsService],
})
export class ApplicantsModule {}
