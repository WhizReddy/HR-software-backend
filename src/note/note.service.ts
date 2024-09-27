import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Note } from '../common/schema/note.schema';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { NotificationService } from 'src/notification/notification.service';
import { NotificationType } from 'src/common/enum/notification.enum';
import { User } from 'src/common/schema/user.schema';
import { DateTime } from 'luxon';

@Injectable()
export class NoteService {
  constructor(
    @InjectModel(Note.name) private noteModel: Model<Note>,
    @InjectModel(User.name) private userModel: Model<User>,
    private notificationService: NotificationService,
  ) {}

  async create(createNoteDto: CreateNoteDto): Promise<Note> {
    try {
      createNoteDto.userId = new Types.ObjectId(createNoteDto.userId);
      const createdNote = new this.noteModel(createNoteDto);
      await this.validateNoteData(createdNote);
      return createdNote.save();
    } catch (error) {
      throw new ConflictException(error);
    }
  }

  async findAll(): Promise<Note[]> {
    try {
      return this.noteModel.find({ isDeleted: false });
    } catch (error) {
      throw new ConflictException(error);
    }
  }

  async findAllByUser(userId: string): Promise<Note[]> {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new BadRequestException('User not found');
      }
      return this.noteModel
        .find({ userId: new Types.ObjectId(userId), isDeleted: false })
        .sort({ date: 'asc' });
    } catch (error) {
      throw new ConflictException(error);
    }
  }

  async findOne(id: string): Promise<Note> {
    try {
      const note = await this.noteModel.findById(id);
      if (!note || note.isDeleted) {
        throw new BadRequestException('Note not found');
      }
      return note;
    } catch (error) {
      throw new ConflictException(error);
    }
  }

  async update(id: string, updateNoteDto: UpdateNoteDto): Promise<Note> {
    try {
      const exsistingNote = await this.noteModel.findById(id);
      if (!exsistingNote) {
        throw new BadRequestException('Note not found');
      }
      const updatedNote = await this.noteModel.findByIdAndUpdate(
        id,
        updateNoteDto,
        { new: true },
      );
      await this.validateNoteData(updatedNote);
      return updatedNote;
    } catch (error) {
      throw new ConflictException(error);
    }
  }

  async getNotesByDate(userId: string, dateString: string): Promise<Note[]> {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        throw new BadRequestException('Invalid date format');
      }

      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      const notes = await this.noteModel
        .find({
          userId: new Types.ObjectId(userId),
          date: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
          isDeleted: false,
        })
        .sort({ date: 'asc' });

      return notes;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new ConflictException(error);
    }
  }

  async remove(id: string): Promise<Note> {
    try {
      const note = await this.noteModel.findByIdAndUpdate(
        id,
        { isDeleted: true },
        { new: true },
      );
      if (!note) {
        throw new BadRequestException('Note not found');
      }
      if (note.willBeReminded) {
        await this.notificationService.updateNotification(
          'Note: ' + note.title + ' deleted!',
          note.description,
          NotificationType.NOTE,
          note._id as Types.ObjectId,
          note.date,
          note.isDeleted,
        );
      }
      return note;
    } catch (error) {
      throw new ConflictException(error);
    }
  }

  private async checkDate(dateString: string): Promise<Date> {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    const now = DateTime.now();
    const givenDate = DateTime.fromJSDate(date);

    if (givenDate <= now) {
      throw new BadRequestException('Date must be in the future');
    }

    return date;
  }

  private async validateNoteData(note: Note) {
    if (note.willBeReminded) {
      if (!note.date) {
        throw new BadRequestException('Date is required for reminder');
      }
      note.date = await this.checkDate(note.date as unknown as string);
      if (note.userId) {
        const user = await this.userModel.findById(note.userId);
        if (!user) {
          throw new BadRequestException('User not found');
        }
      }
      await this.notificationService.createNotification(
        'Note: ' + note.title,
        note.description,
        NotificationType.NOTE,
        note.date,
        note._id as Types.ObjectId,
      );
    }
  }
}
