import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { ObjectId } from 'mongodb';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Event, PollOption } from '../common/schema/event.schema';
import { NotificationService } from 'src/notification/notification.service';
import { NotificationType } from 'src/common/enum/notification.enum';
import { User } from 'src/common/schema/user.schema';
import { VoteDto } from './dto/vote.dto';
import { FirebaseService } from 'src/firebase/firebase.service';
import { Auth } from 'src/common/schema/auth.schema';
import { MailService } from 'src/mail/mail.service';
import {
  validatePollData,
  validateDate,
  getAllParticipants,
  getParticipantsByUserId,
} from './events.utils';
import {
  addVote,
  removeVote,
  getEventPollResults,
  getOptionThatUserVotedFor,
} from './events.poll';
import { paginate } from 'src/common/util/pagination';
@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<Event>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Auth.name) private authModel: Model<Auth>,
    private notificationService: NotificationService,
    private readonly firebaseService: FirebaseService,
    private readonly mailService: MailService,
  ) {}

  async create(
    files: Express.Multer.File[],
    createEventDto: CreateEventDto,
  ): Promise<Event> {
    try {
      let eventPhotos: string[] = [];
      if (files && files.length > 0) {
        eventPhotos = await Promise.all(
          files.map(async (file) => {
            return await this.firebaseService.uploadFile(file, 'eventPhoto');
          }),
        );
      }
      const createdEvent = new this.eventModel({
        ...createEventDto,
        photo: eventPhotos,
      });

      if (!createdEvent) {
        throw new InternalServerErrorException('Event could not be created');
      }
      let participants: ObjectId[] = [];
      if (
        createEventDto.participants &&
        createEventDto.participants.length > 0
      ) {
        participants = await getParticipantsByUserId(
          this.userModel,
          this.authModel,
          createEventDto.participants,
        );
        createdEvent.participants = participants;
        if (participants.length !== createEventDto.participants.length) {
          throw new NotFoundException('Some participants not found');
        }
      }

      if (!createdEvent.endDate && createdEvent.startDate) {
        createdEvent.endDate = createdEvent.startDate;
      }

      validateDate(
        createdEvent.startDate?.toISOString(),
        createdEvent.endDate?.toISOString(),
      );

      if (createdEvent.poll) {
        createdEvent.poll = validatePollData(createdEvent.poll);
        createdEvent.poll.options.forEach((opt) => {
          opt.votes = 0;
          opt.voters = [];
        });
      }
      let readers: ObjectId[] = [];
      if (participants.length === 0) {
        readers = (await this.userModel.find().select('_id')).map(
          (user) => user._id as ObjectId,
        );
      } else {
        readers = participants;
      }

      await this.notificationService.createNotification(
        'Event Created',
        `Event ${createdEvent.title} has been created`,
        NotificationType.EVENT,
        new Date(),
        createdEvent._id as Types.ObjectId,
        readers,
      );

      await this.mailService.sendMail({
        to:
          createEventDto.participants?.length === 0 ||
          !createEventDto.participants
            ? await getAllParticipants(this.userModel, this.authModel)
            : createEventDto.participants,
        subject: `${createdEvent.title} - ${createdEvent.type}`,
        template: './event',
        context: {
          name: `${createdEvent.description}`,
        },
      });

      return await createdEvent.save();
    } catch (error) {
      throw new ConflictException(error);
    }
  }
  async findAll(
    search: string,
    type: string,
    month?: boolean,
    page?: number,
    limit?: number,
  ): Promise<Event[]> {
    try {
      const filter: FilterQuery<Event> = {};
      filter.isDeleted = false;
      if (search) {
        filter.title = { $regex: search, $options: 'i' };
      }
      if (month) {
        filter.startDate = {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          $lte: new Date(
            new Date().getFullYear(),
            new Date().getMonth() + 1,
            0,
          ),
        };
      }
      if (type) {
        filter.type = type;
      } else {
        filter.type = { $ne: 'career' };
      }
      if (!page && !limit) {
        return await this.eventModel.find(filter).sort({ createdAt: -1 });
      }
      return await paginate(page, limit, this.eventModel, filter, {
        createdAt: -1,
      });
    } catch (error) {
      throw new ConflictException(error);
    }
  }

  async findCareerEvents() {
    try {
      return await this.eventModel
        .find({ type: 'career', isDeleted: false })
        .sort({ createdAt: -1 });
    } catch (error) {
      throw new ConflictException(error);
    }
  }

  async findOne(id: string): Promise<Event> {
    try {
      const event = await this.eventModel.findById(id);
      if (event.participants.length === 0) {
        event.participants = await getAllParticipants(
          this.userModel,
          this.authModel,
        );
      } else {
        const updatedParticipants: string[] = [];
        for (const participant of event.participants) {
          const user = await this.userModel.findById(participant);
          const auth = await this.authModel.findById(user.auth);
          updatedParticipants.push(auth.email);
        }
        event.participants = updatedParticipants;
      }
      if (!event || event.isDeleted) {
        throw new NotFoundException(`Event with id ${id} not found`);
      }
      return event;
    } catch (error) {
      throw new ConflictException(error);
    }
  }

  async update(
    id: string,
    updateEventDto: UpdateEventDto,
    photos?: Express.Multer.File[],
  ): Promise<Event> {
    try {
      let eventPhotos: string[] = [];
      if (photos && photos.length > 0) {
        eventPhotos = await Promise.all(
          photos.map(async (photo) => {
            return await this.firebaseService.uploadFile(photo, 'eventPhoto');
          }),
        );
      }
      const existingEvent = await this.eventModel.findById(id);
      if (!existingEvent) {
        throw new NotFoundException(`Event with id ${id} not found`);
      }

      if (!existingEvent.poll && updateEventDto.poll) {
        validatePollData(updateEventDto.poll);
        updateEventDto.poll.options = updateEventDto.poll.options.map(
          (opt) => ({
            ...opt,
            votes: 0,
            voters: [],
          }),
        );
      }
      if (
        updateEventDto.participants &&
        updateEventDto.participants.length > 0
      ) {
        var participants = await getParticipantsByUserId(
          this.userModel,
          this.authModel,
          updateEventDto.participants,
        );
        if (participants.length !== updateEventDto.participants.length) {
          throw new NotFoundException('Some participants not found');
        }
      }
      let readers: ObjectId[] = [];
      if (participants.length === 0) {
        readers = (await this.userModel.find().select('_id')).map(
          (user) => user._id as ObjectId,
        );
      } else {
        readers = participants;
      }

      const updatedEvent = await this.eventModel.findByIdAndUpdate(
        id,
        {
          ...updateEventDto,
          participants: participants,
          photo: eventPhotos.length > 0 ? eventPhotos : existingEvent.photo,
        },
        { new: true },
      );
      validateDate(
        updatedEvent.startDate?.toISOString(),
        updatedEvent.endDate?.toISOString(),
      );
      await this.notificationService.createNotification(
        'Event Updated',
        `Event ${updatedEvent.title} has been updated`,
        NotificationType.EVENT,
        new Date(),
        updatedEvent._id as Types.ObjectId,
        readers,
      );
      return updatedEvent;
    } catch (error) {
      throw new ConflictException(error);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const result = await this.eventModel.findById(id);
      if (!result) {
        throw new NotFoundException(`Event with id ${id} not found`);
      }
      await this.eventModel.findByIdAndUpdate(
        id,
        { isDeleted: true },
        { new: true },
      );
      await this.notificationService.createNotification(
        'Event Deleted',
        `Event ${result.title} has been deleted`,
        NotificationType.EVENT,
        new Date(),
        result._id as Types.ObjectId,
      );
    } catch (error) {
      throw new ConflictException(error);
    }
  }

  async addVote(id: string, vote: VoteDto): Promise<Event> {
    return addVote(this.eventModel, this.userModel, id, vote);
  }

  async removeVote(id: string, vote: VoteDto): Promise<Event> {
    return removeVote(this.eventModel, this.userModel, id, vote);
  }

  async getEventPollResults(id: string): Promise<PollOption[]> {
    return getEventPollResults(this.eventModel, id);
  }

  async getOptionThatUserVotedFor(id: string, userId: string): Promise<number> {
    return getOptionThatUserVotedFor(
      this.eventModel,
      this.userModel,
      id,
      userId,
    );
  }
  async getEventsByUserId(
    id: string,
    search: string,
    page: number,
    limit: number,
  ): Promise<Event[]> {
    try {
      const user = await this.userModel.findById(id);
      if (!user) {
        throw new NotFoundException(`User with id ${id} not found`);
      }
      const filter: FilterQuery<Event> = {};
      filter.participants = { $elemMatch: { $eq: new Types.ObjectId(id) } };
      if (search) {
        filter.title = { $regex: search, $options: 'i' };
      }
      filter.isDeleted = false;
      filter.type = { $ne: 'career' };
      if (!page && !limit) {
        return await this.eventModel.find(filter).sort({ createdAt: -1 });
      }
      return await paginate(page, limit, this.eventModel, filter, {
        createdAt: -1,
      });
    } catch (error) {
      throw new ConflictException(error);
    }
  }
}
