import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NoteController } from './note.controller';
import { NoteService } from './note.service';
import { Note, NoteSchema } from '../common/schema/note.schema';
import { NotificationModule } from 'src/notification/notification.module';
import { User, UserSchema } from 'src/common/schema/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Note.name, schema: NoteSchema }]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    NotificationModule,
  ],
  controllers: [NoteController],
  providers: [NoteService],
})
export class NoteModule {}
